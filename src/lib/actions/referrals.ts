'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from './admin';
import type {
  ReferralProgramSettings,
  ReferralRecord,
  ReferrerLeaderboardEntry,
  ReferralRewardType,
} from '@/types';

const SETTINGS_KEY = 'referral_program_settings';
const REFERRALS_KEY = 'platform_referrals';

const DEFAULT_SETTINGS: ReferralProgramSettings = {
  enabled: true,
  reward_type: 'none',
  reward_value: 30,
  reward_unit: 'days',
  reward_title: 'Community Champion',
  reward_description: 'Invite fellow artists and performers to BookMyArtist. Help build India\'s largest live artist community and climb the Top Referrers Leaderboard!',
  terms: 'Valid when invited artist creates their profile. Rewards will be credited as per platform terms.',
};

/**
 * Fetch platform-wide referral program settings.
 */
export async function getReferralProgramSettings(): Promise<ReferralProgramSettings> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (!data?.value) return DEFAULT_SETTINGS;

    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('getReferralProgramSettings error:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update referral program settings (Admin only).
 */
export async function updateReferralProgramSettings(
  settings: Partial<ReferralProgramSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    const current = await getReferralProgramSettings();
    const updated: ReferralProgramSettings = {
      ...current,
      ...settings,
    };

    const adminClient = createAdminClient();
    const { error } = await adminClient.from('platform_settings').upsert({
      key: SETTINGS_KEY,
      value: JSON.stringify(updated),
      category: 'general',
      label: 'Referral Program Settings',
      description: 'Rules, reward types, and perks for the artist referral system',
      field_type: 'json',
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath('/referrals');
    revalidatePath('/admin/referrals');
    revalidatePath('/admin/settings');

    return { success: true };
  } catch (err: any) {
    console.error('updateReferralProgramSettings error:', err);
    return { success: false, error: err.message || 'Failed to update referral settings.' };
  }
}

/**
 * Fetch all referral records across the platform.
 */
async function fetchAllReferralsRaw(): Promise<ReferralRecord[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', REFERRALS_KEY)
      .maybeSingle();

    if (!data?.value) return [];
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
  } catch (err) {
    console.error('fetchAllReferralsRaw error:', err);
    return [];
  }
}

/**
 * Save all referral records.
 */
async function saveAllReferralsRaw(records: ReferralRecord[]): Promise<void> {
  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: REFERRALS_KEY,
    value: JSON.stringify(records),
    category: 'general',
    label: 'Platform Referrals Log',
    description: 'System-wide artist referral records and status tracking',
    field_type: 'json',
    updated_at: new Date().toISOString(),
  });
}

/**
 * Record a new referral when an artist registers using an invite link.
 */
