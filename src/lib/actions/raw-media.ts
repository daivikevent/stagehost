'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';

export interface RawMediaItem {
  id: string;
  profile_id: string;
  title: string;
  media_type: 'video' | 'audio';
  file_url: string;
  file_name?: string;
  file_size?: string;
  event_name?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
}

async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isUserAdmin = await checkIsAdmin();

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId =
      cookieStore.get('bookmyartist_impersonate_user_id')?.value ||
      cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      const adminClient = createAdminClient();
      const { data: impProfile } = await adminClient
        .from('anchor_profiles')
        .select('id, slug, user_id')
        .eq('user_id', impersonateId)
        .single();
      if (impProfile) return impProfile;
    }
  }

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug, user_id')
    .eq('user_id', user.id)
    .single();

  return profile;
}

/**
 * 1. Fetch current artist's raw media items
 */
export async function getMyRawMedia(): Promise<RawMediaItem[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `raw_media_${profile.id}`)
    .maybeSingle();

  if (!row?.value) return [];
  try {
    const items = JSON.parse(row.value);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

/**
 * 2. Fetch public raw media for client portfolio display
 */
export async function getPublicRawMedia(profileId: string): Promise<RawMediaItem[]> {
  if (!profileId) return [];

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `raw_media_${profileId}`)
    .maybeSingle();

  if (!row?.value) return [];
  try {
    const items: RawMediaItem[] = JSON.parse(row.value);
    return Array.isArray(items) ? items.filter((item) => item.is_public) : [];
  } catch {
    return [];
  }
}

/**
 * 3. Upload a raw video or audio file to Supabase Storage ('media' bucket)
 */
export async function uploadRawMediaFile(formData: FormData): Promise<{
  url: string;
  fileName: string;
  fileSize: string;
  mediaType: 'video' | 'audio';
}> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file selected');

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];

  let mediaType: 'video' | 'audio' = 'video';
  if (audioExts.includes(rawExt) || file.type.startsWith('audio/')) {
    mediaType = 'audio';
  } else if (videoExts.includes(rawExt) || file.type.startsWith('video/')) {
    mediaType = 'video';
  } else {
    throw new Error('Unsupported format. Please upload MP4, MOV, WebM video or MP3, WAV, M4A audio.');
  }

  // Format file size
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const fileSize = `${sizeMb} MB`;

  // Sanitized filename
  const cleanBase = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);
  const uniqueId = Math.random().toString(36).substring(2, 7);
  const fileName = `${Date.now()}_${cleanBase}_${uniqueId}.${rawExt}`;
  const filePath = `raw-vault/${profile.id}/${fileName}`;

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from('media')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'),
    });

  if (uploadError) {
    console.error('Raw media storage upload error:', uploadError.message);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = adminClient.storage.from('media').getPublicUrl(filePath);

  return {
    url: publicUrl,
    fileName: file.name,
    fileSize,
    mediaType,
  };
}

/**
 * 4. Add a new Raw Media Item (File upload or Cloud Drive link)
 */
export async function addRawMediaItem(payload: {
  title: string;
  media_type: 'video' | 'audio';
  file_url: string;
  file_name?: string;
  file_size?: string;
  event_name?: string;
  description?: string;
  is_public?: boolean;
}): Promise<RawMediaItem> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  if (!payload.file_url?.trim()) throw new Error('File URL is required');
  if (!payload.title?.trim()) throw new Error('Title is required');

  const newItem: RawMediaItem = {
    id: `raw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    profile_id: profile.id,
    title: payload.title.trim(),
    media_type: payload.media_type,
    file_url: payload.file_url.trim(),
    file_name: payload.file_name?.trim() || 'Work Sample',
    file_size: payload.file_size?.trim() || undefined,
    event_name: payload.event_name?.trim() || undefined,
    description: payload.description?.trim() || undefined,
    is_public: payload.is_public ?? true,
    created_at: new Date().toISOString(),
  };

  const adminClient = createAdminClient();
  const currentList = await getMyRawMedia();
  const updatedList = [newItem, ...currentList];

  await adminClient.from('platform_settings').upsert(
    {
      key: `raw_media_${profile.id}`,
      value: JSON.stringify(updatedList),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  revalidatePath('/vault');
  revalidatePath('/portfolio');
  if (profile.slug) revalidatePath(`/${profile.slug}`);
  return newItem;
}

/**
 * 5. Update an existing Raw Media Item (e.g. toggle is_public or edit title)
 */
export async function updateRawMediaItem(
  id: string,
  updates: Partial<Omit<RawMediaItem, 'id' | 'profile_id' | 'created_at'>>
): Promise<RawMediaItem[]> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const currentList = await getMyRawMedia();
  const updatedList = currentList.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );

  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert(
    {
      key: `raw_media_${profile.id}`,
      value: JSON.stringify(updatedList),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  revalidatePath('/vault');
  revalidatePath('/portfolio');
  if (profile.slug) revalidatePath(`/${profile.slug}`);
  return updatedList;
}

/**
 * 6. Delete a Raw Media Item
 */
export async function deleteRawMediaItem(id: string): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const currentList = await getMyRawMedia();
  const updatedList = currentList.filter((item) => item.id !== id);

  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert(
    {
      key: `raw_media_${profile.id}`,
      value: JSON.stringify(updatedList),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  revalidatePath('/vault');
  revalidatePath('/portfolio');
  if (profile.slug) revalidatePath(`/${profile.slug}`);
  return true;
}
