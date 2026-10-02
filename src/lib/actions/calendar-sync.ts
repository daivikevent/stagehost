'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMyProfile } from '@/lib/actions/profile';
import { parseIcsCalendar } from '@/lib/utils/ics-parser';

export interface CalendarSyncConfig {
  isConnected: boolean;
  icalUrlMasked: string | null;
  lastSyncedAt: string | null;
  syncedDatesCount: number;
  latestEvents: Array<{ title: string; date: string }>;
}

interface StoredSyncData {
  url: string;
  last_synced_at: string;
  synced_dates: string[];
  event_count: number;
}

/**
 * Get current Google Calendar sync status
 */
export async function getCalendarSyncStatus(): Promise<CalendarSyncConfig> {
  const profile = await getMyProfile();
  if (!profile) {
    return {
      isConnected: false,
      icalUrlMasked: null,
      lastSyncedAt: null,
      syncedDatesCount: 0,
      latestEvents: [],
    };
  }

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `gcal_sync_${profile.id}`)
    .maybeSingle();

  if (!row?.value) {
    return {
      isConnected: false,
      icalUrlMasked: null,
      lastSyncedAt: null,
      syncedDatesCount: 0,
      latestEvents: [],
    };
  }

  try {
    const data: StoredSyncData = JSON.parse(row.value);
    const masked = data.url.replace(/^https?:\/\/([^/]+)\/(.+)\/([^/]+)$/, 'https://$1/.../$3');
    return {
      isConnected: true,
      icalUrlMasked: masked,
      lastSyncedAt: data.last_synced_at,
      syncedDatesCount: data.synced_dates?.length || 0,
      latestEvents: (data.synced_dates || []).slice(0, 5).map(d => ({ title: 'Busy (Synced)', date: d })),
    };
  } catch {
    return {
      isConnected: false,
      icalUrlMasked: null,
      lastSyncedAt: null,
      syncedDatesCount: 0,
      latestEvents: [],
    };
  }
}

/**
 * Connect Google Calendar private iCal feed URL and trigger initial sync
 */
