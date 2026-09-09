'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/actions/admin';
import { DEFAULT_PAGE_CONTENTS, type PageKey } from '@/types/pages';

/**
 * Public action: Fetches customized page content from platform_settings,
 * falling back gracefully to rich built-in defaults.
 */
export async function getPageContent<T = any>(key: PageKey): Promise<T> {
  try {
    const adminClient = createAdminClient();
    const settingKey = `page_${key}`;
    const { data, error } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', settingKey)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_PAGE_CONTENTS[key] as unknown as T;
    }

    // Try parsing if stringified JSON
    if (typeof data.value === 'string') {
      try {
        return JSON.parse(data.value) as T;
      } catch {
        return data.value as unknown as T;
      }
    }

    return data.value as T;
  } catch (err) {
    console.error(`Error fetching page content for ${key}:`, err);
    return DEFAULT_PAGE_CONTENTS[key] as unknown as T;
  }
}

/**
 * Admin action: Saves customized page content to platform_settings
 * and instantly revalidates public marketing and admin paths.
 */
export async function updatePageContent(key: PageKey, content: any) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminClient = createAdminClient();
  const settingKey = `page_${key}`;

  const { error } = await adminClient.from('platform_settings').upsert(
    {
      key: settingKey,
      value: JSON.stringify(content),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    console.error(`Failed to update page ${key}:`, error);
    throw new Error(`Failed to save page content: ${error.message}`);
  }

  // Revalidate relevant public paths
  revalidatePath(`/${key}`);
  revalidatePath('/admin/pages');
  revalidatePath('/');

  return { success: true };
}
