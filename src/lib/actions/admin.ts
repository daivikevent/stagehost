'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import type { Coupon, AnnouncementBanner, ActivityLog, CustomDomainRequest } from '@/types';

/**
 * Check if the currently authenticated user is an administrator.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const role = user.user_metadata?.role;
  if (role === 'admin') return true;

  const allowedAdminEmails = [
    'admin@stagehost.in',
    'admin@stagehost.com',
    process.env.ADMIN_EMAIL,
  ].filter(Boolean).map((e) => e?.toLowerCase().trim());

  if (user.email && allowedAdminEmails.includes(user.email.toLowerCase().trim())) {
    return true;
  }

  try {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.is_admin === true) return true;
  } catch (e) {
    // Ignore if column doesn't exist
  }

  return false;
}

/**
 * Fetch platform-wide statistics for the Admin Overview.
 */
export async function getAdminStats() {
  const adminClient = createAdminClient();

  const { count: totalUsers } = await adminClient
    .from('anchor_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: completeProfiles } = await adminClient
    .from('anchor_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_profile_complete', true);

  const { data: activeSubs } = await adminClient
    .from('subscriptions')
    .select('status, plans(name, slug, price_monthly)')
    .eq('status', 'active');

  const paidSubscribers = (activeSubs || []).filter(
    (s: any) => s.plans?.slug && s.plans.slug !== 'free'
  );

  const mrr = paidSubscribers.reduce((acc: number, sub: any) => {
    return acc + (sub.plans?.price_monthly || 0);
  }, 0);

  const { data: recentSignups } = await adminClient
    .from('anchor_profiles')
    .select('id, name, email, city, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalUsers: totalUsers || 0,
    activeProfiles: completeProfiles || 0,
    paidSubscribers: paidSubscribers.length,
    mrr,
    recentSignups: recentSignups || [],
  };
}

/**
 * Fetch all registered users for the Admin Users table.
 */
export async function getAdminUsers() {
  const adminClient = createAdminClient();

  const { data: profiles, error } = await adminClient
    .from('anchor_profiles')
    .select(`
      id,
      user_id,
      name,
      email,
      city,
      slug,
      is_profile_complete,
      is_listed_in_directory,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error || !profiles) return [];

  const [{ data: subscriptions }, { data: authData }, { data: settingRows }] = await Promise.all([
    adminClient.from('subscriptions').select('user_id, status, plans(name, slug, tier)'),
    adminClient.auth.admin.listUsers(),
    adminClient.from('platform_settings').select('key, value').in('key', ['featured_anchor_ids', 'verified_anchor_ids']),
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

  const subMap = new Map((subscriptions || []).map((s: any) => [s.user_id, s]));
  const userMap = new Map((authData?.users || []).map((u) => [u.id, u]));

  return profiles.map((p) => {
    const sub: any = subMap.get(p.user_id);
    const authUser = userMap.get(p.user_id);
    const planName = sub?.plans?.name || 'Free';
    const accountStatus = authUser?.user_metadata?.account_status === 'inactive' ? 'inactive' : 'active';

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name || 'Anchor',
      email: p.email || '—',
      city: p.city || '—',
      slug: p.slug,
      plan: planName,
      status: accountStatus,
      profile_complete: p.is_profile_complete,
      is_listed_in_directory: p.is_listed_in_directory ?? true,
      is_featured: featuredIds.has(p.id),
      is_verified: verifiedIds.has(p.id),
      joined: new Date(p.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  });
}

/**
 * Toggle an anchor account between Active and Inactive/Disabled.
 */
export async function toggleUserStatus(userId: string, targetStatus: 'active' | 'inactive') {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  const { data: userRecord } = await adminClient.auth.admin.getUserById(userId);
  if (userRecord?.user) {
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userRecord.user.user_metadata,
        account_status: targetStatus,
      },
    });
  }

  // If inactivating, also hide from public directory
  if (targetStatus === 'inactive') {
    await adminClient
      .from('anchor_profiles')
      .update({ is_listed_in_directory: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
  revalidatePath('/directory');
  return { success: true, status: targetStatus };
}

/**
 * Bulk update account status (activate / suspend) for multiple anchors simultaneously.
 */
export async function bulkUpdateUserStatus(userIds: string[], targetStatus: 'active' | 'inactive') {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');
  if (!userIds.length) return { success: true, count: 0 };

  const adminClient = createAdminClient();

  for (const userId of userIds) {
    try {
      const { data: userRecord } = await adminClient.auth.admin.getUserById(userId);
      if (userRecord?.user) {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userRecord.user.user_metadata,
            account_status: targetStatus,
          },
        });
      }
    } catch (e) {
      console.error(`Bulk status update error for user ${userId}:`, e);
    }
  }

  // If inactivating, hide all selected users from directory
  if (targetStatus === 'inactive') {
    await adminClient
      .from('anchor_profiles')
      .update({ is_listed_in_directory: false, updated_at: new Date().toISOString() })
      .in('user_id', userIds);
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
  revalidatePath('/directory');
  return { success: true, count: userIds.length, status: targetStatus };
}


/**
 * Change an anchor's subscription plan directly from the Admin Panel.
 */
export async function updateUserPlan(userId: string, newPlan: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const planSlug = newPlan.toLowerCase();

  // Find target plan by slug in plans table
  const { data: targetPlan, error: planErr } = await adminClient
    .from('plans')
    .select('id, name')
    .eq('slug', planSlug)
    .single();

  if (planErr || !targetPlan) {
    throw new Error(`Plan "${newPlan}" not found in database`);
  }

  // Check if subscription already exists for this user
  const { data: existingSub } = await adminClient
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let subId = existingSub?.id;

  if (existingSub) {
    const { error: upErr } = await adminClient
      .from('subscriptions')
      .update({
        plan_id: targetPlan.id,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id);

    if (upErr) throw new Error(upErr.message);
  } else {
    const { data: newSub, error: insErr } = await adminClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: targetPlan.id,
        status: 'active',
      })
      .select('id')
      .single();

    if (insErr) throw new Error(insErr.message);
    subId = newSub?.id;
  }

  // Link to anchor_profiles table
  if (subId) {
    await adminClient
      .from('anchor_profiles')
      .update({ subscription_id: subId, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
  revalidatePath('/settings');
  return { success: true, planName: targetPlan.name };
}

/**
 * Toggle whether an anchor is visible in the public directory.
 */
export async function updateUserDirectoryListing(profileId: string, isListed: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('anchor_profiles')
    .update({ is_listed_in_directory: isListed, updated_at: new Date().toISOString() })
    .eq('id', profileId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
  revalidatePath('/directory');
  return { success: true };
}

/**
 * Permanently delete a user from the platform.
 */
export async function deleteUserAccount(userId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  // Delete profile first
  await adminClient.from('anchor_profiles').delete().eq('user_id', userId);
  await adminClient.from('subscriptions').delete().eq('user_id', userId);

  // Delete auth account
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

/**
 * Fetch platform settings from database.
 */
export async function getPlatformSettings(): Promise<Record<string, string>> {
  const adminClient = createAdminClient();
  const { data } = await adminClient.from('platform_settings').select('key, value');

  const defaults: Record<string, string> = {
    platform_name: 'StageHost',
    platform_tagline: 'The Professional Platform for Event Anchors',
    support_email: 'support@stagehost.in',
    support_whatsapp: '',
    maintenance_mode: 'false',
    allow_new_registrations: 'true',
    require_email_verification: 'false',
    directory_auto_list: 'true',
    branding_watermark_text: 'Powered by StageHost',
    branding_watermark_link: 'https://stagehost.in',
    email_from_name: 'StageHost',
    email_from_address: 'notifications@stagehost.in',
    resend_api_key: (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder') ? '••••••••••••••••' : '',
    site_theme: 'obsidian-violet',
  };

  if (!data) return defaults;

  data.forEach((row) => {
    if (row.key && row.value !== undefined && row.value !== null) {
      defaults[row.key] = row.value;
    }
  });

  return defaults;
}

/**
 * Save platform settings to database.
 */
export async function savePlatformSettings(settings: Record<string, string | boolean>) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  const entries = Object.entries(settings).map(([key, val]) => ({
    key,
    value: typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val),
    updated_at: new Date().toISOString(),
  }));

  for (const entry of entries) {
    await adminClient
      .from('platform_settings')
      .upsert(entry, { onConflict: 'key' });
  }

  // If site_theme was updated, sync cookie and layout
  if (settings.site_theme && typeof settings.site_theme === 'string') {
    try {
      const cookieStore = await cookies();
      cookieStore.set('stagehost_site_theme', settings.site_theme, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    } catch {}
    revalidatePath('/', 'layout');
    revalidatePath('/admin/themes');
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

/**
 * Send a live test email via Resend to verify configuration.
 */
export async function sendAdminTestEmail(toEmail: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  let apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_placeholder') {
    const { data: row } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'resend_api_key')
      .maybeSingle();
    if (row?.value && row.value !== 're_placeholder') {
      apiKey = row.value;
    }
  }

  if (!apiKey || apiKey === 're_placeholder') {
    throw new Error('Resend API key is not configured. Please add your Resend API key in Admin Settings or Vercel environment variables.');
  }

  const resend = new Resend(apiKey);
  let res = await resend.emails.send({
    from: 'StageHost <notifications@stagehost.in>',
    to: [toEmail],
    subject: '🧪 StageHost Admin Test Email',
    html: `
      <div style="font-family: sans-serif; background: #0A0A14; color: #fff; padding: 24px; border-radius: 12px;">
        <h2 style="color: #6C5CE7;">StageHost Admin Test</h2>
        <p>This is a verified test email sent from the <strong>StageHost SaaS Admin Panel</strong>.</p>
        <p>Your email infrastructure (Resend) is working perfectly!</p>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <small style="color: #888;">Timestamp: ${new Date().toLocaleString()}</small>
      </div>
    `,
  });

  if (res.error && (res.error as any).message?.includes('not verified')) {
    res = await resend.emails.send({
      from: 'StageHost <onboarding@resend.dev>',
      to: [toEmail],
      subject: '🧪 StageHost Admin Test Email',
      html: `
        <div style="font-family: sans-serif; background: #0A0A14; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #6C5CE7;">StageHost Admin Test</h2>
          <p>This is a verified test email sent from the <strong>StageHost SaaS Admin Panel</strong>.</p>
          <p>Your email infrastructure (Resend) is working perfectly!</p>
          <hr style="border-color: rgba(255,255,255,0.1);" />
          <small style="color: #888;">Timestamp: ${new Date().toLocaleString()}</small>
        </div>
      `,
    });
  }

  if (res.error) throw new Error(res.error.message);
  return { success: true, data: res.data };
}

/**
 * Fetch all themes from database for Admin Themes page.
 */
export async function getAdminThemesList() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('themes')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      { id: '1', name: 'Obsidian Night', slug: 'obsidian-night', primary: '#6C5CE7', bg: '#0A0A14', min_plan_tier: 0, available_from: 'free', active: true },
      { id: '2', name: 'Pearl White', slug: 'pearl-white', primary: '#4F46E5', bg: '#FFFFFF', min_plan_tier: 1, available_from: 'starter', active: true },
      { id: '3', name: 'Crimson Stage', slug: 'crimson-stage', primary: '#EF4444', bg: '#0C0A09', min_plan_tier: 1, available_from: 'starter', active: true },
      { id: '4', name: 'Royal Indigo', slug: 'royal-indigo', primary: '#8B5CF6', bg: '#0F0B1E', min_plan_tier: 2, available_from: 'pro', active: true },
      { id: '5', name: 'Emerald Glow', slug: 'emerald-glow', primary: '#10B981', bg: '#052E16', min_plan_tier: 2, available_from: 'pro', active: true },
    ];
  }

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    primary: t.variables?.['--color-primary'] || '#6C5CE7',
    bg: t.variables?.['--color-bg-primary'] || '#0A0A14',
    min_plan_tier: t.min_plan_tier ?? 0,
    available_from: (t.min_plan_tier ?? 0) === 0 ? 'free' : t.min_plan_tier === 1 ? 'starter' : t.min_plan_tier === 2 ? 'pro' : 'premium',
    active: t.is_active ?? true,
  }));
}

/**
 * Toggle theme active status.
 */
export async function toggleThemeStatus(themeId: string, active: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('themes')
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq('id', themeId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/themes');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Update theme details, colors and plan tier allocation.
 */
export async function updateAdminTheme(
  themeId: string,
  updates: {
    name: string;
    primaryColor: string;
    bgColor: string;
    minPlanTier: number;
  }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  const { data: currentTheme } = await adminClient
    .from('themes')
    .select('variables')
    .eq('id', themeId)
    .single();

  const currentVars = currentTheme?.variables || {};

  const { error } = await adminClient
    .from('themes')
    .update({
      name: updates.name,
      min_plan_tier: updates.minPlanTier,
      variables: {
        ...currentVars,
        '--color-primary': updates.primaryColor,
        '--color-bg-primary': updates.bgColor,
        '--color-bg-secondary': updates.bgColor,
        '--color-text-primary': updates.bgColor.toLowerCase() === '#ffffff' ? '#000000' : '#FFFFFF',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', themeId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/themes');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Quick-update plan tier allocation for a theme.
 */
export async function updateThemeTierAllocation(themeId: string, minPlanTier: number) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('themes')
    .update({
      min_plan_tier: minPlanTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', themeId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/themes');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Add a new theme.
 */
export async function createAdminTheme(themeData: {
  name: string;
  category: string;
  primaryColor: string;
  bgColor: string;
  minPlanTier: number;
}) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('themes').insert({
    name: themeData.name,
    category: themeData.category || 'dark',
    min_plan_tier: themeData.minPlanTier,
    is_active: true,
    variables: {
      '--color-primary': themeData.primaryColor,
      '--color-bg-primary': themeData.bgColor,
      '--color-bg-secondary': themeData.bgColor,
      '--color-text-primary': themeData.bgColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
    },
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/themes');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Delete a custom theme.
 */
export async function deleteAdminTheme(themeId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('themes').delete().eq('id', themeId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/themes');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Fetch payments list for Payments page.
 */
export async function getAdminPayments() {
  const adminClient = createAdminClient();
  const { data: payments } = await adminClient
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!payments || payments.length === 0) {
    return [];
  }

  // Correlate with users
  const { data: profiles } = await adminClient.from('anchor_profiles').select('user_id, name');
  const nameMap = new Map((profiles || []).map(p => [p.user_id, p.name]));

  return payments.map(p => ({
    id: p.razorpay_payment_id || p.id.slice(0, 10),
    name: nameMap.get(p.user_id) || 'Anchor',
    plan: p.plan_name || 'Pro',
    amount: p.amount,
    status: p.status,
    date: new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }));
}

/**
 * Fetch all plans directly from the Supabase database.
 */
export async function getAdminPlans() {
  const adminClient = createAdminClient();
  const { data: plans } = await adminClient
    .from('plans')
    .select('*')
    .order('tier', { ascending: true });

  if (!plans || plans.length === 0) {
    return [
      { id: 'free', name: 'Free', slug: 'free', price: 0, price_yearly: 0, description: 'Perfect to get started', tier: 0, is_active: true, is_popular: false, videos: 3, photos: 6, services: 3, analytics: false, custom_domain: false, verified_badge: false, themes: 1, branding: true },
      { id: 'starter', name: 'Starter', slug: 'starter', price: 199, price_yearly: 1999, description: 'For growing anchors', tier: 1, is_active: true, is_popular: false, videos: 10, photos: 20, services: 10, analytics: false, custom_domain: false, verified_badge: false, themes: 3, branding: false },
      { id: 'pro', name: 'Pro', slug: 'pro', price: 599, price_yearly: 5999, description: 'For serious professionals', tier: 2, is_active: true, is_popular: true, videos: 30, photos: 60, services: -1, analytics: true, custom_domain: false, verified_badge: true, themes: 5, branding: false },
      { id: 'premium', name: 'Premium', slug: 'premium', price: 1299, price_yearly: 12999, description: 'For top-tier anchors', tier: 3, is_active: true, is_popular: false, videos: -1, photos: -1, services: -1, analytics: true, custom_domain: true, verified_badge: true, themes: -1, branding: false },
    ];
  }

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price_monthly,
    price_yearly: p.price_yearly ?? (p.price_monthly * 10),
    strike_price: p.limits?.strike_price ? Number(p.limits.strike_price) : undefined,
    period_text: p.limits?.period_text || (p.price_monthly === 0 ? 'forever' : undefined),
    tier: p.tier,
    description: p.description ?? '',
    is_active: p.is_active ?? true,
    is_popular: !!p.is_popular,
    videos: p.limits?.max_videos ?? (p.tier === 0 ? 3 : p.tier === 1 ? 10 : p.tier === 2 ? 30 : -1),
    photos: p.limits?.max_photos ?? (p.tier === 0 ? 6 : p.tier === 1 ? 20 : p.tier === 2 ? 60 : -1),
    services: p.limits?.max_service_packages ?? (p.tier === 0 ? 3 : p.tier === 1 ? 10 : -1),
    analytics: !!p.limits?.analytics_dashboard,
    custom_domain: !!p.limits?.custom_domain,
    verified_badge: !!p.limits?.verified_badge,
    themes: p.tier === 0 ? 1 : p.tier === 1 ? 3 : p.tier === 2 ? 5 : -1,
    branding: !p.limits?.remove_branding_footer,
  }));
}

/**
 * Update plan limits, details and price in the Supabase database.
 */
export async function updateAdminPlan(
  planId: string,
  updates: {
    name?: string;
    description?: string;
    price: number;
    price_yearly?: number;
    strike_price?: number;
    period_text?: string;
    videos: number;
    photos: number;
    services: number;
    themes?: number;
    analytics: boolean;
    custom_domain: boolean;
    verified_badge?: boolean;
    branding: boolean;
    is_popular?: boolean;
    is_active?: boolean;
  }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  // 1. Get current plan
  const { data: currentPlan } = await adminClient
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  const currentLimits = currentPlan?.limits || {};

  const mergedLimits = {
    ...currentLimits,
    max_videos: updates.videos,
    max_photos: updates.photos,
    max_service_packages: updates.services,
    max_themes: updates.themes ?? currentLimits.max_themes ?? -1,
    analytics_dashboard: updates.analytics,
    custom_domain: updates.custom_domain,
    verified_badge: updates.verified_badge ?? currentLimits.verified_badge ?? false,
    remove_branding_footer: !updates.branding,
    remove_branding_full: !updates.branding,
    strike_price: updates.strike_price !== undefined ? (updates.strike_price || null) : currentLimits.strike_price,
    period_text: updates.period_text !== undefined ? (updates.period_text.trim() || null) : currentLimits.period_text,
  };

  const dynamicFeatures: string[] = [
    updates.videos === -1 ? 'Unlimited showreel videos' : `${updates.videos} showreel videos`,
    updates.photos === -1 ? 'Unlimited photo gallery' : `${updates.photos} photos`,
    updates.services === -1 ? 'Unlimited service packages' : `${updates.services} service packages`,
    'Direct WhatsApp booking button',
    'StageHost Directory listing',
  ];
  if (updates.verified_badge) dynamicFeatures.push('Verified Artist Blue Tick Badge');
  if (updates.analytics) dynamicFeatures.push('Advanced visitor & lead analytics');
  if (updates.custom_domain) dynamicFeatures.push('Custom domain connection');
  if (!updates.branding) dynamicFeatures.push('Zero StageHost branding');
  if ((updates.themes ?? 1) > 1) dynamicFeatures.push(`${updates.themes === -1 ? 'All' : updates.themes} themes unlocked`);

  const payload: Record<string, any> = {
    price_monthly: updates.price,
    limits: mergedLimits,
    features: dynamicFeatures,
    updated_at: new Date().toISOString(),
  };

  if (updates.name) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.price_yearly !== undefined) payload.price_yearly = updates.price_yearly;
  if (updates.is_popular !== undefined) payload.is_popular = updates.is_popular;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { error } = await adminClient
    .from('plans')
    .update(payload)
    .eq('id', planId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/plans');
  revalidatePath('/pricing');
  revalidatePath('/');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Create a new custom subscription plan in Supabase.
 */
export async function createAdminPlan(data: {
  name: string;
  slug?: string;
  price_monthly: number;
  price_yearly?: number;
  strike_price?: number;
  period_text?: string;
  description?: string;
  videos: number;
  photos: number;
  services: number;
  themes?: number;
  analytics: boolean;
  custom_domain: boolean;
  verified_badge?: boolean;
  branding: boolean;
  is_popular?: boolean;
}) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  if (!data.name?.trim()) throw new Error('Plan name is required');

  const adminClient = createAdminClient();

  // Generate unique slug
  let slug = data.slug?.trim()
    ? data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (!slug) slug = `plan-${Date.now().toString().slice(-4)}`;

  // Check if slug exists
  const { data: existing } = await adminClient
    .from('plans')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Get max tier to determine sorting
  const { data: existingPlans } = await adminClient
    .from('plans')
    .select('tier')
    .order('tier', { ascending: false })
    .limit(1);

  const highestTier = existingPlans?.[0]?.tier ?? 3;
  const tier = highestTier + 1;

  const limits = {
    max_videos: Number(data.videos),
    max_photos: Number(data.photos),
    max_service_packages: Number(data.services),
    max_themes: data.themes ?? (tier >= 2 ? -1 : 3),
    analytics_dashboard: !!data.analytics,
    custom_domain: !!data.custom_domain,
    verified_badge: !!data.verified_badge,
    remove_branding_footer: !data.branding,
    remove_branding_full: !data.branding,
    strike_price: data.strike_price ? Number(data.strike_price) : null,
    period_text: data.period_text?.trim() || null,
  };

  const monthly = Math.max(0, Number(data.price_monthly));
  const yearly = data.price_yearly !== undefined ? Math.max(0, Number(data.price_yearly)) : monthly * 10;

  const features = [
    data.videos === -1 ? 'Unlimited showreel videos' : `${data.videos} showreel videos`,
    data.photos === -1 ? 'Unlimited photo gallery' : `${data.photos} photos`,
    data.services === -1 ? 'Unlimited service packages' : `${data.services} service packages`,
    'Direct WhatsApp booking button',
    'StageHost Directory listing',
    'Zero booking commissions',
  ];
  if (data.verified_badge) features.push('Verified Artist Blue Tick Badge');
  if (data.analytics) features.push('Advanced visitor & lead analytics');
  if (data.custom_domain) features.push('Custom domain connection (yourname.com)');
  if (!data.branding) features.push('Zero StageHost footer branding');

  const { data: newPlan, error } = await adminClient
    .from('plans')
    .insert({
      name: data.name.trim(),
      slug,
      tier,
      price_monthly: monthly,
      price_yearly: yearly,
      description: data.description?.trim() || 'Custom plan for event anchors',
      features,
      limits,
      is_active: true,
      is_popular: !!data.is_popular,
      sort_order: tier,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/plans');
  revalidatePath('/pricing');
  revalidatePath('/');
  revalidatePath('/settings');

  return {
    success: true,
    plan: {
      id: newPlan.id,
      name: newPlan.name,
      slug: newPlan.slug,
      price: newPlan.price_monthly,
      price_yearly: newPlan.price_yearly,
      strike_price: newPlan.limits?.strike_price ? Number(newPlan.limits.strike_price) : undefined,
      period_text: newPlan.limits?.period_text || undefined,
      tier: newPlan.tier,
      description: newPlan.description,
      is_active: newPlan.is_active,
      is_popular: newPlan.is_popular,
      videos: newPlan.limits?.max_videos ?? data.videos,
      photos: newPlan.limits?.max_photos ?? data.photos,
      services: newPlan.limits?.max_service_packages ?? data.services,
      analytics: !!newPlan.limits?.analytics_dashboard,
      custom_domain: !!newPlan.limits?.custom_domain,
      verified_badge: !!newPlan.limits?.verified_badge,
      themes: newPlan.limits?.max_themes ?? -1,
      branding: !newPlan.limits?.remove_branding_footer,
    },
  };
}

/**
 * Delete a plan or deactivate it safely if existing subscribers are attached.
 */
export async function deleteAdminPlan(planId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();

  // 1. Fetch plan to verify
  const { data: plan, error: fetchErr } = await adminClient
    .from('plans')
    .select('id, name, slug')
    .eq('id', planId)
    .single();

  if (fetchErr || !plan) {
    throw new Error('Plan not found');
  }

  if (plan.slug === 'free') {
    throw new Error('The default Free plan cannot be deleted as it is the base tier of the platform.');
  }

  // 2. Check if any subscriptions reference this plan
  const { count, error: subErr } = await adminClient
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId);

  if (!subErr && count && count > 0) {
    // Cannot hard delete due to foreign key constraints.
    // Deactivate so it is removed from public pricing while preserving subscriber data.
    const { error: deactErr } = await adminClient
      .from('plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (deactErr) throw new Error(deactErr.message);

    revalidatePath('/admin/plans');
    revalidatePath('/pricing');
    revalidatePath('/');
    revalidatePath('/settings');
    return {
      success: true,
      deactivated: true,
      message: `Plan "${plan.name}" has ${count} existing subscriber(s). It has been deactivated and hidden from public pricing instead of being deleted.`,
    };
  }

  // 3. No subscriptions, hard delete safely
  const { error: delErr } = await adminClient
    .from('plans')
    .delete()
    .eq('id', planId);

  if (delErr) throw new Error(delErr.message);

  revalidatePath('/admin/plans');
  revalidatePath('/pricing');
  revalidatePath('/');
  revalidatePath('/settings');
  return {
    success: true,
    deactivated: false,
    message: `Plan "${plan.name}" deleted successfully.`,
  };
}

/**
 * -------------------------------------------------------------
 * 1. FEATURED & VERIFIED ANCHORS (DIRECTORY BOOST)
 * -------------------------------------------------------------
 */
export async function toggleFeaturedAnchor(profileId: string, isFeatured: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'featured_anchor_ids')
    .maybeSingle();

  let list: string[] = [];
  if (row?.value) {
    try { list = JSON.parse(row.value); } catch {}
  }

  if (isFeatured) {
    if (!list.includes(profileId)) list.push(profileId);
  } else {
    list = list.filter((id) => id !== profileId);
  }

  await adminClient
    .from('platform_settings')
    .upsert({
      key: 'featured_anchor_ids',
      value: JSON.stringify(list),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  revalidatePath('/admin/users');
  revalidatePath('/directory');
  return { success: true, isFeatured };
}

export async function toggleVerifiedAnchor(profileId: string, isVerified: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'verified_anchor_ids')
    .maybeSingle();

  let list: string[] = [];
  if (row?.value) {
    try { list = JSON.parse(row.value); } catch {}
  }

  if (isVerified) {
    if (!list.includes(profileId)) list.push(profileId);
  } else {
    list = list.filter((id) => id !== profileId);
  }

  await adminClient
    .from('platform_settings')
    .upsert({
      key: 'verified_anchor_ids',
      value: JSON.stringify(list),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  revalidatePath('/admin/users');
  revalidatePath('/directory');
  return { success: true, isVerified };
}

/**
 * -------------------------------------------------------------
 * 2. BROADCAST ANNOUNCEMENT BANNER
 * -------------------------------------------------------------
 */
export async function getAnnouncementBanner(): Promise<AnnouncementBanner> {
  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'announcement_banner')
    .maybeSingle();

  if (!row?.value) {
    return {
      is_active: false,
      message: '',
      link_url: '',
      link_text: '',
      type: 'info',
    };
  }

  try {
    return JSON.parse(row.value);
  } catch {
    return {
      is_active: false,
      message: '',
      link_url: '',
      link_text: '',
      type: 'info',
    };
  }
}

export async function saveAnnouncementBanner(banner: AnnouncementBanner) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  await adminClient
    .from('platform_settings')
    .upsert({
      key: 'announcement_banner',
      value: JSON.stringify({
        ...banner,
        updated_at: new Date().toISOString(),
      }),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  revalidatePath('/admin/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * -------------------------------------------------------------
 * 3. PROMO CODES / COUPONS ENGINE
 * -------------------------------------------------------------
 */
export async function getCoupons(): Promise<Coupon[]> {
  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_coupons')
    .maybeSingle();

  if (!row?.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

export async function createCoupon(data: {
  code: string;
  discount_percent: number;
  valid_until?: string | null;
  max_uses?: number | null;
}) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) throw new Error('Coupon code is required');
  if (data.discount_percent <= 0 || data.discount_percent > 100) {
    throw new Error('Discount percentage must be between 1 and 100');
  }

  const existing = await getCoupons();
  if (existing.some((c) => c.code === cleanCode)) {
    throw new Error(`Coupon "${cleanCode}" already exists`);
  }

  const newCoupon: Coupon = {
    id: `coup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    code: cleanCode,
    discount_percent: data.discount_percent,
    valid_until: data.valid_until || null,
    max_uses: data.max_uses || null,
    times_used: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const updatedList = [newCoupon, ...existing];
  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: 'platform_coupons',
    value: JSON.stringify(updatedList),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/admin/plans');
  return { success: true, coupon: newCoupon };
}

export async function deleteCoupon(couponId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const existing = await getCoupons();
  const updated = existing.filter((c) => c.id !== couponId);

  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: 'platform_coupons',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/admin/plans');
  return { success: true };
}

export async function toggleCouponStatus(couponId: string, isActive: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const existing = await getCoupons();
  const updated = existing.map((c) => (c.id === couponId ? { ...c, is_active: isActive } : c));

  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: 'platform_coupons',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/admin/plans');
  return { success: true };
}

export async function validateCoupon(code: string): Promise<{
  valid: boolean;
  discount_percent?: number;
  message?: string;
  code?: string;
}> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Please enter a coupon code' };
  }

  const coupons = await getCoupons();
  const match = coupons.find((c) => c.code === cleanCode);

  if (!match) {
    return { valid: false, message: 'Invalid promo code' };
  }

  if (!match.is_active) {
    return { valid: false, message: 'This coupon is inactive' };
  }

  if (match.valid_until && new Date(match.valid_until).getTime() < Date.now()) {
    return { valid: false, message: 'This coupon has expired' };
  }

  if (match.max_uses && match.times_used >= match.max_uses) {
    return { valid: false, message: 'This coupon has reached its maximum redemptions' };
  }

  return {
    valid: true,
    discount_percent: match.discount_percent,
    code: match.code,
    message: `${match.discount_percent}% discount applied!`,
  };
}

