'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';
import { getMyProfile } from './profile';

export interface RawMediaItem {
  id: string;
  profile_id: string;
  title: string;
  media_type: 'video' | 'audio';
  file_url: string;
  file_name?: string;
  file_size?: string;
  file_size_bytes?: number;
  event_name?: string;
  description?: string;
  is_public: boolean;
  storage_provider?: 'platform' | 'google_drive';
  drive_file_id?: string;
  drive_web_view_link?: string;
  created_at: string;
}

export interface ArtistStorageUsage {
  usedBytes: number;
  usedFormatted: string;
  totalBytes: number;
  totalGb: number;
  percentUsed: number;
  isLocked: boolean;
  planName: string;
}

function parseSizeBytes(sizeStr?: string, sizeBytes?: number): number {
  if (typeof sizeBytes === 'number' && sizeBytes > 0) return sizeBytes;
  if (!sizeStr) return 0;
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return val * 1024 * 1024 * 1024;
  if (unit === 'MB') return val * 1024 * 1024;
  if (unit === 'KB') return val * 1024;
  return val;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * Calculate artist's real-time storage quota usage and lock status.
 */
export async function getArtistStorageUsage(profileId?: string): Promise<ArtistStorageUsage> {
  let profile = null;
  if (profileId) {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('anchor_profiles')
      .select('id, slug, user_id')
      .eq('id', profileId)
      .maybeSingle();
    profile = data;
  }
  if (!profile) {
    profile = await getCurrentProfile();
  }
  if (!profile) {
    return {
      usedBytes: 0,
      usedFormatted: '0 MB',
      totalBytes: 0,
      totalGb: 0,
      percentUsed: 0,
      isLocked: true,
      planName: 'Free',
    };
  }

  const adminClient = createAdminClient();
  const [{ data: sub }, { data: plansData }, { data: row }] = await Promise.all([
    adminClient
      .from('subscriptions')
      .select('status, plan_id, plans(*)')
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    adminClient
      .from('plans')
      .select('*')
      .order('tier', { ascending: true }),
    adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', `raw_media_${profile.id}`)
      .maybeSingle(),
  ]);

  const activePlan = (sub?.status === 'active' && sub?.plans) ? (sub.plans as any) : null;
  const isFree = !activePlan || activePlan.tier === 0 || activePlan.slug === 'free';
  const freePlanFromDb = plansData?.find((p) => p.tier === 0 || p.slug === 'free');

  let totalGb = 0;
  let planName = 'Free';

  if (!isFree && activePlan) {
    totalGb = Number(activePlan.limits?.storage_gb ?? (activePlan.tier === 1 ? 1 : activePlan.tier === 2 ? 5 : 15));
    planName = activePlan.name || 'Paid Plan';
  } else {
    totalGb = Number(freePlanFromDb?.limits?.storage_gb ?? 0);
    planName = freePlanFromDb?.name || 'Free';
  }

  let items: RawMediaItem[] = [];
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
  }

  const usedBytes = items
    .filter((item) => item.storage_provider === 'platform' || !item.storage_provider)
    .reduce((acc, item) => acc + parseSizeBytes(item.file_size, item.file_size_bytes), 0);

  const totalBytes = totalGb * 1024 * 1024 * 1024;
  const percentUsed = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;
  const isLocked = totalGb <= 0;

  return {
    usedBytes,
    usedFormatted: formatBytes(usedBytes),
    totalBytes,
    totalGb,
    percentUsed,
    isLocked,
    planName,
  };
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
  fileSizeBytes?: number;
  mediaType: 'video' | 'audio';
  storageProvider: 'platform';
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

  // Enforce Plan Storage Quota & Free Tier Lock
  const usage = await getArtistStorageUsage(profile.id);
  if (usage.isLocked || usage.totalGb <= 0) {
    throw new Error(
      `Cloud Media Vault upload is locked on the ${usage.planName} plan (0 GB limit). Please upgrade to a Paid Plan (Starter / Pro / Premium) to upload files directly, or use the External Cloud Link tab.`
    );
  }

  if (usage.usedBytes + file.size > usage.totalBytes) {
    throw new Error(
      `Storage quota exceeded! You have used ${usage.usedFormatted} of your ${usage.totalGb} GB plan limit. Please delete older media files or upgrade your plan to get more cloud storage.`
    );
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
    fileSizeBytes: file.size,
    mediaType,
    storageProvider: 'platform',
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
  file_size_bytes?: number;
  event_name?: string;
  description?: string;
  is_public?: boolean;
  storage_provider?: 'platform' | 'google_drive';
  drive_file_id?: string;
  drive_web_view_link?: string;
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
    file_size_bytes: payload.file_size_bytes,
    event_name: payload.event_name?.trim() || undefined,
    description: payload.description?.trim() || undefined,
    is_public: payload.is_public ?? true,
    storage_provider: payload.storage_provider || 'platform',
    drive_file_id: payload.drive_file_id,
    drive_web_view_link: payload.drive_web_view_link,
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
  const itemToDelete = currentList.find((item) => item.id === id);
  const updatedList = currentList.filter((item) => item.id !== id);

  const adminClient = createAdminClient();

  // Reclaim storage quota by removing the actual physical file from the Supabase bucket
  if (itemToDelete?.storage_provider === 'platform' && itemToDelete.file_url) {
    try {
      const parts = itemToDelete.file_url.split('/media/');
      if (parts.length > 1) {
        const filePath = parts[1].split('?')[0];
        await adminClient.storage.from('media').remove([filePath]);
      }
    } catch (cleanupErr) {
      console.warn('Could not remove file from media bucket:', cleanupErr);
    }
  }

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