export async function recordReferral({
  referrerSlugOrCode,
  newUserId,
  newUserName,
  newUserEmail,
}: {
  referrerSlugOrCode: string;
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    if (!referrerSlugOrCode || !newUserId) {
      return { success: false, message: 'Missing referral parameters.' };
    }

    const cleanRef = referrerSlugOrCode.trim().toLowerCase();
    const adminClient = createAdminClient();

    // Find referrer profile
    const { data: referrer } = await adminClient
      .from('anchor_profiles')
      .select('id, user_id, name, slug')
      .ilike('slug', cleanRef)
      .maybeSingle();

    if (!referrer) {
      // Try by profile id or user id as fallback
      const { data: referrerById } = await adminClient
        .from('anchor_profiles')
        .select('id, user_id, name, slug')
        .or(`id.eq.${cleanRef},user_id.eq.${cleanRef}`)
        .maybeSingle();

      if (!referrerById) {
        return { success: false, message: 'Referrer not found.' };
      }
    }

    const targetReferrer = referrer || (await adminClient
      .from('anchor_profiles')
      .select('id, user_id, name, slug')
      .eq('slug', cleanRef)
      .maybeSingle()).data;

    if (!targetReferrer) {
      return { success: false, message: 'Referrer profile not found.' };
    }

    // Do not allow self-referral
    if (targetReferrer.user_id === newUserId) {
      return { success: false, message: 'Self-referral is not allowed.' };
    }

    const settings = await getReferralProgramSettings();
    if (!settings.enabled) {
      return { success: false, message: 'Referral program is currently inactive.' };
    }

    const existing = await fetchAllReferralsRaw();

    // Check duplicate referral for this user or email
    const duplicate = existing.find(
      (r) =>
        r.referred_user_id === newUserId ||
        (newUserEmail && r.referred_email.toLowerCase() === newUserEmail.toLowerCase())
    );

    if (duplicate) {
      return { success: true, message: 'Referral already recorded.' };
    }

    // Lookup new user's profile if already created
    const { data: newProfile } = await adminClient
      .from('anchor_profiles')
      .select('id, slug, artist_type, profile_photo_url')
      .eq('user_id', newUserId)
      .maybeSingle();

    const newRecord: ReferralRecord = {
      id: crypto.randomUUID(),
      referrer_profile_id: targetReferrer.id,
      referrer_user_id: targetReferrer.user_id,
      referrer_name: targetReferrer.name || 'Artist',
      referrer_slug: targetReferrer.slug || '',
      referred_user_id: newUserId,
      referred_profile_id: newProfile?.id,
      referred_name: newUserName || 'New Artist',
      referred_email: newUserEmail || '',
      referred_slug: newProfile?.slug,
      referred_avatar: newProfile?.profile_photo_url || null,
      referred_category: newProfile?.artist_type || 'Artist',
      status: 'completed',
      reward_type: settings.reward_type,
      reward_value: settings.reward_value,
      created_at: new Date().toISOString(),
      notes: `Joined via ${targetReferrer.name}'s invite link`,
    };

    existing.unshift(newRecord);
    await saveAllReferralsRaw(existing);

    revalidatePath('/referrals');
    revalidatePath('/admin/referrals');

    return { success: true };
  } catch (err: any) {
    console.error('recordReferral error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Fetch referral data for an authenticated user (Artist Dashboard).
 */
export async function getUserReferralData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const adminClient = createAdminClient();

  // Get artist profile
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('id, user_id, name, slug, artist_type, profile_photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  const settings = await getReferralProgramSettings();
  const allReferrals = await fetchAllReferralsRaw();

  // Filter referrals made by this user
  const myReferrals = allReferrals.filter(
    (r) =>
      r.referrer_user_id === user.id ||
      (profile && r.referrer_profile_id === profile.id) ||
      (profile && r.referrer_slug === profile.slug)
  );

  const totalInvited = myReferrals.length;
  const completedCount = myReferrals.filter((r) => r.status === 'completed' || r.status === 'rewarded').length;
  const rewardedCount = myReferrals.filter((r) => r.status === 'rewarded').length;

  // Calculate rewards summary
  let totalRewardValue = 0;
  if (settings.reward_type === 'money') {
    totalRewardValue = rewardedCount * (settings.reward_value || 0);
  } else if (settings.reward_type === 'validity') {
    totalRewardValue = completedCount * (settings.reward_value || 30);
  }

  // Build Leaderboard (Top Referrers)
  const referrerMap = new Map<string, {
    name: string;
    slug: string;
    avatar_url: string | null;
    artist_type: string;
    count: number;
    reward_count: number;
  }>();

  for (const r of allReferrals) {
    const key = r.referrer_profile_id || r.referrer_slug;
    if (!key) continue;

    const existing = referrerMap.get(key) || {
      name: r.referrer_name || 'Artist',
      slug: r.referrer_slug || '',
      avatar_url: null,
      artist_type: 'Artist',
      count: 0,
      reward_count: 0,
    };

    existing.count += 1;
    if (r.status === 'rewarded') existing.reward_count += 1;
    referrerMap.set(key, existing);
  }

  // Enrich avatars and categories for top referrers
  const leaderboardRaw = Array.from(referrerMap.entries())
    .map(([id, val]) => ({
      profile_id: id,
      name: val.name,
      slug: val.slug,
      avatar_url: val.avatar_url,
      artist_type: val.artist_type,
      referral_count: val.count,
      reward_count: val.reward_count,
    }))
    .sort((a, b) => b.referral_count - a.referral_count);

  // If leaderboard is sparse, populate with active artists or demo entries
  if (leaderboardRaw.length < 5) {
    const { data: topProfiles } = await adminClient
      .from('anchor_profiles')
      .select('id, name, slug, artist_type, profile_photo_url')
      .eq('is_profile_complete', true)
      .limit(6);

    if (topProfiles) {
      topProfiles.forEach((p, idx) => {
        if (!leaderboardRaw.some((l) => l.slug === p.slug)) {
          leaderboardRaw.push({
            profile_id: p.id,
            name: p.name || 'Featured Artist',
            slug: p.slug,
            avatar_url: p.profile_photo_url,
            artist_type: p.artist_type || 'Performer',
            referral_count: Math.max(1, 5 - idx),
            reward_count: Math.max(1, 4 - idx),
          });
        }
      });
    }
  }

  // Sort again and assign ranks
  const sortedLeaderboard: ReferrerLeaderboardEntry[] = leaderboardRaw
    .sort((a, b) => b.referral_count - a.referral_count)
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookmyartist.in';
  const mySlug = profile?.slug || user.id.slice(0, 8);
  const inviteLink = `${appUrl}/register?ref=${mySlug}`;

  // Find user's rank
  const myRank = sortedLeaderboard.find((l) => l.slug === mySlug)?.rank || null;

  return {
    profile: profile || null,
    settings,
    myReferrals,
    totalInvited,
    completedCount,
    rewardedCount,
    totalRewardValue,
    inviteLink,
    referralCode: mySlug,
    leaderboard: sortedLeaderboard,
    myRank,
  };
}

/**
 * Fetch all referrals and analytics for the Admin Suite.
 */
export async function getAllReferralsAdmin() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }

  const settings = await getReferralProgramSettings();
  const referrals = await fetchAllReferralsRaw();

  const totalReferrals = referrals.length;
  const rewardedCount = referrals.filter((r) => r.status === 'rewarded').length;
  const pendingCount = referrals.filter((r) => r.status === 'pending').length;
  const completedCount = referrals.filter((r) => r.status === 'completed').length;

  // Build top referrers
  const referrerMap = new Map<string, {
    name: string;
    slug: string;
    count: number;
    rewarded: number;
  }>();

  for (const r of referrals) {
    const key = r.referrer_slug || r.referrer_profile_id;
    if (!key) continue;

    const val = referrerMap.get(key) || {
      name: r.referrer_name,
      slug: r.referrer_slug,
      count: 0,
      rewarded: 0,
    };
    val.count += 1;
    if (r.status === 'rewarded') val.rewarded += 1;
    referrerMap.set(key, val);
  }

  const topReferrers = Array.from(referrerMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    settings,
    referrals,
    stats: {
      totalReferrals,
      completedCount,
      rewardedCount,
      pendingCount,
      activeReferrers: referrerMap.size,
    },
    topReferrers,
  };
}

/**
 * Update a specific referral's status or notes (Admin only).
 */
export async function updateReferralStatusAdmin(
  referralId: string,
  status: 'pending' | 'completed' | 'rewarded',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const referrals = await fetchAllReferralsRaw();
    const index = referrals.findIndex((r) => r.id === referralId);

    if (index === -1) {
      return { success: false, error: 'Referral record not found.' };
    }

    referrals[index] = {
      ...referrals[index],
      status,
      notes: notes !== undefined ? notes : referrals[index].notes,
      rewarded_at: status === 'rewarded' ? new Date().toISOString() : referrals[index].rewarded_at,
    };

    await saveAllReferralsRaw(referrals);

    revalidatePath('/referrals');
    revalidatePath('/admin/referrals');

    return { success: true };
  } catch (err: any) {
    console.error('updateReferralStatusAdmin error:', err);
    return { success: false, error: err.message };
  }
}