/**
 * Increment usage counter when a coupon is successfully applied to a subscription order.
 */
export async function recordCouponUse(code: string) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return;

  const coupons = await getCoupons();
  const index = coupons.findIndex((c) => c.code === cleanCode);
  if (index >= 0) {
    coupons[index].times_used = (coupons[index].times_used || 0) + 1;
    const adminClient = createAdminClient();
    await adminClient.from('platform_settings').upsert({
      key: 'platform_coupons',
      value: JSON.stringify(coupons),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    revalidatePath('/admin/plans');
  }
}


/**
 * -------------------------------------------------------------
 * 4. PLATFORM LEAD & INQUIRY ROI ANALYTICS
 * -------------------------------------------------------------
 */
export async function getPlatformInquiryStats() {
  const adminClient = createAdminClient();

  const { data: allInquiries, error } = await adminClient
    .from('inquiries')
    .select('id, status, source, budget_range, event_city, created_at');

  if (error || !allInquiries) {
    return {
      total: 0,
      newCount: 0,
      contactedCount: 0,
      convertedCount: 0,
      lostCount: 0,
      conversionRate: 0,
      estimatedDealVolume: 0,
      topCities: [],
      recentInquiriesCount: 0,
    };
  }

  const total = allInquiries.length;
  const newCount = allInquiries.filter((i) => i.status === 'new').length;
  const contactedCount = allInquiries.filter((i) => i.status === 'contacted').length;
  const convertedCount = allInquiries.filter((i) => i.status === 'converted').length;
  const lostCount = allInquiries.filter((i) => i.status === 'lost').length;
  const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

  const estimatedDealVolume = allInquiries.reduce((acc, curr) => {
    if (curr.status === 'lost') return acc;
    const budget = curr.budget_range || '';
    if (budget.includes('1,00,000+')) return acc + 120000;
    if (budget.includes('50,000 - 1,00,000')) return acc + 75000;
    if (budget.includes('25,000 - 50,000')) return acc + 35000;
    if (budget.includes('10,000 - 25,000')) return acc + 18000;
    if (budget.includes('Under 10,000')) return acc + 8000;
    return acc + 25000;
  }, 0);

  const cityCounts: Record<string, number> = {};
  allInquiries.forEach((i) => {
    const city = (i.event_city || '').trim();
    if (city) {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });

  const topCities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    newCount,
    contactedCount,
    convertedCount,
    lostCount,
    conversionRate,
    estimatedDealVolume,
    topCities,
    recentInquiriesCount: allInquiries.filter((i) => {
      const diffDays = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }).length,
  };
}

/**
 * Fetch all platform inquiries for CSV export.
 */
export async function getAllInquiriesForExport() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('inquiries')
    .select('id, name, email, phone, event_type, event_date, event_city, budget_range, status, created_at')
    .order('created_at', { ascending: false });

  return data || [];
}


