'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface AgreementSignaturePayload {
  signerName: string;
  signatureDataUrl: string;
  signerPhone?: string;
  signerEmail?: string;
}

export async function signAgreement(bookingId: string, payload: AgreementSignaturePayload) {
  if (!bookingId || !payload.signerName?.trim() || !payload.signatureDataUrl) {
    return { success: false, error: 'Signer name and digital signature are required.' };
  }

  const adminClient = createAdminClient();

  const { data: booking, error: fetchErr } = await adminClient
    .from('bookings')
    .select('id, notes, client_name, client_phone, client_email')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !booking) {
    return { success: false, error: 'Booking or agreement not found.' };
  }

  const signTimestamp = new Date().toISOString();
  const signHash = `BMA-ESIGN-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const esignData = {
    signed_at: signTimestamp,
    signer_name: payload.signerName.trim(),
    signer_phone: payload.signerPhone?.trim() || booking.client_phone || '',
    signer_email: payload.signerEmail?.trim() || booking.client_email || '',
    signature_data_url: payload.signatureDataUrl,
    status: 'EXECUTED',
    hash: signHash,
  };

  // Merge into booking notes
  let currentNotes = booking.notes || '';
  if (currentNotes.includes('---E_SIGN_DATA---')) {
    currentNotes = currentNotes.replace(/---E_SIGN_DATA---[\s\S]*?(?:---END_E_SIGN---|$)/, '');
  }

  const updatedNotes = `${currentNotes.trim()}\n\n---E_SIGN_DATA---\n${JSON.stringify(esignData, null, 2)}\n---END_E_SIGN---`.trim();

  const { error: updateErr } = await adminClient
    .from('bookings')
    .update({
      notes: updatedNotes,
      client_name: payload.signerName.trim() || booking.client_name,
    })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('Error recording agreement signature:', updateErr);
    return { success: false, error: 'Failed to record signature. Please try again.' };
  }

  revalidatePath(`/agreement/${bookingId}`);
  revalidatePath(`/receipt/${bookingId}`);

  return {
    success: true,
    hash: signHash,
    signedAt: signTimestamp,
    signerName: payload.signerName.trim(),
  };
}
