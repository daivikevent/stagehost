/**
 * Razorpay Advance Token Order Creation API
 * POST /api/receipt/create-advance-order
 * Creates a Razorpay order for locking a booking slot with an advance token.
 */
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, clientName, clientPhone } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const tokenAmount = Number(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: booking, error: bErr } = await adminClient
      .from('bookings')
      .select('id, event_name, event_type, date, amount, profile:anchor_profiles(name)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isRealKey = keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder');
    const amountPaise = Math.round(tokenAmount * 100);

    if (!isRealKey) {
      // Local development or placeholder key simulation mode
      const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return NextResponse.json({
        success: true,
        orderId: simulatedOrderId,
        amount: amountPaise,
        currency: 'INR',
        keyId: 'rzp_test_placeholder',
        isSimulated: true,
        bookingDetails: {
          eventName: booking.event_name || booking.event_type,
          artistName: (booking.profile as any)?.name || 'Anchor',
          date: booking.date,
        },
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receiptId = `adv_${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 14)}`;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        booking_id: bookingId,
        payment_type: 'token_advance',
        client_name: clientName || '',
        client_phone: clientPhone || '',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isSimulated: false,
      bookingDetails: {
        eventName: booking.event_name || booking.event_type,
        artistName: (booking.profile as any)?.name || 'Anchor',
        date: booking.date,
      },
    });
  } catch (error: any) {
    console.error('Failed to create advance order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
