'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Testimonial } from '@/types';

// ---- Get my testimonials ----
export async function getMyTestimonials() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('testimonials')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
  return data as Testimonial[];
}

// ---- Add testimonial ----
export async function addTestimonial(data: {
  client_name: string;
  client_designation?: string;
  text: string;
  rating?: number;
  event_type?: string;
  event_date?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();

  // Get max sort_order
  const { data: existing } = await adminClient
    .from('testimonials')
    .select('sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data: inserted, error } = await adminClient
    .from('testimonials')
    .insert({
      profile_id: profile.id,
      client_name: data.client_name.trim(),
      client_designation: data.client_designation?.trim() || '',
      text: data.text.trim(),
      rating: Math.min(5, Math.max(1, data.rating ?? 5)),
      event_type: data.event_type?.trim() || 'Wedding',
      event_date: data.event_date || null,
      is_visible: true,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding testimonial:', error);
    throw new Error('Failed to add testimonial');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return inserted as Testimonial;
}

// ---- Update testimonial ----
export async function updateTestimonial(
  id: string,
  updates: Partial<Pick<Testimonial, 'client_name' | 'client_designation' | 'text' | 'rating' | 'event_type' | 'event_date' | 'is_visible'>>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();
  const { data: updated, error } = await adminClient
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating testimonial:', error);
    throw new Error('Failed to update testimonial');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return updated as Testimonial;
}

// ---- Delete testimonial ----
export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('testimonials')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id);

  if (error) {
    console.error('Error deleting testimonial:', error);
    throw new Error('Failed to delete testimonial');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}
