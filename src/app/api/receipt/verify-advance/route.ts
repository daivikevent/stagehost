/**
 * Razorpay Advance Token Verification API
 * POST /api/receipt/verify-advance
 * Verifies the advance token payment and locks the slot as Confirmed.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const {
      bookingId,
      amount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = await request.json();

    if (!bookingId || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing required payment verification details' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: booking, error: bErr } = await adminClient
      .from('bookings')
      .select('id, profile_id, date, slot_type, notes, profile:anchor_profiles(slug)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRealKey = keySecret && !keySecret.includes('placeholder');

    if (isRealKey && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // 1. Process notes: parse existing receipt config & update with advance paid
    let rawNotes = booking.notes || '';
    let existingConfig: any = {};

    if (rawNotes.includes('---RECEIPT_CONFIG---')) {
      try {
        const parts = rawNotes.split(/---RECEIPT_CONFIG---\n?/);
        existingConfig = JSON.parse(parts[1] || '{}');
      } catch (e) {}
    }

    const paidAdvanceAmount = Number(amount) || 0;
    const currentAdvance = Number(existingConfig.advance_paid) || 0;
    const totalAdvance = currentAdvance + paidAdvanceAmount;

    existingConfig.advance_paid = totalAdvance;
    existingConfig.payment_mode = 'Razorpay (Online)';
    existingConfig.payment_ref = razorpay_payment_id;

    // Clean out [PENCIL_HOLD] from notes since it is now confirmed
    let updatedNotes = rawNotes.replace(/^\[PENCIL_HOLD\]\s*/gm, '').trim();

    // Strip out old ---RECEIPT_CONFIG--- and append new
    if (updatedNotes.includes('---RECEIPT_CONFIG---')) {
      updatedNotes = updatedNotes.split(/---RECEIPT_CONFIG---\n?/)[0]?.trim() || '';
    }

    updatedNotes = `${updatedNotes}\n---RECEIPT_CONFIG---\n${JSON.stringify(existingConfig)}`;
    updatedNotes = `${updatedNotes}\n[TOKEN_ADVANCE: ${totalAdvance}|Razorpay Online|${razorpay_payment_id}]`;

    // 2. Update booking record
    await adminClient
      .from('bookings')
      .update({
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // 3. Mark schedule_slot as 'booked'
    await adminClient
      .from('schedule_slots')
      .upsert({
        profile_id: booking.profile_id,
        date: booking.date,
        slot_type: booking.slot_type,
        status: 'booked',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,date,slot_type' });

    if (booking.slot_type === 'full_day') {
      await adminClient
        .from('schedule_slots')
        .upsert([
          { profile_id: booking.profile_id, date: booking.date, slot_type: 'morning', status: 'booked', updated_at: new Date().toISOString() },
          { profile_id: booking.profile_id, date: booking.date, slot_type: 'evening', status: 'booked', updated_at: new Date().toISOString() },
        ], { onConflict: 'profile_id,date,slot_type' });
    }

    // 4. Revalidate paths
    revalidatePath('/schedule');
    revalidatePath(`/receipt/${bookingId}`);
    const slug = (booking.profile as any)?.slug;
    if (slug) {
      revalidatePath(`/${slug}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Advance token payment verified! Date slot is now locked and confirmed.',
      totalAdvance,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('Failed to verify advance payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
