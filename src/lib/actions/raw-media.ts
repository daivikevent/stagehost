'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { checkIsAdmin } from '@/lib/actions/admin';
import { getMyProfile } from './profile';
import { isGoogleDriveConfigured, uploadFileToGoogleDrive } from '@/lib/services/google-drive';

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
  storage_provider?: 'platform' | 'google_drive';
  drive_file_id?: string;
  drive_web_view_link?: string;
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
 * 3. Upload a raw video or audio file to Google Drive or Supabase Storage ('media' bucket)
 */
export async function uploadRawMediaFile(formData: FormData): Promise<{
  url: string;
  fileName: string;
  fileSize: string;
  mediaType: 'video' | 'audio';
  storageProvider: 'platform' | 'google_drive';
  driveFileId?: string;
  driveWebViewLink?: string;
}> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Not authenticated');

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file selected');

  const targetDestination = (formData.get('destination') as string) || 'auto';
  const customFolderId = (formData.get('folder_id') as string) || '';

  // Get full profile to check linked Google Drive storage
  const fullProfile = await getMyProfile().catch(() => null);
  const connectedFolderId =
    customFolderId ||
    fullProfile?.google_drive_storage?.primary_videos?.folder_id ||
    fullProfile?.google_drive_storage?.primary_folder?.folder_id ||
    fullProfile?.google_drive_storage?.primary_audio?.folder_id ||
    fullProfile?.google_drive_storage?.folders?.[0]?.folder_id;

  const shouldUploadToDrive =
    targetDestination === 'google_drive' ||
    (targetDestination === 'auto' && Boolean(connectedFolderId));

  // Check if artist has connected their Google Drive via 1-Click OAuth
  const adminClient = createAdminClient();
  const { data: oauthRow } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `google_drive_oauth_${profile.id}`)
    .maybeSingle();

  let oauthSettings: any = null;
  if (oauthRow?.value) {
    try {
      oauthSettings = JSON.parse(oauthRow.value);
    } catch {}
  }

  // 1. If artist connected via 1-Click OAuth, upload using user's quota
  if (oauthSettings?.refresh_token && oauthSettings?.folder_id && targetDestination !== 'platform') {
    try {
      const { uploadFileWithUserToken } = await import('@/lib/services/google-oauth');
      const userDriveRes = await uploadFileWithUserToken({
        refreshToken: oauthSettings.refresh_token,
        folderId: oauthSettings.folder_id,
        file,
      });

      return {
        url: userDriveRes.url,
        fileName: userDriveRes.fileName,
        fileSize: userDriveRes.fileSize,
        mediaType: userDriveRes.mediaType,
        storageProvider: 'google_drive',
        driveFileId: userDriveRes.fileId,
        driveWebViewLink: userDriveRes.webViewLink,
      };
    } catch (oauthErr: any) {
      console.error('User Google Drive direct upload failed:', oauthErr);
      throw new Error(`Google Drive upload failed: ${oauthErr.message || 'Permission error'}. Please reconnect your Google Drive in Settings.`);
    }
  }

  // 2. Service Account method fallback
  if (shouldUploadToDrive && connectedFolderId) {
    if (!isGoogleDriveConfigured()) {
      throw new Error(
        'Google Drive Service Account is not yet configured on server (.env.local). Please set GOOGLE_SERVICE_ACCOUNT_JSON or upload to Platform Cloud Storage.'
      );
    }

    try {
      const driveRes = await uploadFileToGoogleDrive({
        file,
        folderId: connectedFolderId,
      });

      return {
        url: driveRes.url,
        fileName: driveRes.fileName,
        fileSize: driveRes.fileSize,
        mediaType: driveRes.mediaType,
        storageProvider: 'google_drive',
        driveFileId: driveRes.fileId,
        driveWebViewLink: driveRes.webViewLink,
      };
    } catch (driveErr: any) {
      console.error('Google Drive direct upload failed:', driveErr);
      throw new Error(
        `Google Drive upload failed: ${driveErr.message || 'Permission denied'}. Please check that your Google Drive folder permission is set to "Anyone with the link can EDIT" (Editor access).`
      );
    }
  }

  // Fallback / standard upload to Supabase Storage ('media' bucket)
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
