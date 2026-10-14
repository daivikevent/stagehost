'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';
import type { Inquiry, InquiryStatus } from '@/types';
import { sendInquiryAlertEmail } from '@/lib/email';
import { sendPushNotificationToAnchor } from '@/lib/actions/push';
import { sendWhatsAppInquiryAlert } from '@/lib/whatsapp';
import {
  generateVerificationSession,
  verifyOTPSession,
  validateVerifiedProof,
  sendClientVerificationOTP,
  sanitizeIndianPhone,
} from '@/lib/phone-verification';

// ---- Request Phone Verification OTP (Public) ----
export async function requestInquiryOTP(phone: string, artistSlug?: string) {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  let artistName = 'Artist';
  if (artistSlug) {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('name')
      .eq('slug', artistSlug)
      .maybeSingle();
    if (profile?.name) {
      artistName = profile.name;
    }
  }

  const { code, token } = generateVerificationSession(cleanPhone);

  // Send via WhatsApp if available
  const result = await sendClientVerificationOTP({
    phone: cleanPhone,
    code,
    artistName,
  });

  // Check if running in development or sandbox (no real WhatsApp business API connected)
  const isSandbox = result.simulated || !process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN.includes('placeholder');

  return {
    success: true,
    verificationToken: token,
    // Provide demo code in sandbox/development so clients can easily complete verification
    demoCode: isSandbox ? code : undefined,
    isSimulated: isSandbox,
  };
}

// ---- Verify Phone OTP (Public) ----
export async function verifyInquiryOTP(phone: string, code: string, verificationToken: string) {
  const result = verifyOTPSession(phone, code, verificationToken);
  if (!result.valid) {
    throw new Error(result.error || 'Invalid verification code');
  }

  return {
    success: true,
    verifiedProofToken: result.verifiedProofToken,
  };
}

// ---- Submit inquiry (public — no auth required) ----
export async function submitInquiry(
  profileSlug: string,
  formData: {
    name: string;
    email?: string;
    phone: string;
    message?: string;
    event_date?: string;
    event_type?: string;
    event_city?: string;
    budget_range?: string;
    honeypot?: string;
    notes?: string;
  },
  options?: {
    verifiedToken?: string;
    isWhatsAppDirect?: boolean;
    customNotes?: string;
  }
) {
  // 1. Anti-Spam Honeypot Trap: If bots fill the invisible honeypot field, silently drop
  if (formData.honeypot && formData.honeypot.trim().length > 0) {
    console.warn('[Anti-Spam] Bot inquiry caught and blocked via honeypot:', profileSlug);
    return { success: true };
  }

  // 2. Validate & sanitize phone
  const cleanPhone = sanitizeIndianPhone(formData.phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const { honeypot: _hp, notes: userNotes, ...inquiryFields } = formData;
  inquiryFields.phone = cleanPhone;

  // 3. Determine phone verification status
  let isPhoneVerified = false;
  let verificationTag = '';

  if (options?.verifiedToken && validateVerifiedProof(cleanPhone, options.verifiedToken)) {
    isPhoneVerified = true;
    verificationTag = '[PHONE_VERIFIED:otp] Verified via 4-digit mobile security check';
  } else if (options?.isWhatsAppDirect) {
    isPhoneVerified = true;
    verificationTag = '[PHONE_VERIFIED:whatsapp] Verified via 1-Click WhatsApp Direct routing';
  }

  const combinedNotes = [
    verificationTag,
    options?.customNotes,
    userNotes,
  ].filter(Boolean).join('\n\n');

  const adminClient = createAdminClient();

  // Get profile by slug
  const { data: profile, error: profileError } = await adminClient
    .from('anchor_profiles')
    .select('id, user_id, name, email, phone, whatsapp_number, slug')
    .eq('slug', profileSlug)
    .single();

  if (profileError || !profile) {
    throw new Error('Creator profile not found');
  }

  const { error } = await adminClient
    .from('inquiries')
    .insert({
      profile_id: profile.id,
      ...inquiryFields,
      status: 'new',
      source: options?.isWhatsAppDirect ? 'portfolio' : 'portfolio',
      notes: combinedNotes,
    });

  if (error) throw new Error(error.message);

  // 1. Send automated WhatsApp notification alert via Meta WhatsApp Cloud API
  const artistWhatsAppNumber = profile.whatsapp_number || profile.phone;
  if (artistWhatsAppNumber) {
    sendWhatsAppInquiryAlert({
      artistPhone: artistWhatsAppNumber,
      artistName: profile.name || 'Artist',
      clientName: `${formData.name}${isPhoneVerified ? ' (✓ Verified Client)' : ''}`,
      clientPhone: cleanPhone,
      eventType: formData.event_type || 'Event',
      eventDate: formData.event_date || 'TBD',
      eventCity: formData.event_city || 'India',
      budgetRange: formData.budget_range || 'Flexible',
      artistSlug: profile.slug,
    }).catch((waErr) => {
      console.error('[Meta WhatsApp Cloud API] Async delivery error:', waErr);
    });
  }

  // 2. Send real-time email notification via Resend
  if (profile.email) {
    try {
      await sendInquiryAlertEmail({
        anchorEmail: profile.email,
        anchorName: profile.name || 'Anchor',
        inquiry: {
          name: `${formData.name}${isPhoneVerified ? ' (✓ Phone-Verified Client)' : ''}`,
          phone: cleanPhone,
          email: formData.email,
          event_type: formData.event_type,
          event_date: formData.event_date,
          event_city: formData.event_city,
          budget_range: formData.budget_range,
          message: formData.message,
        },
      });
    } catch (emailErr) {
      console.error('[Resend] Email notification error:', emailErr);
    }
  }

  // 3. Trigger web push notification to anchor device
  try {
    const eventDetail = formData.event_type || 'Event';
    const cityDetail = formData.event_city ? ` in ${formData.event_city}` : '';
    const verifiedBadgeText = isPhoneVerified ? '🛡️ Verified Lead: ' : '';
    sendPushNotificationToAnchor(profile.id, {
      title: `${verifiedBadgeText}🔥 New Booking Inquiry!`,
      body: `${formData.name} requested a quote for ${eventDetail}${cityDetail} (📱 ${cleanPhone})`,
      url: '/inquiries',
      tag: `inquiry-${Date.now()}`,
    }).catch((pushErr) => {
      console.error('[WebPush] Async delivery error:', pushErr);
    });
  } catch (pushErr) {
    console.error('[WebPush] Trigger error:', pushErr);
  }

  return { success: true, isPhoneVerified };
}

// ---- Get all inquiries for current user ----
export async function getMyInquiries(status?: InquiryStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const isUserAdmin = await checkIsAdmin();
  let targetUserId = user.id;

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('bookmyartist_impersonate_user_id')?.value || cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      targetUserId = impersonateId;
    }
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', targetUserId)
    .single();

  if (!profile) return [];

  let query = adminClient
    .from('inquiries')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return [];
  return data as Inquiry[];
}

