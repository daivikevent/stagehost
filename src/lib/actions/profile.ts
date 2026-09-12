/**
 * Server Actions — Profile
 * These run server-side and interact directly with Supabase.
 */
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { AnchorProfile } from '@/types';
import { generateSlug, extractSlotTimes } from '@/lib/utils';
import { checkIsAdmin } from '@/lib/actions/admin';

// ---- Helper to extract gigs_completed from DB column or artist_specialties tag ----
function extractGigsCompleted(profile: any): number | null {
  if (profile?.gigs_completed !== undefined && profile?.gigs_completed !== null && !isNaN(Number(profile.gigs_completed))) {
    return Number(profile.gigs_completed);
  }
  if (Array.isArray(profile?.artist_specialties)) {
    const gigTag = profile.artist_specialties.find((s: string) => typeof s === 'string' && s.startsWith('gigs:'));
    if (gigTag) {
      const parsed = parseInt(gigTag.replace('gigs:', ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

// ---- Extract Profile Layout ('classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema') ----
function extractProfileLayout(profile: any): 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema' {
  if (profile?.profile_layout && ['classic', 'editorial', 'spotlight', 'vip', 'palace', 'cinema'].includes(profile.profile_layout)) {
    return profile.profile_layout;
  }
  if (Array.isArray(profile?.artist_specialties)) {
    const layoutTag = profile.artist_specialties.find((s: string) => typeof s === 'string' && s.startsWith('layout:'));
    if (layoutTag) {
      const val = layoutTag.replace('layout:', '');
      if (['classic', 'editorial', 'spotlight', 'vip', 'palace', 'cinema'].includes(val)) return val as any;
    }
  }
  return 'classic';
}

// ---- Extract Client Brands ----
function extractClientBrands(profile: any): string[] {
  if (Array.isArray(profile?.client_brands) && profile.client_brands.length > 0) {
    return profile.client_brands;
  }
  if (Array.isArray(profile?.artist_specialties)) {
    const brandTag = profile.artist_specialties.find((s: string) => typeof s === 'string' && s.startsWith('brands:'));
    if (brandTag) {
      const raw = brandTag.replace('brands:', '');
      const parsed = raw.includes(';;;') ? raw.split(';;;') : raw.split(',');
      return parsed.map((b: string) => b.trim()).filter(Boolean);
    }
  }
  return [];
}

// ---- Extract Tour Cities ----
function extractTourCities(profile: any): Array<{ city: string; tag: string }> {
  if (Array.isArray(profile?.tour_cities) && profile.tour_cities.length > 0) {
    return profile.tour_cities;
  }
  if (Array.isArray(profile?.artist_specialties)) {
    const tourTag = profile.artist_specialties.find((s: string) => typeof s === 'string' && s.startsWith('tour:'));
    if (tourTag) {
      try {
        const raw = tourTag.replace('tour:', '');
        if (raw.startsWith('[')) {
          return JSON.parse(raw);
        }
        return raw.split(';;;').map((pair: string) => {
          const [city, tag] = pair.split('||');
          return { city: city?.trim() || '', tag: tag?.trim() || '' };
        }).filter((c: any) => c.city);
      } catch {}
    }
  }
  return [];
}

// ---- Extract Clean Artist Specialties (excluding internal metadata tags) ----
function extractCleanArtistSpecialties(profile: any): string[] {
  if (!Array.isArray(profile?.artist_specialties)) return [];
  return profile.artist_specialties.filter((s: string) =>
    typeof s === 'string' &&
    !s.startsWith('gigs:') &&
    !s.startsWith('layout:') &&
    !s.startsWith('brands:') &&
    !s.startsWith('tour:')
  );
}

// ---- Get current user's profile ----
export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Support Admin Impersonation ("View As Anchor")
  const isUserAdmin = await checkIsAdmin();
  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      const adminClient = createAdminClient();
      const { data: impProfile } = await adminClient
        .from('anchor_profiles')
        .select(`
          *,
          videos(*),
          photos(*),
          service_packages(*),
          testimonials(*)
        `)
        .eq('user_id', impersonateId)
        .single();
      if (impProfile) {
        impProfile.artist_type = impProfile.artist_type || 'emcee';
        impProfile.gigs_completed = extractGigsCompleted(impProfile);
        impProfile.slot_times = extractSlotTimes(impProfile);
        impProfile.profile_layout = extractProfileLayout(impProfile);
        impProfile.client_brands = extractClientBrands(impProfile);
        impProfile.tour_cities = extractTourCities(impProfile);
        impProfile.artist_specialties = extractCleanArtistSpecialties(impProfile);
        return impProfile;
      }
    }
  }

  let { data, error } = await supabase
    .from('anchor_profiles')
    .select(`
      *,
      videos(*),
      photos(*),
      service_packages(*),
      testimonials(*)
    `)
    .eq('user_id', user.id)
    .single();

  // Self-heal: If user is authenticated but profile row is missing, create it
  if (!data) {
    const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Anchor';
    const baseSlug = generateSlug(rawName) || 'anchor';

    // Check if clean baseSlug is free, or increment numerically (-2, -3)
    let uniqueSlug = baseSlug;
    let counter = 2;
    while (counter <= 50) {
      const { data: existingSlug } = await supabase
        .from('anchor_profiles')
        .select('id')
        .eq('slug', uniqueSlug)
        .neq('user_id', user.id)
        .maybeSingle();

      if (!existingSlug) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('anchor_profiles')
      .insert({
        user_id: user.id,
        name: rawName,
        email: user.email,
        slug: uniqueSlug,
        is_listed_in_directory: true,
        is_profile_complete: false,
        onboarding_step: 1,
      })
      .select(`
        *,
        videos(*),
        photos(*),
        service_packages(*),
        testimonials(*)
      `)
      .single();

    if (!insertError && newProfile) {
      data = newProfile;
    }
  } else if (data.slug) {
    // If an existing profile has an unwanted random hex hash suffix (like -180b87), clean it up!
    const hasHashSuffix = /-[0-9a-f]{4,8}$/i.test(data.slug);
    if (hasHashSuffix) {
      const rawName = data.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anchor';
      const cleanBase = generateSlug(rawName) || 'anchor';

      let cleanSlug = cleanBase;
      let counter = 2;
      while (counter <= 50) {
        const { data: collision } = await supabase
          .from('anchor_profiles')
          .select('id')
          .eq('slug', cleanSlug)
          .neq('id', data.id)
          .maybeSingle();

        if (!collision) break;
        cleanSlug = `${cleanBase}-${counter}`;
        counter++;
      }

      await supabase
        .from('anchor_profiles')
        .update({ slug: cleanSlug, updated_at: new Date().toISOString() })
        .eq('id', data.id);

      data.slug = cleanSlug;
    }
  }

  if (data) {
    data.artist_type = data.artist_type || user.user_metadata?.artist_type || 'emcee';
    data.gigs_completed = extractGigsCompleted(data);
    data.slot_times = extractSlotTimes(data);
    data.profile_layout = extractProfileLayout(data);
    data.client_brands = extractClientBrands(data);
    data.tour_cities = extractTourCities(data);
    data.artist_specialties = extractCleanArtistSpecialties(data);
  }

  return data;
}

// ---- Get current user's subscription ----
export async function getMySubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isUserAdmin = await checkIsAdmin();
  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      const adminClient = createAdminClient();
      const { data: sub } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', impersonateId)
        .single();
      if (sub) return sub;
    }
  }

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data || { plan_name: 'Free', status: 'active' };
}

