'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Video, VideoPlatform } from '@/types';
import { detectVideoPlatform, getYouTubeId, getGoogleDriveId } from '@/lib/utils';

// ---- Get my videos ----
export async function getMyVideos() {
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
    .from('videos')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data as Video[];
}

// ---- Add video ----
export async function addVideo(url: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const trimmedUrl = url.trim();
  const platform = detectVideoPlatform(trimmedUrl) as VideoPlatform;
  let thumbnail_url: string | null = null;

  if (platform === 'youtube') {
    const ytId = getYouTubeId(trimmedUrl);
    if (ytId) thumbnail_url = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  } else if (platform === 'google_drive') {
    const driveId = getGoogleDriveId(trimmedUrl);
    if (driveId) {
      thumbnail_url = `https://drive.google.com/thumbnail?id=${driveId}&sz=w640`;
    }
  }

  const adminClient = createAdminClient();

  // Get max sort_order
  const { data: existing } = await adminClient
    .from('videos')
    .select('sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  let { data: newVideo, error } = await adminClient
    .from('videos')
    .insert({
      profile_id: profile.id,
      url: trimmedUrl,
      title: title.trim() || (platform === 'google_drive' ? 'Performance Video' : platform === 'instagram' ? 'Instagram Reel' : 'Featured Video'),
      platform,
      thumbnail_url,
      sort_order: nextOrder,
    })
    .select()
    .single();

  // If check constraint failed on platform (e.g. older schema without 'google_drive'), retry with 'other'
  if (error && (error.code === '23514' || error.message?.includes('platform') || error.message?.includes('check constraint'))) {
    const retry = await adminClient
      .from('videos')
      .insert({
        profile_id: profile.id,
        url: trimmedUrl,
        title: title.trim() || 'Performance Video',
        platform: 'other',
        thumbnail_url,
        sort_order: nextOrder,
      })
      .select()
      .single();
    newVideo = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath('/portfolio');
  revalidatePath('/portfolio/videos');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return newVideo as Video;
}

// ---- Delete video ----
export async function deleteVideo(videoId: string) {
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
    .from('videos')
    .delete()
    .eq('id', videoId)
    .eq('profile_id', profile.id);

  if (error) throw new Error(error.message);

  revalidatePath('/portfolio');
  revalidatePath('/portfolio/videos');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}

// ---- Reorder videos ----
export async function reorderVideos(orderedIds: string[]) {
  const adminClient = createAdminClient();
  const updates = orderedIds.map((id, i) =>
    adminClient.from('videos').update({ sort_order: i + 1 }).eq('id', id)
  );
  await Promise.all(updates);
  revalidatePath('/portfolio');
  revalidatePath('/portfolio/videos');
}
