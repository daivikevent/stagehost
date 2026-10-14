import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens, getOrCreateAppFolder } from '@/lib/services/google-oauth';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const profileId = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code || !profileId) {
    return NextResponse.redirect(
      new URL(`/vault?error=${encodeURIComponent(error || 'Google connection was cancelled')}`, appUrl)
    );
  }

  try {
    const { tokens, email } = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      console.warn('Google did not return a refresh_token. User may have already granted access.');
    }

    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      // If refresh_token is missing, check if we already have one stored
      const adminClient = createAdminClient();
      const { data: existingRow } = await adminClient
        .from('platform_settings')
        .select('value')
        .eq('key', `google_drive_oauth_${profileId}`)
        .single();

      if (!existingRow) {
        throw new Error('Google did not return a refresh token. Please revoke access in your Google Account security settings and reconnect.');
      }
    }

    // Find or create "BookMyArtist Media Vault" in user's Drive
    const effectiveRefreshToken = refreshToken!;
    const folderInfo = await getOrCreateAppFolder(effectiveRefreshToken);

    const adminClient = createAdminClient();

    // 1. Store secure OAuth credentials in platform_settings
    const oauthData = {
      connected: true,
      connected_email: email,
      folder_id: folderInfo.folderId,
      folder_name: folderInfo.folderName,
      folder_url: folderInfo.folderUrl,
      refresh_token: effectiveRefreshToken,
      updated_at: new Date().toISOString(),
    };

    await adminClient.from('platform_settings').upsert(
      {
        key: `google_drive_oauth_${profileId}`,
        value: JSON.stringify(oauthData),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    // 2. Sync to anchor_profiles drivestorage tag
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('artist_specialties, slug')
      .eq('id', profileId)
      .single();

    if (profile) {
      const cleanSpecialties = (profile.artist_specialties || []).filter(
        (s: string) => typeof s === 'string' && !s.startsWith('drivestorage:')
      );

      const storagePayload = {
        primary_videos: {
          url: folderInfo.folderUrl,
          folder_id: folderInfo.folderId,
          folder_name: folderInfo.folderName,
          is_verified: true,
          connected_email: email,
          verified_at: new Date().toISOString(),
        },
      };

      const updatedSpecialties = [
        ...cleanSpecialties,
        `drivestorage:${JSON.stringify(storagePayload)}`,
      ];

      await adminClient
        .from('anchor_profiles')
        .update({
          artist_specialties: updatedSpecialties,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      revalidatePath('/vault');
      revalidatePath('/portfolio');
      revalidatePath('/settings');
      if (profile.slug) revalidatePath(`/${profile.slug}`);
    }

    return NextResponse.redirect(new URL('/vault?drive_connected=true', appUrl));
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(`/vault?error=${encodeURIComponent(err.message || 'Failed to complete Google Drive connection')}`, appUrl)
    );
  }
}
