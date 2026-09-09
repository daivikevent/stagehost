'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';
import type { ServicePackage } from '@/types';

async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isUserAdmin = await checkIsAdmin();

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      const adminClient = createAdminClient();
      const { data: impProfile } = await adminClient
        .from('anchor_profiles')
        .select('id, slug')
        .eq('user_id', impersonateId)
        .single();
      if (impProfile) return impProfile;
    }
  }

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  return profile;
}

// ---- Get my packages ----
export async function getMyPackages() {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('service_packages')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
  return data as ServicePackage[];
}

// ---- Add package ----
export async function addPackage(data: {
  name: string;
  description: string;
  event_type?: string;
  price_range_min?: number | null;
  price_range_max?: number | null;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  // Get next sort_order
  const { data: existing } = await adminClient
    .from('service_packages')
    .select('sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data: inserted, error } = await adminClient
    .from('service_packages')
    .insert({
      profile_id: profile.id,
      name: data.name.trim(),
      description: data.description.trim(),
      event_type: data.event_type?.trim() || 'Wedding',
      price_range_min: data.price_range_min ?? null,
      price_range_max: data.price_range_max ?? null,
      is_active: true,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding package:', error);
    throw new Error('Failed to create event package');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return inserted as ServicePackage;
}

// ---- Update package ----
export async function updatePackage(
  id: string,
  updates: Partial<Pick<ServicePackage, 'name' | 'description' | 'event_type' | 'price_range_min' | 'price_range_max' | 'is_active'>>
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: updated, error } = await adminClient
    .from('service_packages')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating package:', error);
    throw new Error('Failed to update package');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return updated as ServicePackage;
}

// ---- Delete package ----
export async function deletePackage(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('service_packages')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id);

  if (error) {
    console.error('Error deleting package:', error);
    throw new Error('Failed to delete package');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}
