'use server';

import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface StoredPushSubscription {
  profile_id: string;
  user_id: string;
  endpoint: string;
  subscription: webpush.PushSubscription;
  user_agent?: string;
  updated_at: string;
}

const SETTINGS_KEY = 'platform_push_subscriptions';

/**
 * Configure VAPID details for web-push library
 */
async function configureVapid(): Promise<{ publicKey: string; privateKey: string } | null> {
  let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@stagehost.in';

  if (!publicKey || !privateKey) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('platform_settings')
        .select('key, value')
        .in('key', ['vapid_public_key', 'vapid_private_key']);

      if (data) {
        data.forEach((row) => {
          if (row.key === 'vapid_public_key') {
            publicKey = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          }
          if (row.key === 'vapid_private_key') {
            privateKey = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          }
        });
      }
    } catch (e) {
      console.error('[WebPush] Error fetching VAPID keys from DB:', e);
    }
  }

  if (!publicKey || !privateKey) {
    console.warn('[WebPush] VAPID keys not configured');
    return null;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return { publicKey, privateKey };
  } catch (e) {
    console.error('[WebPush] Failed to set VAPID details:', e);
    return null;
  }
}

/**
 * Get public VAPID key for client browser registration
 */
export async function getVapidPublicKey(): Promise<string | null> {
  const vapid = await configureVapid();
  return vapid ? vapid.publicKey : null;
}

/**
 * Helper: Retrieve all stored subscriptions from platform_settings
 */
async function getAllSubscriptions(): Promise<StoredPushSubscription[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error || !data || !data.value) return [];
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[WebPush] Error loading subscriptions:', e);
    return [];
  }
}

/**
 * Helper: Save subscriptions back to platform_settings
 */
async function saveAllSubscriptions(subs: StoredPushSubscription[]): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('platform_settings').upsert(
      {
        key: SETTINGS_KEY,
        value: JSON.stringify(subs),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    if (error) {
      console.error('[WebPush] Error saving subscriptions:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[WebPush] Exception saving subscriptions:', e);
    return false;
  }
}

/**
 * Save or update a push subscription for the logged-in anchor
 */
export async function savePushSubscription(
  subscription: webpush.PushSubscription,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get anchor profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const subs = await getAllSubscriptions();
    const now = new Date().toISOString();

    const existingIndex = subs.findIndex((s) => s.endpoint === subscription.endpoint);
    const item: StoredPushSubscription = {
      profile_id: profile.id,
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
      user_agent: userAgent || 'Unknown Device',
      updated_at: now,
    };

    if (existingIndex >= 0) {
      subs[existingIndex] = item;
    } else {
      subs.push(item);
    }

    await saveAllSubscriptions(subs);
    return { success: true };
  } catch (err: any) {
    console.error('[WebPush] Error saving subscription:', err);
    return { success: false, error: err.message || 'Failed to save subscription' };
  }
}

/**
 * Remove a push subscription (e.g. when toggling notifications off)
 */
export async function removePushSubscription(endpoint: string): Promise<{ success: boolean }> {
  try {
    const subs = await getAllSubscriptions();
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    await saveAllSubscriptions(filtered);
    return { success: true };
  } catch (err) {
    console.error('[WebPush] Error removing subscription:', err);
    return { success: false };
  }
}

/**
 * Send push notification to all registered devices of an anchor
 */
export async function sendPushNotificationToAnchor(
  profileId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  }
): Promise<{ sent: number; failed: number }> {
  const vapid = await configureVapid();
  if (!vapid) {
    console.warn('[WebPush] Cannot send push notification: VAPID not configured');
    return { sent: 0, failed: 0 };
  }

  const allSubs = await getAllSubscriptions();
  const anchorSubs = allSubs.filter((s) => s.profile_id === profileId);

  if (anchorSubs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const staleEndpoints = new Set<string>();

  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/inquiries',
    icon: payload.icon || '/globe.svg',
    badge: payload.badge || '/globe.svg',
    tag: payload.tag || 'stagehost-inquiry',
  });

  await Promise.allSettled(
    anchorSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, stringifiedPayload);
        sent++;
      } catch (err: any) {
        failed++;
        console.error('[WebPush] Failed sending push to endpoint:', sub.endpoint, err?.statusCode || err);
        // 404 Not Found or 410 Gone means the subscription is expired/unregistered
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleEndpoints.add(sub.endpoint);
        }
      }
    })
  );

  // Clean up any stale endpoints
  if (staleEndpoints.size > 0) {
    const cleaned = allSubs.filter((s) => !staleEndpoints.has(s.endpoint));
    await saveAllSubscriptions(cleaned);
  }

  return { sent, failed };
}

/**
 * Send a test push notification to the logged-in user
 */
export async function sendTestPushToSelf(): Promise<{
  success: boolean;
  sentCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Please log in first' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const result = await sendPushNotificationToAnchor(profile.id, {
      title: '🔔 StageHost Push Active!',
      body: `Hello ${profile.full_name || 'Anchor'}! Your phone & browser will now get instant alerts when clients send booking inquiries.`,
      url: '/inquiries',
      tag: 'stagehost-test',
    });

    if (result.sent > 0) {
      return {
        success: true,
        sentCount: result.sent,
        message: `Successfully delivered push to ${result.sent} active device(s)!`,
      };
    } else {
      return {
        success: false,
        error: 'No active subscription found for this browser. Please enable notifications first.',
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send test push' };
  }
}
