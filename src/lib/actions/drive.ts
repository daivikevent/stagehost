'use server';

import { createClient } from '@/lib/supabase/server';
import { updateProfile } from './profile';
import type { GoogleDriveFolderConfig, GoogleDriveStorageSettings } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Extracts Google Drive Folder ID from various URL formats:
 * - https://drive.google.com/drive/folders/1ZsoCT9d8b4r-ROiNzplFqobEhQ96Jxp9
 * - https://drive.google.com/drive/u/0/folders/1ZsoCT9d8b4r-ROiNzplFqobEhQ96Jxp9?usp=sharing
 * - https://drive.google.com/open?id=1ZsoCT9d8b4r-ROiNzplFqobEhQ96Jxp9
 */
export async function extractGoogleDriveFolderId(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /folders/ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // Pattern 2: ?id=ID or &id=ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  return null;
}

export interface VerifyFolderResult {
  success: boolean;
  folder_id?: string;
  folder_name?: string;
  url?: string;
  error?: string;
  warning?: string;
}

/**
 * Verifies that a Google Drive folder link is valid, accessible,
 * extracts its folder name and returns metadata.
 */
export async function verifyGoogleDriveFolder(
  rawUrl: string,
  categoryLabel = 'Drive Media Folder'
): Promise<VerifyFolderResult> {
  try {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter a Google Drive folder link' };
    }

    if (!trimmed.includes('drive.google.com')) {
      return {
        success: false,
        error: 'Invalid URL. Must be a Google Drive link (e.g. https://drive.google.com/drive/folders/...)',
      };
    }

    const folderId = await extractGoogleDriveFolderId(trimmed);
    if (!folderId || folderId.length < 15) {
      return {
        success: false,
        error: 'Could not detect a valid Google Drive Folder ID in this link. Please check the URL.',
      };
    }

    let detectedName = categoryLabel;
    let accessWarning: string | undefined;

    // Check accessibility via Google Drive public endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();

        // 1. Try <meta property="og:title" content="...">
        const ogMatch = html.match(/<meta property=["']og:title["'] content=["'](.*?)["']/i);
        // 2. Try <title>...</title>
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);

        let rawTitle = ogMatch?.[1] || titleMatch?.[1] || '';
        rawTitle = rawTitle.replace(/\s*-\s*Google Drive\s*$/i, '').trim();

        if (rawTitle && !rawTitle.toLowerCase().includes('google drive') && !rawTitle.toLowerCase().includes('error')) {
          detectedName = rawTitle;
        }

        // Check if redirected to login / private
        if (response.url.includes('accounts.google.com') || html.includes('ServiceLogin')) {
          accessWarning =
            "Make sure folder access is set to 'Anyone with the link can view' so clients can view your media.";
        }
      }
    } catch {
      // Non-fatal network fetch error — folder ID is still valid syntax
    }

    return {
      success: true,
      folder_id: folderId,
      folder_name: detectedName,
      url: trimmed,
      warning: accessWarning,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to verify folder. Please check your internet connection.',
    };
  }
}

/**
 * Saves or updates the entire Google Drive storage configuration for the logged-in artist
 */
export async function saveGoogleDriveStorageSettings(
  storageSettings: GoogleDriveStorageSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    await updateProfile({
      google_drive_storage: storageSettings,
    });

    revalidatePath('/settings');
    revalidatePath('/portfolio');
    revalidatePath('/vault');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save Google Drive storage settings' };
  }
}
