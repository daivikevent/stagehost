'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';
import type { Photo } from '@/types';

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

// ---- Get my photos ----
export async function getMyPhotos() {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('photos')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
  return data as Photo[];
}

// ---- Add photo ----
export async function addPhoto(data: {
  url: string;
  caption?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const trimmedUrl = data.url.trim();
  if (!trimmedUrl) throw new Error('Photo URL is required');

  const adminClient = createAdminClient();

  // Get next sort_order
  const { data: existing } = await adminClient
    .from('photos')
    .select('sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data: inserted, error } = await adminClient
    .from('photos')
    .insert({
      profile_id: profile.id,
      url: trimmedUrl,
      caption: data.caption?.trim() || '',
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding photo:', error);
    throw new Error('Failed to add photo to gallery');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return inserted as Photo;
}

// ---- Update photo caption ----
export async function updatePhoto(
  id: string,
  updates: { caption: string }
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: updated, error } = await adminClient
    .from('photos')
    .update({ caption: updates.caption.trim() })
    .eq('id', id)
    .eq('profile_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating photo:', error);
    throw new Error('Failed to update photo caption');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return updated as Photo;
}

// ---- Delete photo ----
export async function deletePhoto(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('photos')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id);

  if (error) {
    console.error('Error deleting photo:', error);
    throw new Error('Failed to delete photo');
  }

  revalidatePath('/portfolio');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}

// ---- Upload gallery photo to Supabase Storage ----
export async function uploadGalleryPhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No image file provided');

  const fileExt = file.name.split('.').pop() || 'webp';
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `portfolio-photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file, { upsert: true, contentType: file.type || 'image/webp' });

  if (uploadError) {
    console.warn('Supabase storage upload error:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
  return publicUrl;
}

