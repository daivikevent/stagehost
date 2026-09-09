'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { ContactSubmission } from '@/types';

const SETTINGS_KEY = 'contact_submissions';

/**
 * Public Server Action: Submits a query from the Contact Us page.
 * Stores the submission reliably in platform_settings so administrators
 * can view, manage, filter, and reply to it in the Admin Panel.
 */
export async function submitContactInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();
  const phone = (data.phone || '').trim();
  const subject = (data.subject || 'General Support').trim();
  const message = (data.message || '').trim();

  if (!name) throw new Error('Please enter your name');
  if (!email || !email.includes('@')) throw new Error('Please enter a valid email address');
  if (!message) throw new Error('Please enter your message');

  const adminClient = createAdminClient();

  // 1. Fetch existing contact inquiries from platform_settings
  const { data: row, error: fetchErr } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  let existingList: ContactSubmission[] = [];
  if (row?.value) {
    if (Array.isArray(row.value)) {
      existingList = row.value;
    } else if (typeof row.value === 'string') {
      try {
        existingList = JSON.parse(row.value);
      } catch {
        existingList = [];
      }
    }
  }

  // 2. Construct new contact submission record
  const newSubmission: ContactSubmission = {
    id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    email,
    phone: phone || undefined,
    subject,
    message,
    status: 'new',
    created_at: new Date().toISOString(),
  };

  // Prepend to top of list
  const updatedList = [newSubmission, ...existingList];

  // 3. Save back to platform_settings
  const { error: upsertErr } = await adminClient
    .from('platform_settings')
    .upsert({
      key: SETTINGS_KEY,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

  if (upsertErr) {
    console.error('Failed to save contact inquiry to platform_settings:', upsertErr);
    throw new Error('Failed to submit message. Please try again or WhatsApp us directly.');
  }

  // 4. Also record an entry in activity log if available
  try {
    const { data: actRow } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_activity_logs')
      .maybeSingle();

    let actList: any[] = [];
    if (actRow?.value) {
      actList = Array.isArray(actRow.value) ? actRow.value : [];
    }

    const newActivity = {
      id: `act_${Date.now()}`,
      type: 'inquiry',
      description: `New contact inquiry from ${name} (${subject})`,
      created_at: new Date().toISOString(),
      metadata: { email, subject },
    };

    await adminClient
      .from('platform_settings')
      .upsert({
        key: 'platform_activity_logs',
        value: [newActivity, ...actList].slice(0, 50),
        updated_at: new Date().toISOString(),
      });
  } catch (actErr) {
    // Non-blocking
    console.warn('Could not log activity entry:', actErr);
  }

  // 5. Revalidate Admin paths
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/inquiries');

  return { success: true, id: newSubmission.id };
}

/**
 * Admin Action: Fetch all contact inquiries with optional filtering
 */
export async function getContactInquiries(filter?: {
  status?: string;
  search?: string;
}): Promise<ContactSubmission[]> {
  try {
    const adminClient = createAdminClient();
    const { data: row, error } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error || !row?.value) return [];

    let list: ContactSubmission[] = [];
    if (Array.isArray(row.value)) {
      list = row.value;
    } else if (typeof row.value === 'string') {
      try {
        list = JSON.parse(row.value);
      } catch {
        list = [];
      }
    }

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((item) => item.status === filter.status);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          (item.phone && item.phone.includes(q)) ||
          item.subject.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q)
      );
    }

    // Sort descending by creation date
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.error('Error fetching contact inquiries:', err);
    return [];
  }
}

/**
 * Admin Action: Update status or add internal admin notes
 */
export async function updateContactInquiryStatus(
  id: string,
  status: 'new' | 'read' | 'replied' | 'archived',
  adminNotes?: string
) {
  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  let list: ContactSubmission[] = [];
  if (row?.value) {
    list = Array.isArray(row.value) ? row.value : [];
  }

  const updatedList = list.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : item.admin_notes,
      };
    }
    return item;
  });

  await adminClient.from('platform_settings').upsert({
    key: SETTINGS_KEY,
    value: updatedList,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/inquiries');
  return { success: true };
}

/**
 * Admin Action: Delete a contact inquiry
 */
export async function deleteContactInquiry(id: string) {
  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  let list: ContactSubmission[] = [];
  if (row?.value) {
    list = Array.isArray(row.value) ? row.value : [];
  }

  const updatedList = list.filter((item) => item.id !== id);

  await adminClient.from('platform_settings').upsert({
    key: SETTINGS_KEY,
    value: updatedList,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/inquiries');
  return { success: true };
}

/**
 * Admin Action: Get quick statistics for badge counts
 */
export async function getContactInquiryStats() {
  const list = await getContactInquiries();
  return {
    total: list.length,
    newCount: list.filter((i) => i.status === 'new').length,
    readCount: list.filter((i) => i.status === 'read').length,
    repliedCount: list.filter((i) => i.status === 'replied').length,
    archivedCount: list.filter((i) => i.status === 'archived').length,
  };
}
