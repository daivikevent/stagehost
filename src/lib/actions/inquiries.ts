'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Inquiry, InquiryStatus } from '@/types';
import { sendInquiryAlertEmail } from '@/lib/email';

// ---- Submit inquiry (public — no auth required) ----
export async function submitInquiry(profileSlug: string, formData: {
  name: string;
  email?: string;
  phone: string;
  message?: string;
  event_date?: string;
  event_type?: string;
  event_city?: string;
  budget_range?: string;
  honeypot?: string;
}) {
  // 1. Anti-Spam Honeypot Trap: If bots fill the invisible honeypot field, silently drop
  if (formData.honeypot && formData.honeypot.trim().length > 0) {
    console.warn('[Anti-Spam] Bot inquiry caught and blocked via honeypot:', profileSlug);
    return { success: true };
  }

  // 2. Validate & sanitize phone
  const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const { honeypot: _hp, ...inquiryFields } = formData;
  inquiryFields.phone = cleanPhone;

  const supabase = await createClient();

  // Get profile by slug
  const { data: profile, error: profileError } = await supabase
    .from('anchor_profiles')
    .select('id, user_id, name, email')
    .eq('slug', profileSlug)
    .single();

  if (profileError || !profile) {
    // If testing in demo mode where profile isn't in DB yet
    console.log('Demo mode inquiry received for:', profileSlug, inquiryFields);
    return { success: true };
  }

  const { error } = await supabase
    .from('inquiries')
    .insert({
      profile_id: profile.id,
      ...inquiryFields,
      status: 'new',
      source: 'portfolio',
    });

  if (error) throw new Error(error.message);

  // Send real-time email notification via Resend
  if (profile.email) {
    try {
      await sendInquiryAlertEmail({
        anchorEmail: profile.email,
        anchorName: profile.name || 'Anchor',
        inquiry: formData,
      });
    } catch (emailErr) {
      console.error('Email alert trigger error:', emailErr);
    }
  }

  return { success: true };
}

// ---- Get all inquiries for current user ----
export async function getMyInquiries(status?: InquiryStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  let query = supabase
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

  const { error } = await supabase
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

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return { total: 0, new: 0, converted: 0 };

  const { data, error } = await supabase
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

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', user.id)
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

  const { data: newInquiry, error } = await supabase
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

  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', inquiryId);

  if (error) throw new Error(error.message);
  revalidatePath('/inquiries');
}