export async function connectGoogleCalendar(rawUrl: string) {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('webcal://')) {
    throw new Error('Please enter a valid Calendar URL starting with https:// or webcal://');
  }

  const httpUrl = cleanUrl.replace(/^webcal:\/\//i, 'https://');

  // Test fetch the iCal link
  let icsText = '';
  try {
    const res = await fetch(httpUrl, {
      headers: { 'User-Agent': 'BookMyArtist-CalendarSync/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Calendar server responded with HTTP ${res.status}. Please verify the URL.`);
    }
    icsText = await res.text();
  } catch (err: any) {
    throw new Error(`Failed to reach calendar feed: ${err.message || 'Please check the URL'}`);
  }

  if (!icsText.includes('BEGIN:VCALENDAR')) {
    throw new Error('The URL provided did not return a valid iCalendar feed. Please ensure it is the "Secret address in iCal format".');
  }

  const adminClient = createAdminClient();
  const events = parseIcsCalendar(icsText);

  // Filter confirmed events in the next 180 days
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 180);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const datesToBlockSet = new Set<string>();
  events.forEach(evt => {
    if (evt.status === 'CANCELLED') return;
    evt.coveredDates.forEach(d => {
      if (d >= today && d <= maxDateStr) {
        datesToBlockSet.add(d);
      }
    });
  });

  const datesToBlock = Array.from(datesToBlockSet).sort();

  // Upsert slots in schedule_slots
  if (datesToBlock.length > 0) {
    const slotRows: Array<{ profile_id: string; date: string; slot_type: string; status: string; updated_at: string }> = [];
    datesToBlock.forEach(date => {
      slotRows.push({ profile_id: profile.id, date, slot_type: 'full_day', status: 'booked', updated_at: new Date().toISOString() });
      slotRows.push({ profile_id: profile.id, date, slot_type: 'morning', status: 'booked', updated_at: new Date().toISOString() });
      slotRows.push({ profile_id: profile.id, date, slot_type: 'evening', status: 'booked', updated_at: new Date().toISOString() });
    });

    await adminClient
      .from('schedule_slots')
      .upsert(slotRows, { onConflict: 'profile_id,date,slot_type' });
  }

  // Save sync config
  const syncRecord: StoredSyncData = {
    url: httpUrl,
    last_synced_at: new Date().toISOString(),
    synced_dates: datesToBlock,
    event_count: datesToBlock.length,
  };

  await adminClient.from('platform_settings').upsert({
    key: `gcal_sync_${profile.id}`,
    value: JSON.stringify(syncRecord),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/schedule');
  revalidatePath('/settings');
  revalidatePath(`/${profile.slug}`);

  return {
    success: true,
    datesBlocked: datesToBlock.length,
    message: `Connected successfully! ${datesToBlock.length} upcoming busy dates synced from Google Calendar.`,
  };
}

/**
 * Re-sync Google Calendar now
 */
export async function syncGoogleCalendarNow() {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `gcal_sync_${profile.id}`)
    .maybeSingle();

  if (!row?.value) {
    throw new Error('No Google Calendar connected. Please add your calendar link first.');
  }

  const prevConfig: StoredSyncData = JSON.parse(row.value);

  const res = await fetch(prevConfig.url, {
    headers: { 'User-Agent': 'BookMyArtist-CalendarSync/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not fetch calendar from Google. Please verify URL is active.');

  const icsText = await res.text();
  const events = parseIcsCalendar(icsText);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 180);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const newDatesToBlockSet = new Set<string>();
  events.forEach(evt => {
    if (evt.status === 'CANCELLED') return;
    evt.coveredDates.forEach(d => {
      if (d >= today && d <= maxDateStr) {
        newDatesToBlockSet.add(d);
      }
    });
  });

  const newDatesToBlock = Array.from(newDatesToBlockSet).sort();

  // Find dates that were previously synced but are now REMOVED in Google Calendar
  const oldSyncedDates = new Set(prevConfig.synced_dates || []);
  const datesToFree: string[] = [];
  oldSyncedDates.forEach(oldDate => {
    if (!newDatesToBlockSet.has(oldDate)) {
      datesToFree.push(oldDate);
    }
  });

  // Free up deleted events in schedule_slots
  if (datesToFree.length > 0) {
    await adminClient
      .from('schedule_slots')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('profile_id', profile.id)
      .in('date', datesToFree);
  }

  // Upsert new/retained busy dates
  if (newDatesToBlock.length > 0) {
    const slotRows: Array<{ profile_id: string; date: string; slot_type: string; status: string; updated_at: string }> = [];
    newDatesToBlock.forEach(date => {
      slotRows.push({ profile_id: profile.id, date, slot_type: 'full_day', status: 'booked', updated_at: new Date().toISOString() });
      slotRows.push({ profile_id: profile.id, date, slot_type: 'morning', status: 'booked', updated_at: new Date().toISOString() });
      slotRows.push({ profile_id: profile.id, date, slot_type: 'evening', status: 'booked', updated_at: new Date().toISOString() });
    });

    await adminClient
      .from('schedule_slots')
      .upsert(slotRows, { onConflict: 'profile_id,date,slot_type' });
  }

  // Update sync metadata
  const updatedRecord: StoredSyncData = {
    ...prevConfig,
    last_synced_at: new Date().toISOString(),
    synced_dates: newDatesToBlock,
    event_count: newDatesToBlock.length,
  };

  await adminClient.from('platform_settings').upsert({
    key: `gcal_sync_${profile.id}`,
    value: JSON.stringify(updatedRecord),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  revalidatePath('/schedule');
  revalidatePath('/settings');
  revalidatePath(`/${profile.slug}`);

  return {
    success: true,
    totalDatesBlocked: newDatesToBlock.length,
    datesFreed: datesToFree.length,
    lastSyncedAt: updatedRecord.last_synced_at,
  };
}

/**
 * Disconnect Google Calendar sync
 */
export async function disconnectGoogleCalendar() {
  const profile = await getMyProfile();
  if (!profile) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `gcal_sync_${profile.id}`)
    .maybeSingle();

  if (row?.value) {
    try {
      const config: StoredSyncData = JSON.parse(row.value);
      // Optionally free up synced dates
      if (config.synced_dates && config.synced_dates.length > 0) {
        await adminClient
          .from('schedule_slots')
          .update({ status: 'available', updated_at: new Date().toISOString() })
          .eq('profile_id', profile.id)
          .in('date', config.synced_dates);
      }
    } catch {}
  }

  await adminClient
    .from('platform_settings')
    .delete()
    .eq('key', `gcal_sync_${profile.id}`);

  revalidatePath('/schedule');
  revalidatePath('/settings');
  revalidatePath(`/${profile.slug}`);

  return { success: true };
}
