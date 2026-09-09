'use client';

import { logAnalyticsEvent } from '@/lib/actions/analytics';
import type { AnalyticsEventType } from '@/types';

/**
 * Fire-and-forget client-side event tracking.
 * Deduplicates profile_view per browser session to prevent view count spam.
 */
export function trackEvent(
  profileId: string,
  eventType: AnalyticsEventType,
  metadata?: Record<string, any>
) {
  if (!profileId) return;

  if (typeof window !== 'undefined') {
    // Session deduplication for profile_view
    if (eventType === 'profile_view') {
      const sessionKey = `sh_pv_${profileId}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already counted for this session
      }
      sessionStorage.setItem(sessionKey, '1');
    }

    const referrer = document.referrer || '';

    // Fire in background non-blocking
    logAnalyticsEvent({
      profile_id: profileId,
      event_type: eventType,
      metadata,
      referrer,
    }).catch((err) => {
      // Ignore network errors in analytics tracker
      console.debug('[Analytics] Event tracking dropped:', err);
    });
  }
}
