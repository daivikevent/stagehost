'use server';

import { revalidatePath } from 'next/cache';
import dns from 'dns';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMyProfile } from '@/lib/actions/profile';
import { checkIsAdmin } from '@/lib/actions/admin';
import type { CustomDomainRequest } from '@/types';

export interface ArtistDomainInfo {
  canConnect: boolean;
  domain: string | null;
  status: 'active' | 'pending' | 'rejected' | 'none';
  dnsType: string;
  dnsTarget: string;
  configuredAt?: string;
  planTier: string;
}

const DNS_TARGET = 'cname.bookmyartist.in';

/**
 * Get custom domain details for current artist
 */
export async function getArtistCustomDomain(): Promise<ArtistDomainInfo> {
  const profile = await getMyProfile();
  if (!profile) {
    return {
      canConnect: false,
      domain: null,
      status: 'none',
      dnsType: 'CNAME',
      dnsTarget: DNS_TARGET,
      planTier: 'free',
    };
  }

  const isAdmin = await checkIsAdmin();
  const planTier = (profile.plan_tier || 'free').toLowerCase();
  // Premium plan or Admin has permission
  const canConnect = planTier === 'premium' || isAdmin;

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  let domains: CustomDomainRequest[] = [];
  if (row?.value) {
    try {
      domains = JSON.parse(row.value);
    } catch {}
  }

  const userDomain = domains.find(d => d.profile_id === profile.id);

  if (!userDomain) {
    return {
      canConnect,
      domain: null,
      status: 'none',
      dnsType: 'CNAME',
      dnsTarget: DNS_TARGET,
      planTier,
    };
  }

  return {
    canConnect,
    domain: userDomain.domain,
    status: userDomain.status,
    dnsType: userDomain.dns_type || 'CNAME',
    dnsTarget: userDomain.dns_target || DNS_TARGET,
    configuredAt: userDomain.created_at,
    planTier,
  };
}

/**
 * Connect a custom domain for current artist
 */
export async function connectCustomDomain(rawDomain: string) {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const isAdmin = await checkIsAdmin();
  const planTier = (profile.plan_tier || 'free').toLowerCase();
  if (planTier !== 'premium' && !isAdmin) {
    throw new Error('Custom domain connection requires the Premium Plan (₹1,299/mo). Please upgrade to activate.');
  }

  // Clean domain name
  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '');

  // Regex validation for domain (e.g. rahulsharma.com, anchor.aarav.in, etc.)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  if (!domainRegex.test(domain) || domain.length > 253) {
    throw new Error('Please enter a valid domain name (e.g. rahulsharma.live or bookings.aaravsharma.com)');
  }

  // Disallow platform reserved domains
  const reserved = ['bookmyartist.in', 'stagehost.vercel.app', 'localhost', 'admin.bookmyartist.in', 'api.bookmyartist.in'];
  if (reserved.includes(domain)) {
    throw new Error('This domain cannot be used as a personal custom domain.');
  }

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  let domains: CustomDomainRequest[] = [];
  if (row?.value) {
    try {
      domains = JSON.parse(row.value);
    } catch {}
  }

  // Check if claimed by someone else
  const existingOther = domains.find(d => d.domain === domain && d.profile_id !== profile.id);
  if (existingOther) {
    throw new Error(`The domain "${domain}" is already connected to another artist profile.`);
  }

  const newRecord: CustomDomainRequest = {
    id: `dom_${Date.now()}`,
    profile_id: profile.id,
    anchor_name: profile.name,
    domain,
    status: 'pending',
    dns_type: 'CNAME',
    dns_target: DNS_TARGET,
    created_at: new Date().toISOString(),
  };

  // Remove old entry for this artist if any, add new
  const updated = [newRecord, ...domains.filter(d => d.profile_id !== profile.id)];

  await adminClient.from('platform_settings').upsert({
    key: 'platform_custom_domains',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/settings');
  revalidatePath('/admin/settings');
  return { success: true, domain: newRecord };
}

/**
 * Verify DNS propagation for custom domain
 */
export async function verifyCustomDomainDns() {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  let domains: CustomDomainRequest[] = [];
  if (row?.value) {
    try {
      domains = JSON.parse(row.value);
    } catch {}
  }

  const current = domains.find(d => d.profile_id === profile.id);
  if (!current) throw new Error('No custom domain configured');

  let isVerified = false;

  try {
    const cnames = await dns.promises.resolveCname(current.domain);
    if (cnames.some(c => c.toLowerCase().includes('bookmyartist') || c.toLowerCase().includes('vercel'))) {
      isVerified = true;
    }
  } catch (dnsErr) {
    // In local / development or before global propagation, allow simulated verification if domain is healthy
    console.log('DNS resolve error or not propagated yet:', dnsErr);
  }

  // If DNS check verified or forced active
  if (isVerified) {
    const updated = domains.map(d => d.id === current.id ? { ...d, status: 'active' as const } : d);
    await adminClient.from('platform_settings').upsert({
      key: 'platform_custom_domains',
      value: JSON.stringify(updated),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    revalidatePath('/settings');
    return { verified: true, status: 'active', message: 'Domain verified and active!' };
  } else {
    return {
      verified: false,
      status: current.status,
      message: `CNAME record for ${current.domain} has not propagated to "${current.dns_target}" yet. DNS changes can take a few minutes.`,
    };
  }
}

/**
 * Disconnect custom domain
 */
export async function disconnectCustomDomain() {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  let domains: CustomDomainRequest[] = [];
  if (row?.value) {
    try {
      domains = JSON.parse(row.value);
    } catch {}
  }

  const updated = domains.filter(d => d.profile_id !== profile.id);

  await adminClient.from('platform_settings').upsert({
    key: 'platform_custom_domains',
    value: JSON.stringify(updated),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/settings');
  revalidatePath('/admin/settings');
  return { success: true };
}

/**
 * Public lookup: find artist slug by custom domain (used in middleware)
 */
export async function getSlugByCustomDomain(hostname: string): Promise<string | null> {
  const cleanHost = hostname.toLowerCase().replace(/:\d+$/, '');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_custom_domains')
    .maybeSingle();

  if (!row?.value) return null;

  try {
    const domains: CustomDomainRequest[] = JSON.parse(row.value);
    const match = domains.find(d => d.domain.toLowerCase() === cleanHost && d.status === 'active');
    if (!match) return null;

    // Fetch artist slug
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('slug')
      .eq('id', match.profile_id)
      .maybeSingle();

    return profile?.slug || null;
  } catch {
    return null;
  }
}
