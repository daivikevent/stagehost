'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import type { AnalyticsEventType } from '@/types';

export interface LogAnalyticsParams {
  profile_id: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
  ip_city?: string;
  referrer?: string;
}

/**
 * Log a public analytics event into analytics_events table.
 * Fully public and non-blocking.
 */
export async function logAnalyticsEvent(params: LogAnalyticsParams) {
  try {
    if (!params.profile_id || !params.event_type) {
      return { success: false, error: 'Missing profile_id or event_type' };
    }

    const headersList = await headers();
    const serverReferrer = headersList.get('referer') || '';
    const userAgent = headersList.get('user-agent') || '';
    const serverCity =
      params.ip_city ||
      headersList.get('x-vercel-ip-city') ||
      headersList.get('cf-ipcity') ||
      headersList.get('x-city') ||
      null;

    const adminClient = createAdminClient();

    const { error } = await adminClient.from('analytics_events').insert({
      profile_id: params.profile_id,
      event_type: params.event_type,
      metadata: params.metadata || {},
      referrer: params.referrer || serverReferrer || null,
      user_agent: userAgent || null,
      ip_city: serverCity,
    });

    if (error) {
      console.error('[Analytics] Failed to insert event:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Analytics] Error logging event:', err);
    return { success: false, error: err?.message };
  }
}

export interface AnalyticsStatsResponse {
  totalViews: number;
  viewsChange: number; // percentage vs prior period
  totalVideoClicks: number;
  videoClicksChange: number;
  totalInquiries: number;
  inquiriesChange: number;
  totalWhatsAppClicks: number;
  whatsAppClicksChange: number;
  monthlyViews: Array<{ month: string; views: number; dateStr?: string }>;
  topCities: Array<{ city: string; views: number; percentage: number }>;
  topVideos: Array<{ id: string; title: string; views: number; clicks: number; ctr: string }>;
  deviceBreakdown: { mobile: number; desktop: number };
  recentEvents: Array<{ id: string; event_type: string; created_at: string; ip_city?: string; metadata?: any }>;
}

/**
 * Fetch detailed analytics for the currently authenticated anchor.
 */
export async function getAnchorAnalytics(days = 30): Promise<AnalyticsStatsResponse | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('anchor_profiles')
      .select('id, name, slug, city, videos')
      .eq('user_id', user.id)
      .single();

    if (!profile) return null;

    const adminClient = createAdminClient();

    // Determine date thresholds
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const priorPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    // Fetch current period events
    const { data: currentEvents } = await adminClient
      .from('analytics_events')
      .select('id, event_type, metadata, referrer, user_agent, ip_city, created_at')
      .eq('profile_id', profile.id)
      .gte('created_at', currentPeriodStart.toISOString())
      .order('created_at', { ascending: true });

    // Fetch prior period events for calculating trend / growth
    const { data: priorEvents } = await adminClient
      .from('analytics_events')
      .select('id, event_type')
      .eq('profile_id', profile.id)
      .gte('created_at', priorPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    // Fetch inquiries in this period
    const { data: currentInquiries } = await adminClient
      .from('inquiries')
      .select('id, created_at')
      .eq('profile_id', profile.id)
      .gte('created_at', currentPeriodStart.toISOString());

    const { data: priorInquiries } = await adminClient
      .from('inquiries')
      .select('id')
      .eq('profile_id', profile.id)
      .gte('created_at', priorPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    const curr = currentEvents || [];
    const prior = priorEvents || [];

    // Aggregate core counts
    const currentViews = curr.filter((e) => e.event_type === 'profile_view').length;
    const priorViews = prior.filter((e) => e.event_type === 'profile_view').length;

    const currentVideoClicks = curr.filter((e) => e.event_type === 'video_click').length;
    const priorVideoClicks = prior.filter((e) => e.event_type === 'video_click').length;

    const currentWhatsApp = curr.filter((e) => e.event_type === 'whatsapp_click' || e.event_type === 'phone_click').length;
    const priorWhatsApp = prior.filter((e) => e.event_type === 'whatsapp_click' || e.event_type === 'phone_click').length;

    const currentInqCount = currentInquiries?.length || 0;
    const priorInqCount = priorInquiries?.length || 0;

    const calcChange = (currCount: number, priorCount: number): number => {
      if (priorCount === 0) return currCount > 0 ? 100 : 0;
      return Math.round(((currCount - priorCount) / priorCount) * 100);
    };

    // Calculate views timeline (e.g. daily for <= 30 days, or monthly for > 30 days)
    const monthlyViewsMap: Record<string, number> = {};
    if (days <= 30) {
      // Last 7 or 30 days: show days
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        monthlyViewsMap[dayLabel] = 0;
      }
      curr.forEach((e) => {
        if (e.event_type === 'profile_view') {
          const d = new Date(e.created_at);
          const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (monthlyViewsMap[dayLabel] !== undefined) {
            monthlyViewsMap[dayLabel]++;
          }
        }
      });
    } else {
      // 90 or 365 days: show months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mLabel = months[d.getMonth()];
        monthlyViewsMap[mLabel] = 0;
      }
      curr.forEach((e) => {
        if (e.event_type === 'profile_view') {
          const d = new Date(e.created_at);
          const mLabel = months[d.getMonth()];
          if (monthlyViewsMap[mLabel] !== undefined) {
            monthlyViewsMap[mLabel]++;
          }
        }
      });
    }

    const monthlyViews = Object.entries(monthlyViewsMap).map(([month, views]) => ({
      month,
      views,
    }));

    // City distribution
    const cityCounts: Record<string, number> = {};
    curr.forEach((e) => {
      let city = (e.ip_city || (e.metadata as any)?.city || '').trim();
      if (!city || city.toLowerCase() === 'null' || city.toLowerCase() === 'undefined') {
        city = profile.city || 'Direct Search';
      }
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const totalCityEvents = Object.values(cityCounts).reduce((a, b) => a + b, 0) || 1;
    const sortedCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const topCities = sortedCities.map(([city, count]) => ({
      city,
      views: count,
      percentage: Math.round((count / totalCityEvents) * 100),
    }));

    // Top Videos
    const videoMap: Record<string, { title: string; clicks: number }> = {};
    curr.forEach((e) => {
      if (e.event_type === 'video_click') {
        const vidId = (e.metadata as any)?.video_id || (e.metadata as any)?.url || 'unknown';
        const vidTitle = (e.metadata as any)?.title || 'Stage Video';
        if (!videoMap[vidId]) {
          videoMap[vidId] = { title: vidTitle, clicks: 0 };
        }
        videoMap[vidId].clicks++;
      }
    });

    // Merge with anchor's actual profile videos
    const profileVideos = Array.isArray(profile.videos) ? profile.videos : [];
    const topVideos = profileVideos.slice(0, 5).map((v: any) => {
      const clicks = videoMap[v.id]?.clicks || 0;
      const estimatedViews = Math.max(clicks, Math.round(currentViews * 0.45));
      const ctr = estimatedViews > 0 ? `${Math.min(100, Math.round((clicks / estimatedViews) * 100))}%` : '0%';
      return {
        id: v.id,
        title: v.title || 'Live Performance Clip',
        views: estimatedViews,
        clicks,
        ctr,
      };
    });

    // Mobile vs Desktop device breakdown
    let mobileCount = 0;
    let desktopCount = 0;
    curr.forEach((e) => {
      const ua = (e.user_agent || '').toLowerCase();
      if (/mobile|android|iphone|ipad|ipod|blackberry|opera mini/i.test(ua)) {
        mobileCount++;
      } else {
        desktopCount++;
      }
    });

    return {
      totalViews: currentViews,
      viewsChange: calcChange(currentViews, priorViews),
      totalVideoClicks: currentVideoClicks,
      videoClicksChange: calcChange(currentVideoClicks, priorVideoClicks),
      totalInquiries: currentInqCount,
      inquiriesChange: calcChange(currentInqCount, priorInqCount),
      totalWhatsAppClicks: currentWhatsApp,
      whatsAppClicksChange: calcChange(currentWhatsApp, priorWhatsApp),
      monthlyViews,
      topCities,
      topVideos,
      deviceBreakdown: { mobile: mobileCount, desktop: desktopCount },
      recentEvents: curr.slice(-10).reverse().map((e) => ({
        id: e.id,
        event_type: e.event_type,
        created_at: e.created_at,
        ip_city: e.ip_city || undefined,
        metadata: e.metadata,
      })),
    };
  } catch (err) {
    console.error('[Analytics] Error fetching anchor analytics:', err);
    return null;
  }
}
