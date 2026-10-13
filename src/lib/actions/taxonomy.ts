'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import { ArtistCategory } from '@/constants/artists';
import {
  PlatformTaxonomy,
  CANONICAL_TAXONOMY_DEFAULTS,
} from '@/types/taxonomy';

const TAXONOMY_KEYS = {
  categories: 'taxonomy_artist_categories',
  eventTypes: 'taxonomy_event_types',
  languages: 'taxonomy_languages',
  cities: 'taxonomy_cities',
  specialties: 'taxonomy_specialties',
  clientBrands: 'taxonomy_client_brands',
  budgetRanges: 'taxonomy_budget_ranges',
} as const;

/**
 * Fetch dynamic taxonomy options from platform_settings table.
 * Gracefully falls back to canonical defaults if unconfigured.
 */
export async function getPlatformTaxonomy(): Promise<PlatformTaxonomy> {
  const defaults: PlatformTaxonomy = { ...CANONICAL_TAXONOMY_DEFAULTS };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('platform_settings')
      .select('key, value')
      .in('key', Object.values(TAXONOMY_KEYS));

    if (error || !data) {
      return defaults;
    }

    const map = new Map<string, string>();
    data.forEach((row) => {
      if (row.key && row.value) {
        map.set(row.key, row.value);
      }
    });

    // Helper to safely parse JSON arrays
    const parseArray = <T>(key: string, fallback: T[]): T[] => {
      const val = map.get(key);
      if (!val) return fallback;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
      } catch {
        return fallback;
      }
    };

    return {
      categories: parseArray<ArtistCategory>(TAXONOMY_KEYS.categories, defaults.categories),
      eventTypes: parseArray<string>(TAXONOMY_KEYS.eventTypes, defaults.eventTypes),
      languages: parseArray<string>(TAXONOMY_KEYS.languages, defaults.languages),
      cities: parseArray<string>(TAXONOMY_KEYS.cities, defaults.cities),
      specialties: parseArray<string>(TAXONOMY_KEYS.specialties, defaults.specialties),
      clientBrands: parseArray<string>(TAXONOMY_KEYS.clientBrands, defaults.clientBrands),
      budgetRanges: parseArray<string>(TAXONOMY_KEYS.budgetRanges, defaults.budgetRanges),
    };
  } catch (err) {
    console.error('[getPlatformTaxonomy] Error loading taxonomy:', err);
    return defaults;
  }
}

/**
 * Save updated taxonomy settings into database.
 * Only accessible by platform admins.
 */
export async function savePlatformTaxonomy(
  taxonomy: Partial<PlatformTaxonomy>
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Only platform administrators can modify taxonomy.' };
  }

  try {
    const admin = createAdminClient();
    const rowsToUpsert: Array<{ key: string; value: string; updated_at: string }> = [];
    const now = new Date().toISOString();

    if (taxonomy.categories) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.categories,
        value: JSON.stringify(taxonomy.categories),
        updated_at: now,
      });
    }

    if (taxonomy.eventTypes) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.eventTypes,
        value: JSON.stringify(taxonomy.eventTypes),
        updated_at: now,
      });
    }

    if (taxonomy.languages) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.languages,
        value: JSON.stringify(taxonomy.languages),
        updated_at: now,
      });
    }

    if (taxonomy.cities) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.cities,
        value: JSON.stringify(taxonomy.cities),
        updated_at: now,
      });
    }

    if (taxonomy.specialties) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.specialties,
        value: JSON.stringify(taxonomy.specialties),
        updated_at: now,
      });
    }

    if (taxonomy.clientBrands) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.clientBrands,
        value: JSON.stringify(taxonomy.clientBrands),
        updated_at: now,
      });
    }

    if (taxonomy.budgetRanges) {
      rowsToUpsert.push({
        key: TAXONOMY_KEYS.budgetRanges,
        value: JSON.stringify(taxonomy.budgetRanges),
        updated_at: now,
      });
    }

    if (rowsToUpsert.length > 0) {
      for (const row of rowsToUpsert) {
        const { error } = await admin
          .from('platform_settings')
          .upsert(row, { onConflict: 'key' });

        if (error) {
          throw error;
        }
      }
    }

    // Revalidate paths that use taxonomy
    revalidatePath('/', 'layout');
    revalidatePath('/portfolio');
    revalidatePath('/dashboard');
    revalidatePath('/admin/settings');
    revalidatePath('/artists');

    return { success: true };
  } catch (err) {
    console.error('[savePlatformTaxonomy] Failed to save taxonomy:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Database error while saving taxonomy settings',
    };
  }
}

/**
 * Reset a specific taxonomy key to its original defaults.
 */
export async function resetTaxonomyToDefault(
  section: keyof PlatformTaxonomy
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const admin = createAdminClient();
    const dbKey = TAXONOMY_KEYS[section];
    if (dbKey) {
      await admin.from('platform_settings').delete().eq('key', dbKey);
    }

    revalidatePath('/', 'layout');
    revalidatePath('/portfolio');
    revalidatePath('/admin/settings');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reset taxonomy section',
    };
  }
}