// ---- Create profile on first login ----
export async function createProfile(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const baseSlug = generateSlug(name) || 'anchor';
  let cleanSlug = baseSlug;
  let counter = 2;
  while (counter <= 50) {
    const { data: collision } = await supabase
      .from('anchor_profiles')
      .select('id')
      .eq('slug', cleanSlug)
      .neq('user_id', user.id)
      .maybeSingle();

    if (!collision) break;
    cleanSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const { data, error } = await supabase
    .from('anchor_profiles')
    .insert({
      user_id: user.id,
      name,
      slug: cleanSlug,
      email: user.email,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---- Update profile ----
export async function updateProfile(updates: Partial<AnchorProfile>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Support Admin Impersonation ("View As Anchor")
  let targetUserId = user.id;
  let dbClient: any = supabase;
  const isUserAdmin = await checkIsAdmin();

  if (isUserAdmin) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('stagehost_impersonate_user_id')?.value;
    if (impersonateId) {
      targetUserId = impersonateId;
      dbClient = createAdminClient();
    }
  }

  // Remove readonly fields and non-table/unmigrated columns from primary DB update payload
  const {
    id,
    user_id,
    created_at,
    videos,
    photos,
    service_packages,
    testimonials,
    subscription,
    gigs_completed: inputGigsCompleted,
    artist_category: inputArtistCategory,
    profile_layout: inputProfileLayout,
    client_brands: inputClientBrands,
    tour_cities: inputTourCities,
    ...safeUpdates
  } = updates as any;

  // Handle gigs_completed, profile_layout, client_brands, and tour_cities encoding into artist_specialties as universal persistence fallback
  let effectiveSpecialties = Array.isArray(safeUpdates.artist_specialties)
    ? [...safeUpdates.artist_specialties]
    : undefined;

  const targetLayout = updates.profile_layout ?? inputProfileLayout;
  const targetBrands = updates.client_brands ?? inputClientBrands;
  const targetTour = updates.tour_cities ?? inputTourCities;

  if (
    updates.gigs_completed !== undefined ||
    targetLayout !== undefined ||
    targetBrands !== undefined ||
    targetTour !== undefined
  ) {
    if (!effectiveSpecialties) {
      const { data: curr } = await dbClient
        .from('anchor_profiles')
        .select('artist_specialties')
        .eq('user_id', targetUserId)
        .maybeSingle();
      effectiveSpecialties = Array.isArray(curr?.artist_specialties) ? [...curr.artist_specialties] : [];
    }

    if (updates.gigs_completed !== undefined) {
      effectiveSpecialties = effectiveSpecialties.filter((s: string) => typeof s === 'string' && !s.startsWith('gigs:'));
      if (updates.gigs_completed !== null && !isNaN(Number(updates.gigs_completed))) {
        effectiveSpecialties.push(`gigs:${updates.gigs_completed}`);
      }
    }

    if (targetLayout !== undefined) {
      effectiveSpecialties = effectiveSpecialties.filter((s: string) => typeof s === 'string' && !s.startsWith('layout:'));
      if (targetLayout) {
        effectiveSpecialties.push(`layout:${targetLayout}`);
      }
    }

    if (targetBrands !== undefined) {
      effectiveSpecialties = effectiveSpecialties.filter((s: string) => typeof s === 'string' && !s.startsWith('brands:'));
      if (Array.isArray(targetBrands) && targetBrands.length > 0) {
        effectiveSpecialties.push(`brands:${targetBrands.join(';;;')}`);
      }
    }

    if (targetTour !== undefined) {
      effectiveSpecialties = effectiveSpecialties.filter((s: string) => typeof s === 'string' && !s.startsWith('tour:'));
      if (Array.isArray(targetTour) && targetTour.length > 0) {
        effectiveSpecialties.push(`tour:${targetTour.map((t: any) => `${t.city || ''}||${t.tag || ''}`).join(';;;')}`);
      }
    }
  }

  const payload: Record<string, any> = {
    ...safeUpdates,
    ...(effectiveSpecialties !== undefined ? { artist_specialties: effectiveSpecialties } : {}),
  };

  // Helper to detect schema cache / missing column errors from Supabase/PostgREST
  const isMissingColumnError = (err: any) =>
    err && (
      err.code === '42703' ||
      err.code === 'PGRST204' ||
      (typeof err.message === 'string' && (
        err.message.includes('schema cache') ||
        err.message.includes('Could not find') ||
        err.message.includes('column')
      ))
    );

  // Perform primary DB update (without unmigrated virtual columns)
  let { data, error } = await dbClient
    .from('anchor_profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('user_id', targetUserId)
    .select()
    .single();

  // If artist_specialties or artist_type triggers a schema cache error on older DB instances, retry with core fields
  if (error && isMissingColumnError(error)) {
    const { artist_specialties, artist_type, ...fallbackPayload } = payload;
    const retry = await dbClient
      .from('anchor_profiles')
      .update({ ...fallbackPayload, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  // If columns exist directly in database, update them silently as well
  if (updates.gigs_completed !== undefined && updates.gigs_completed !== null && !isNaN(Number(updates.gigs_completed))) {
    try {
      await dbClient
        .from('anchor_profiles')
        .update({ gigs_completed: Number(updates.gigs_completed) })
        .eq('user_id', targetUserId);
    } catch {}
  }
  if (targetBrands !== undefined && Array.isArray(targetBrands)) {
    try {
      await dbClient
        .from('anchor_profiles')
        .update({ client_brands: targetBrands })
        .eq('user_id', targetUserId);
    } catch {}
  }
  if (targetTour !== undefined && Array.isArray(targetTour)) {
    try {
      await dbClient
        .from('anchor_profiles')
        .update({ tour_cities: targetTour })
        .eq('user_id', targetUserId);
    } catch {}
  }
  if (targetLayout !== undefined) {
    try {
      await dbClient
        .from('anchor_profiles')
        .update({ profile_layout: targetLayout })
        .eq('user_id', targetUserId);
    } catch {}
  }

  if (data) {
    data.gigs_completed = extractGigsCompleted(data) ?? (updates.gigs_completed !== undefined ? Number(updates.gigs_completed) : null);
    data.profile_layout = extractProfileLayout(data) ?? targetLayout ?? 'classic';
    data.client_brands = extractClientBrands(data) ?? targetBrands ?? [];
    data.tour_cities = extractTourCities(data) ?? targetTour ?? [];
    data.artist_specialties = extractCleanArtistSpecialties(data);
    if (safeUpdates.artist_type) {
      data.artist_type = safeUpdates.artist_type;
    }
  }

  // Sync artist_type to user_metadata for future compatibility
  if (safeUpdates.artist_type) {
    try {
      await supabase.auth.updateUser({
        data: { artist_type: safeUpdates.artist_type },
      });
    } catch {}
  }

  revalidatePath('/portfolio');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  if (data?.slug) revalidatePath(`/${data.slug}`);
  return data;
}

// ---- Update profile layout shortcut ----
export async function updateProfileLayout(layout: 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema') {
  return updateProfile({ profile_layout: layout } as any);
}

// ---- Update active theme ----
export async function updateTheme(themeIdOrSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let targetThemeId = themeIdOrSlug;

  // If passed a slug like 'pearl-white', check if matching record exists in themes table
  const formattedName = themeIdOrSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const { data: themeRecord } = await supabase
    .from('themes')
    .select('id')
    .ilike('name', `%${formattedName}%`)
    .limit(1)
    .maybeSingle();

  if (themeRecord?.id) {
    targetThemeId = themeRecord.id;
  }

  const { data, error } = await supabase
    .from('anchor_profiles')
    .update({ theme_id: targetThemeId, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/portfolio');
  if (data?.slug) revalidatePath(`/${data.slug}`);
  return data;
}

// ---- Update profile slug ----
export async function updateSlug(newSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cleanSlug = generateSlug(newSlug);
  if (!cleanSlug || cleanSlug.length < 3) {
    throw new Error('Slug must be at least 3 characters');
  }

  // Check if slug is taken by another user
  const { data: existing } = await supabase
    .from('anchor_profiles')
    .select('user_id')
    .eq('slug', cleanSlug)
    .neq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('This custom URL is already taken. Please choose another.');
  }

  const { data, error } = await supabase
    .from('anchor_profiles')
    .update({ slug: cleanSlug, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/portfolio');
  revalidatePath(`/${cleanSlug}`);
  return data;
}

// ---- Get public profile by slug ----
export async function getPublicProfile(slug: string) {
  const supabase = createAdminClient();

  let { data, error } = await supabase
    .from('anchor_profiles')
    .select(`
      *,
      videos(*),
      photos(*),
      service_packages(*),
      testimonials(*)
    `)
    .eq('slug', slug)
    .maybeSingle();

  // If not found and slug has a trailing hex hash suffix (like -180b87), look up clean base slug
  if (!data && /-[0-9a-f]{4,8}$/i.test(slug)) {
    const cleanBase = slug.replace(/-[0-9a-f]{4,8}$/i, '');
    const { data: fallbackData } = await supabase
      .from('anchor_profiles')
      .select(`
        *,
        videos(*),
        photos(*),
        service_packages(*),
        testimonials(*)
      `)
      .eq('slug', cleanBase)
      .maybeSingle();

    if (fallbackData) {
      fallbackData.gigs_completed = extractGigsCompleted(fallbackData);
      fallbackData.profile_layout = extractProfileLayout(fallbackData);
      fallbackData.client_brands = extractClientBrands(fallbackData);
      fallbackData.tour_cities = extractTourCities(fallbackData);
      fallbackData.artist_specialties = extractCleanArtistSpecialties(fallbackData);
      return fallbackData;
    }
  }

  if (error || !data) return null;

  // Determine Verified status based on active paid subscription or admin verified list
  const [{ data: sub }, { data: settingRow }] = await Promise.all([
    data.user_id
      ? supabase
          .from('subscriptions')
          .select('status, plans(tier, slug)')
          .eq('user_id', data.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'verified_anchor_ids')
      .maybeSingle(),
  ]);

  let isExplicitlyVerified = false;
  if (settingRow?.value) {
    try {
      const set = new Set(JSON.parse(settingRow.value));
      isExplicitlyVerified = set.has(data.id);
    } catch {}
  }

  const hasActivePaidSub =
    sub?.status === 'active' &&
    sub?.plans &&
    (sub.plans as any).tier > 0 &&
    (sub.plans as any).slug !== 'free';

  data.is_verified = Boolean(hasActivePaidSub || isExplicitlyVerified);
  data.gigs_completed = extractGigsCompleted(data);
  data.profile_layout = extractProfileLayout(data);
  data.client_brands = extractClientBrands(data);
  data.tour_cities = extractTourCities(data);
  data.artist_specialties = extractCleanArtistSpecialties(data);
  return data;
}

// ---- Get directory anchors ----
export async function getDirectoryAnchors(filters?: {
  city?: string;
  event_type?: string;
  language?: string;
  search?: string;
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from('anchor_profiles')
    .select('id, user_id, name, slug, tagline, city, state, languages, event_types, profile_photo_url, experience_years, starting_price, whatsapp_number')
    .neq('is_listed_in_directory', false)
    .order('created_at', { ascending: false });

  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.event_type) query = query.contains('event_types', [filters.event_type]);
  if (filters?.language) query = query.contains('languages', [filters.language]);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query.limit(50);
  if (error || !data) return [];

  const userIds = data.map((p) => p.user_id).filter(Boolean);

  // Fetch featured/verified settings and active paid subscriptions
  const [{ data: settingRows }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['featured_anchor_ids', 'verified_anchor_ids']),
    userIds.length > 0
      ? supabase
          .from('subscriptions')
          .select('user_id, status, plans(name, slug, tier)')
          .in('user_id', userIds)
      : Promise.resolve({ data: [] }),
  ]);

  let featuredIds = new Set<string>();
  let verifiedIds = new Set<string>();
  settingRows?.forEach((row) => {
    if (row.key === 'featured_anchor_ids' && row.value) {
      try { featuredIds = new Set(JSON.parse(row.value)); } catch {}
    }
    if (row.key === 'verified_anchor_ids' && row.value) {
      try { verifiedIds = new Set(JSON.parse(row.value)); } catch {}
    }
  });

  // Only active paid subscribers (Starter, Pro, Premium) who paid online have KYC payment records
  const paidSubscriberUserIds = new Set<string>();
  (subscriptions || []).forEach((sub: any) => {
    const isPaidActive =
      sub.status === 'active' && sub.plans && sub.plans.tier > 0 && sub.plans.slug !== 'free';
    if (isPaidActive && sub.user_id) {
      paidSubscriberUserIds.add(sub.user_id);
    }
  });

  const enhanced = data.map((p) => ({
    ...p,
    is_featured: featuredIds.has(p.id),
    is_verified: (p.user_id && paidSubscriberUserIds.has(p.user_id)) || verifiedIds.has(p.id),
  }));

  // Featured anchors get top boost
  enhanced.sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return enhanced;
}

// ---- Upload profile photo ----
export async function uploadProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop();
  const path = `profile-photos/${user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

  await supabase
    .from('anchor_profiles')
    .update({ profile_photo_url: publicUrl })
    .eq('user_id', user.id);

  revalidatePath('/portfolio');
  return publicUrl;
}

// ---- Submit client review for public profile ----
export async function submitClientReview(data: {
  profile_id: string;
  slug?: string;
  client_name: string;
  client_designation?: string;
  rating: number;
  event_type: string;
  event_date?: string | null;
  text: string;
}) {
  const cleanName = data.client_name?.trim();
  const cleanText = data.text?.trim();

  if (!cleanName) throw new Error('Your name is required');
  if (!cleanText) throw new Error('Please write your review feedback');

  const adminClient = createAdminClient();

  const newTestimonial = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    profile_id: data.profile_id,
    client_name: cleanName,
    client_designation: data.client_designation?.trim() || '',
    text: cleanText,
    rating: Math.min(5, Math.max(1, data.rating || 5)),
    event_type: data.event_type || 'Event',
    event_date: data.event_date || null,
    is_visible: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await adminClient
    .from('testimonials')
    .insert(newTestimonial)
    .select()
    .single();

  if (error) {
    console.error('Direct testimonial insert error:', error);
    throw new Error('Failed to submit review. Please try again.');
  }

  if (data.slug) {
    revalidatePath(`/${data.slug}`);
  }
  return { success: true, review: inserted };
}

// ---- Save Custom Slot Timings to DB & Profile ----
export async function saveSlotTimings(times: { morning: string; evening: string; full_day: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, artist_specialties')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const currentSpecialties: string[] = Array.isArray(profile.artist_specialties) ? profile.artist_specialties : [];
  const cleanSpecialties = currentSpecialties.filter((s) => typeof s === 'string' && !s.startsWith('slot_times:'));
  cleanSpecialties.push(`slot_times:${JSON.stringify(times)}`);

  try {
    await supabase
      .from('anchor_profiles')
      .update({
        slot_times: times,
        artist_specialties: cleanSpecialties,
      })
      .eq('id', profile.id);
  } catch {
    await supabase
      .from('anchor_profiles')
      .update({
        artist_specialties: cleanSpecialties,
      })
      .eq('id', profile.id);
  }

  revalidatePath('/schedule');
  return { success: true, slot_times: times };
}


