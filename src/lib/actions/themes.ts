'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsAdmin } from './admin';
import { DEFAULT_SITE_THEME, GLOBAL_SITE_THEMES } from '@/constants/site-themes';

/**
 * Public action: Get current global website theme.
 * Checks cookie first, then database platform_settings.
 */
export async function getGlobalSiteTheme(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const cookieTheme = cookieStore.get('stagehost_site_theme')?.value;
    if (cookieTheme && GLOBAL_SITE_THEMES.some((t) => t.id === cookieTheme)) {
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

    if (data?.value && GLOBAL_SITE_THEMES.some((t) => t.id === data.value)) {
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

  const isValid = GLOBAL_SITE_THEMES.some((t) => t.id === themeId);
  if (!isValid) {
    throw new Error(`Invalid theme ID: ${themeId}`);
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
        description: 'Global theme applied to the entire StageHost website',
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

  return { success: true, themeId };
}
