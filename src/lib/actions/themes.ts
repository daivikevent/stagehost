'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsAdmin } from './admin';
import { DEFAULT_SITE_THEME, GLOBAL_SITE_THEMES, type GlobalSiteTheme } from '@/constants/site-themes';

/**
 * Public action: Get list of all available global themes
 * Returns database customized list if present, else default factory list.
 */
export async function getCustomSiteThemes(): Promise<GlobalSiteTheme[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'custom_site_themes_config')
      .maybeSingle();

    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error fetching custom site themes:', err);
  }
  return GLOBAL_SITE_THEMES;
}

/**
 * Admin action: Save updated list of site themes (after add, edit or delete)
 */
export async function saveCustomSiteThemes(themes: GlobalSiteTheme[]) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('platform_settings')
    .upsert(
      {
        key: 'custom_site_themes_config',
        value: JSON.stringify(themes),
        category: 'branding',
        label: 'Configured Site Themes',
        description: 'JSON list of configured themes including edits and user additions',
        field_type: 'textarea',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/themes');
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Admin action: Reset site themes back to factory defaults
 */
export async function resetCustomSiteThemesToDefault() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminClient = createAdminClient();
  await adminClient
    .from('platform_settings')
    .delete()
    .eq('key', 'custom_site_themes_config');

  revalidatePath('/admin/themes');
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Public action: Get current global website theme.
 * Checks cookie first, then database platform_settings.
 */
export async function getGlobalSiteTheme(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const cookieTheme = cookieStore.get('bookmyartist_site_theme')?.value || cookieStore.get('stagehost_site_theme')?.value;
    if (cookieTheme) {
      return cookieTheme;
    }
  } catch {
    // Ignore cookie read error in non-request contexts
  }

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'site_theme')
      .maybeSingle();

    if (data?.value) {
      return data.value;
    }
  } catch (err) {
    console.error('Error fetching global site theme:', err);
  }

  return DEFAULT_SITE_THEME;
}

/**
 * Admin action: Save global website theme.
 * Updates platform_settings, sets cookie, and revalidates layout.
 */
export async function setGlobalSiteTheme(themeId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminClient = createAdminClient();

  // 1. Save to platform_settings
  const { error } = await adminClient
    .from('platform_settings')
    .upsert(
      {
        key: 'site_theme',
        value: themeId,
        category: 'branding',
        label: 'Active Website Theme',
        description: 'Global theme applied to the entire BookMyArtist website',
        field_type: 'select',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(error.message);
  }

  // 2. Set server cookie for immediate zero-latency SSR
  try {
    const cookieStore = await cookies();
    cookieStore.set('bookmyartist_site_theme', themeId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
    cookieStore.set('stagehost_site_theme', themeId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
  } catch (err) {
    console.warn('Could not set cookie during server action:', err);
  }

  // 3. Revalidate entire site layout so all pages update
  revalidatePath('/', 'layout');
  revalidatePath('/admin/themes');
  revalidatePath('/admin/settings');
  revalidatePath('/pricing');
  revalidatePath('/directory');
  revalidatePath('/artists');

  return { success: true, themeId };
}