/**
 * -------------------------------------------------------------
 * 5. ADMIN IMPERSONATION ("VIEW AS ANCHOR")
 * -------------------------------------------------------------
 */
export async function startImpersonation(userId: string, anchorName: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  cookieStore.set('stagehost_impersonate_user_id', userId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
  });
  cookieStore.set('stagehost_impersonate_anchor_name', anchorName, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete('stagehost_impersonate_user_id');
  cookieStore.delete('stagehost_impersonate_anchor_name');

  revalidatePath('/dashboard');
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getImpersonationStatus(): Promise<{
  isImpersonating: boolean;
  userId?: string;
  anchorName?: string;
}> {
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get('stagehost_impersonate_user_id')?.value;
  const anchorName = cookieStore.get('stagehost_impersonate_anchor_name')?.value;

  if (impersonateId) {
    return {
      isImpersonating: true,
      userId: impersonateId,
      anchorName: anchorName || 'Anchor',
    };
  }
  return { isImpersonating: false };
}

/**
 * -------------------------------------------------------------
 * 6. PLATFORM ACTIVITY STREAM & AUDIT LOGS
 * -------------------------------------------------------------
 */
export async function getRecentPlatformActivities(): Promise<ActivityLog[]> {
  const adminClient = createAdminClient();

  const [
    { data: profiles },
    { data: subscriptions },
    { data: inquiries },
  ] = await Promise.all([
    adminClient
      .from('anchor_profiles')
      .select('id, name, city, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    adminClient
      .from('subscriptions')
      .select('id, user_id, status, created_at, plans(name, price_monthly)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    adminClient
      .from('inquiries')
      .select('id, name, event_type, event_city, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const activities: ActivityLog[] = [];

  profiles?.forEach((p) => {
    activities.push({
      id: `act_sign_${p.id}`,
      type: 'signup',
      description: `New anchor ${p.name || 'Artist'} signed up from ${p.city || 'India'}`,
      created_at: p.created_at,
    });
  });

  subscriptions?.forEach((s: any) => {
    if (s.plans?.name && s.plans.name !== 'Free') {
      activities.push({
        id: `act_sub_${s.id}`,
        type: 'upgrade',
        description: `Anchor upgraded to ${s.plans.name} plan (₹${s.plans.price_monthly}/mo)`,
        created_at: s.created_at,
      });
    }
  });

  inquiries?.forEach((i) => {
    activities.push({
      id: `act_inq_${i.id}`,
      type: 'inquiry',
      description: `Client booking inquiry received for ${i.event_type || 'Event'} in ${i.event_city || 'India'}`,
      created_at: i.created_at,
    });
  });

  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return activities.slice(0, 10);
}

/**
 * -------------------------------------------------------------
 * 7. CUSTOM DOMAINS & DNS VERIFICATION
 * -------------------------------------------------------------
 */
export async function getCustomDomains(): Promise<CustomDomainRequest[]> {
  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  if (!row?.value) {
    return [];
  }
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

export async function updateCustomDomainStatus(domainId: string, status: 'active' | 'pending' | 'rejected') {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const domains = await getCustomDomains();
  const updated = domains.map(d => d.id === domainId ? { ...d, status } : d);

  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: 'platform_custom_domains',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function addCustomDomainRequest(data: {
  profile_id: string;
  anchor_name: string;
  domain: string;
}) {
  const cleanDomain = data.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domains = await getCustomDomains();
  const newDomain: CustomDomainRequest = {
    id: `dom_${Date.now()}`,
    profile_id: data.profile_id,
    anchor_name: data.anchor_name,
    domain: cleanDomain,
    status: 'pending',
    dns_type: 'CNAME',
    dns_target: 'cname.stagehost.in',
    created_at: new Date().toISOString(),
  };

  const updated = [newDomain, ...domains];
  const adminClient = createAdminClient();
  await adminClient.from('platform_settings').upsert({
    key: 'platform_custom_domains',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/admin/settings');
  return { success: true, domain: newDomain };
}

/**
 * -------------------------------------------------------------
 * 7. PLATFORM-WIDE TRAFFIC & VISITOR ENGAGEMENT ANALYTICS
 * -------------------------------------------------------------
 */
export interface PlatformTrafficAnalytics {
  totalPlatformViews: number;
  totalVideoPlays: number;
  totalWhatsAppClicks: number;
  totalPhoneClicks: number;
  topAnchors: Array<{
    id: string;
    name: string;
    slug: string;
    views: number;
    videoPlays: number;
    inquiries: number;
  }>;
  topVisitorCities: Array<{ city: string; count: number; percentage: number }>;
  recentPlatformEvents: Array<{
    id: string;
    event_type: string;
    anchor_name?: string;
    anchor_slug?: string;
    ip_city?: string;
    created_at: string;
  }>;
}

export async function getPlatformTrafficAnalytics(): Promise<PlatformTrafficAnalytics> {
  const adminClient = createAdminClient();

  // Fetch all analytics events
  const { data: events } = await adminClient
    .from('analytics_events')
    .select('id, profile_id, event_type, ip_city, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  // Fetch anchor profiles
  const { data: profiles } = await adminClient
    .from('anchor_profiles')
    .select('id, name, slug');

  // Fetch inquiries
  const { data: inquiries } = await adminClient
    .from('inquiries')
    .select('id, profile_id');

  const allEvents = events || [];
  const profileMap: Record<string, { name: string; slug: string }> = {};
  (profiles || []).forEach((p) => {
    profileMap[p.id] = { name: p.name || 'Anchor', slug: p.slug || '' };
  });

  const inquiryCountMap: Record<string, number> = {};
  (inquiries || []).forEach((i) => {
    inquiryCountMap[i.profile_id] = (inquiryCountMap[i.profile_id] || 0) + 1;
  });

  const totalViews = allEvents.filter((e) => e.event_type === 'profile_view').length;
  const totalVideos = allEvents.filter((e) => e.event_type === 'video_click').length;
  const totalWhatsApp = allEvents.filter((e) => e.event_type === 'whatsapp_click').length;
  const totalPhone = allEvents.filter((e) => e.event_type === 'phone_click').length;

  // Aggregate per anchor
  const anchorStatsMap: Record<string, { views: number; videoPlays: number }> = {};
  allEvents.forEach((e) => {
    if (!anchorStatsMap[e.profile_id]) {
      anchorStatsMap[e.profile_id] = { views: 0, videoPlays: 0 };
    }
    if (e.event_type === 'profile_view') anchorStatsMap[e.profile_id].views++;
    if (e.event_type === 'video_click') anchorStatsMap[e.profile_id].videoPlays++;
  });

  const topAnchors = Object.entries(anchorStatsMap)
    .map(([pid, stats]) => ({
      id: pid,
      name: profileMap[pid]?.name || 'Anchor',
      slug: profileMap[pid]?.slug || '',
      views: stats.views,
      videoPlays: stats.videoPlays,
      inquiries: inquiryCountMap[pid] || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // City counts
  const cityCounts: Record<string, number> = {};
  allEvents.forEach((e) => {
    const c = (e.ip_city || (e.metadata as any)?.city || '').trim();
    if (c && c.toLowerCase() !== 'null' && c.toLowerCase() !== 'undefined') {
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    }
  });

  const totalCitiesEvents = Object.values(cityCounts).reduce((a, b) => a + b, 0) || 1;
  const topVisitorCities = Object.entries(cityCounts)
    .map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / totalCitiesEvents) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentPlatformEvents = allEvents.slice(0, 8).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    anchor_name: profileMap[e.profile_id]?.name,
    anchor_slug: profileMap[e.profile_id]?.slug,
    ip_city: e.ip_city || undefined,
    created_at: e.created_at,
  }));

  return {
    totalPlatformViews: totalViews,
    totalVideoPlays: totalVideos,
    totalWhatsAppClicks: totalWhatsApp,
    totalPhoneClicks: totalPhone,
    topAnchors,
    topVisitorCities,
    recentPlatformEvents,
  };
}