// ---- Update inquiry status ----
export async function updateInquiryStatus(inquiryId: string, status: InquiryStatus, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updates: Record<string, string> = { status };
  if (notes !== undefined) updates.notes = notes;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('inquiries')
    .update(updates)
    .eq('id', inquiryId);

  if (error) throw new Error(error.message);
  revalidatePath('/inquiries');
}

// ---- Get inquiry counts for dashboard ----
export async function getInquiryCounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, new: 0, converted: 0 };

  const isUserAdmin = await checkIsAdmin();
  let targetUserId = user.id;

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('bookmyartist_impersonate_user_id')?.value || cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      targetUserId = impersonateId;
    }
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', targetUserId)
    .single();

  if (!profile) return { total: 0, new: 0, converted: 0 };

  const { data, error } = await adminClient
    .from('inquiries')
    .select('status')
    .eq('profile_id', profile.id);

  if (error || !data) return { total: 0, new: 0, converted: 0 };

  return {
    total: data.length,
    new: data.filter(i => i.status === 'new').length,
    converted: data.filter(i => i.status === 'converted').length,
  };
}

// ---- Create manual/personal lead for anchor CRM ----
export async function createManualInquiry(data: {
  name: string;
  phone: string;
  email?: string;
  event_type?: string;
  event_date?: string;
  event_city?: string;
  budget_range?: string;
  message?: string;
  notes?: string;
  status?: InquiryStatus;
  source?: 'direct' | 'referral' | 'portfolio' | 'directory';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const isUserAdmin = await checkIsAdmin();
  let targetUserId = user.id;

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('bookmyartist_impersonate_user_id')?.value || cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      targetUserId = impersonateId;
    }
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', targetUserId)
    .single();

  if (!profile) throw new Error('Profile not found');

  const insertPayload: Record<string, any> = {
    profile_id: profile.id,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    event_type: data.event_type || '',
    event_city: data.event_city || '',
    budget_range: data.budget_range || '',
    message: data.message || '',
    notes: data.notes || '',
    status: data.status || 'new',
    source: data.source || 'direct',
  };

  if (data.event_date && data.event_date.trim()) {
    insertPayload.event_date = data.event_date.trim();
  }

  const { data: newInquiry, error } = await adminClient
    .from('inquiries')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/inquiries');
  return newInquiry as Inquiry;
}

// ---- Delete inquiry ----
export async function deleteInquiry(inquiryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('inquiries')
    .delete()
    .eq('id', inquiryId);

  if (error) throw new Error(error.message);
  revalidatePath('/inquiries');
}
