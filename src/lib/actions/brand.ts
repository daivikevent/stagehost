'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsAdmin } from './admin';
import { BrandSettings, DEFAULT_BRAND_SETTINGS } from '@/types/brand';

const BRAND_COOKIE_NAME = 'bookmyartist_brand_config';

/**
 * Public action: Get current platform brand logo & size settings.
 * Priority: Cookie -> Database platform_settings -> DEFAULT_BRAND_SETTINGS
 */
export async function getBrandSettings(): Promise<BrandSettings> {
  // 1. Try reading from cookie for ultra-fast, zero-overhead hydration
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(BRAND_COOKIE_NAME)?.value || cookieStore.get('stagehost_brand_config')?.value;
    if (rawCookie) {
      const parsed = JSON.parse(decodeURIComponent(rawCookie));
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_BRAND_SETTINGS,
          ...parsed,
          navbarHeight: Number(parsed.navbarHeight) || DEFAULT_BRAND_SETTINGS.navbarHeight,
          navbarMobileHeight: Number(parsed.navbarMobileHeight) || DEFAULT_BRAND_SETTINGS.navbarMobileHeight,
          footerHeight: Number(parsed.footerHeight) || DEFAULT_BRAND_SETTINGS.footerHeight,
          sidebarHeight: Number(parsed.sidebarHeight) || DEFAULT_BRAND_SETTINGS.sidebarHeight,
          sidebarIconSize: Number(parsed.sidebarIconSize) || DEFAULT_BRAND_SETTINGS.sidebarIconSize,
          authHeight: Number(parsed.authHeight) || DEFAULT_BRAND_SETTINGS.authHeight,
          quotationHeight: Number(parsed.quotationHeight) || DEFAULT_BRAND_SETTINGS.quotationHeight,
        };
      }
    }
  } catch {
    // Cookie read failed or malformed, continue to DB
  }

  // 2. Query platform_settings table
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'brand_logo_url',
        'brand_logo_icon_url',
        'brand_logo_navbar_height',
        'brand_logo_navbar_mobile_height',
        'brand_logo_footer_height',
        'brand_logo_sidebar_height',
        'brand_logo_sidebar_icon_size',
        'brand_logo_auth_height',
        'brand_logo_quotation_height',
      ]);

    if (data && data.length > 0) {
      const dbMap = Object.fromEntries(data.map((r) => [r.key, r.value]));
      return {
        logoUrl: dbMap.brand_logo_url || DEFAULT_BRAND_SETTINGS.logoUrl,
        logoIconUrl: dbMap.brand_logo_icon_url || DEFAULT_BRAND_SETTINGS.logoIconUrl,
        navbarHeight: Number(dbMap.brand_logo_navbar_height) || DEFAULT_BRAND_SETTINGS.navbarHeight,
        navbarMobileHeight: Number(dbMap.brand_logo_navbar_mobile_height) || DEFAULT_BRAND_SETTINGS.navbarMobileHeight,
        footerHeight: Number(dbMap.brand_logo_footer_height) || DEFAULT_BRAND_SETTINGS.footerHeight,
        sidebarHeight: Number(dbMap.brand_logo_sidebar_height) || DEFAULT_BRAND_SETTINGS.sidebarHeight,
        sidebarIconSize: Number(dbMap.brand_logo_sidebar_icon_size) || DEFAULT_BRAND_SETTINGS.sidebarIconSize,
        authHeight: Number(dbMap.brand_logo_auth_height) || DEFAULT_BRAND_SETTINGS.authHeight,
        quotationHeight: Number(dbMap.brand_logo_quotation_height) || DEFAULT_BRAND_SETTINGS.quotationHeight,
      };
    }
  } catch (err) {
    console.error('Error fetching brand settings from database:', err);
  }

  return DEFAULT_BRAND_SETTINGS;
}

/**
 * Admin action: Save brand logo and size settings to database & sync cookies.
 */
export async function saveBrandSettings(settings: Partial<BrandSettings>) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required');
  }

  const current = await getBrandSettings();
  const merged: BrandSettings = {
    ...current,
    ...settings,
    navbarHeight: Number(settings.navbarHeight) || current.navbarHeight,
    navbarMobileHeight: Number(settings.navbarMobileHeight) || current.navbarMobileHeight,
    footerHeight: Number(settings.footerHeight) || current.footerHeight,
    sidebarHeight: Number(settings.sidebarHeight) || current.sidebarHeight,
    sidebarIconSize: Number(settings.sidebarIconSize) || current.sidebarIconSize,
    authHeight: Number(settings.authHeight) || current.authHeight,
    quotationHeight: Number(settings.quotationHeight) || current.quotationHeight,
  };

  const adminClient = createAdminClient();
  const entries = [
    { key: 'brand_logo_url', value: merged.logoUrl },
    { key: 'brand_logo_icon_url', value: merged.logoIconUrl },
    { key: 'brand_logo_navbar_height', value: String(merged.navbarHeight) },
    { key: 'brand_logo_navbar_mobile_height', value: String(merged.navbarMobileHeight) },
    { key: 'brand_logo_footer_height', value: String(merged.footerHeight) },
    { key: 'brand_logo_sidebar_height', value: String(merged.sidebarHeight) },
    { key: 'brand_logo_sidebar_icon_size', value: String(merged.sidebarIconSize) },
    { key: 'brand_logo_auth_height', value: String(merged.authHeight) },
    { key: 'brand_logo_quotation_height', value: String(merged.quotationHeight) },
  ].map((item) => ({
    ...item,
    updated_at: new Date().toISOString(),
  }));

  for (const entry of entries) {
    await adminClient.from('platform_settings').upsert(entry, { onConflict: 'key' });
  }

  // Update cookie for 1 year
  try {
    const cookieStore = await cookies();
    const cookieVal = encodeURIComponent(JSON.stringify(merged));
    cookieStore.set(BRAND_COOKIE_NAME, cookieVal, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    cookieStore.set('stagehost_brand_config', cookieVal, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  } catch {}

  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');
  revalidatePath('/login');
  revalidatePath('/register');
  revalidatePath('/dashboard');

  return { success: true, settings: merged };
}

/**
 * Admin action: Upload brand logo image (PNG, SVG, JPG, WebP).
 * Tries Supabase media storage first; falls back to public/images/uploads/ directory.
 */
export async function uploadBrandLogo(formData: FormData): Promise<{ success: boolean; url: string; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required');
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, url: '', error: 'No file provided' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const allowed = ['png', 'svg', 'webp', 'jpg', 'jpeg'];
  if (!allowed.includes(ext)) {
    return { success: false, url: '', error: 'Invalid file format. Please upload PNG, SVG, WebP, or JPG.' };
  }

  const filename = `brand-logo-${Date.now()}.${ext}`;

  // 1. Try Supabase storage
  try {
    const adminClient = createAdminClient();
    const storagePath = `brand/${filename}`;
    const contentType = file.type || (ext === 'svg' ? 'image/svg+xml' : `image/${ext}`);
    const { error: uploadError } = await adminClient.storage
      .from('media')
      .upload(storagePath, file, { upsert: true, contentType });

    if (!uploadError) {
      const { data: { publicUrl } } = adminClient.storage.from('media').getPublicUrl(storagePath);
      if (publicUrl) {
        return { success: true, url: publicUrl };
      }
    }
  } catch (err) {
    console.warn('Supabase storage brand upload failed, trying local disk:', err);
  }

  // 2. Fallback to local public directory
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const targetDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    await fs.mkdir(targetDir, { recursive: true });
    const localFilePath = path.join(targetDir, filename);
    await fs.writeFile(localFilePath, buffer);
    return { success: true, url: `/images/uploads/${filename}` };
  } catch (diskErr) {
    console.error('Local disk write failed:', diskErr);
    return {
      success: false,
      url: '',
      error: diskErr instanceof Error ? diskErr.message : 'Upload failed',
    };
  }
}
