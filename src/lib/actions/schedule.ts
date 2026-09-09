'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { SlotStatus, SlotType } from '@/types';
import { toDateString, extractSlotTimes } from '@/lib/utils';

export interface DaySlots {
  morning?: SlotStatus;
  evening?: SlotStatus;
  full_day?: SlotStatus;
}

export interface BookingRecord {
  id: string;
  slot_id?: string;
  date: string;
  slot_type: string;
  booking_status?: 'confirmed' | 'tentative';
  event_type?: string;
  event_name?: string;
  city?: string;
  venue?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  amount?: number;
  notes?: string;
  cue_notes?: string;
  event_time?: string;
  is_out_of_city?: boolean;
  travel_itinerary?: any;
}

/**
 * Fetch calendar data for the logged-in anchor (in /schedule).
 */
export async function getScheduleData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawProfile } = await supabase
    .from('anchor_profiles')
    .select('id, name, slug, city, artist_specialties')
    .eq('user_id', user.id)
    .single();

  if (!rawProfile) return null;

  const profile = {
    ...rawProfile,
    slot_times: extractSlotTimes(rawProfile),
  };

  const adminClient = createAdminClient();

  // Fetch slots
  const { data: slotsData } = await adminClient
    .from('schedule_slots')
    .select('*')
    .eq('profile_id', profile.id);

  // Fetch bookings
  const { data: bookingsData } = await adminClient
    .from('bookings')
    .select('*')
    .eq('profile_id', profile.id)
    .order('date', { ascending: true });

  // Fetch visibility toggle
  const { data: setting } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `show_calendar_${profile.id}`)
    .maybeSingle();

  // Default is true
  const showCalendar = setting ? setting.value === 'true' : true;

  // Identify active travel dates from bookings to prevent orphaned travel slots
  const legitimateTravelDates = new Set<string>();
  (bookingsData || []).forEach((b: any) => {
    if (b.event_type === 'Travel') {
      legitimateTravelDates.add(b.date);
    }
    const raw = b.notes || '';
    if (raw.includes('---TRAVEL_ITINERARY---')) {
      try {
        const parts = raw.split(/---TRAVEL_ITINERARY---\n?/);
        const itin = JSON.parse(parts[1] || '{}');
        if (b.is_out_of_city !== false) {
          if (itin.pre_event?.enabled && itin.pre_event.date) legitimateTravelDates.add(itin.pre_event.date);
          if (itin.post_event?.enabled && itin.post_event.date) legitimateTravelDates.add(itin.post_event.date);
        }
      } catch (e) {}
    }
  });

  // Convert slots array to date map: { '2026-09-15': { morning: 'booked', evening: 'available' } }
  const slotsMap: Record<string, DaySlots> = {};
  const orphanedTravelSlotIds: string[] = [];

  (slotsData || []).forEach(slot => {
    if (slot.status === 'travel' && !legitimateTravelDates.has(slot.date)) {
      orphanedTravelSlotIds.push(slot.id);
      return; // Skip adding orphaned travel slot
    }
    if (!slotsMap[slot.date]) slotsMap[slot.date] = {};
    const type = slot.slot_type as keyof DaySlots;
    slotsMap[slot.date][type] = slot.status as SlotStatus;
  });

  // Automatically heal database by deleting orphaned travel slots in the background
  if (orphanedTravelSlotIds.length > 0) {
    adminClient
      .from('schedule_slots')
      .delete()
      .in('id', orphanedTravelSlotIds)
      .then(() => {});
  }

  // Cross-reference with bookings so bookings are never out of sync with slotsMap
  (bookingsData || []).forEach((b: any) => {
    const isTravel = b.event_type === 'Travel';
    const isTentative = (b.notes || '').includes('[PENCIL_HOLD]');
    const resolvedStatus: SlotStatus = isTravel ? 'travel' : (isTentative ? 'tentative' : 'booked');
    b.booking_status = isTravel ? 'confirmed' : (isTentative ? 'tentative' : 'confirmed');

    let rawNotes = b.notes || '';
    if (rawNotes.startsWith('[PENCIL_HOLD]')) {
      rawNotes = rawNotes.replace(/^\[PENCIL_HOLD\]\s*/, '');
    }
    if (rawNotes.includes('---TRAVEL_ITINERARY---')) {
      const parts = rawNotes.split(/---TRAVEL_ITINERARY---\n?/);
      rawNotes = parts[0] || '';
      try {
        b.travel_itinerary = JSON.parse(parts[1] || '{}');
      } catch (e) {}
    }
    if (rawNotes.includes('---CUE_SHEET---')) {
      const parts = rawNotes.split(/---CUE_SHEET---\n?/);
      rawNotes = parts[0] || '';
      b.cue_notes = parts[1] || '';
    }
    if (rawNotes.includes('[TIME:')) {
      const timeMatch = rawNotes.match(/\[TIME:\s*(.*?)\]/);
      if (timeMatch) {
        b.event_time = timeMatch[1].trim();
        rawNotes = rawNotes.replace(/\[TIME:\s*.*?\]\s*/, '');
      }
    }
    b.notes = rawNotes.trim();

    if (!slotsMap[b.date]) slotsMap[b.date] = {};
    if (b.slot_type === 'full_day') {
      slotsMap[b.date].full_day = resolvedStatus;
      slotsMap[b.date].morning = resolvedStatus;
      slotsMap[b.date].evening = resolvedStatus;
    } else if (b.slot_type === 'morning') {
      slotsMap[b.date].morning = resolvedStatus;
    } else if (b.slot_type === 'evening') {
      slotsMap[b.date].evening = resolvedStatus;
    }

    // Also mark travel buffer slots in slotsMap if this booking has an attached itinerary
    if (b.travel_itinerary) {
      const itin = b.travel_itinerary;
      if (itin.pre_event?.enabled && itin.pre_event.date) {
        if (!slotsMap[itin.pre_event.date]) slotsMap[itin.pre_event.date] = {};
        if (itin.pre_event.slot_type === 'full_day') {
          slotsMap[itin.pre_event.date].full_day = 'travel';
          slotsMap[itin.pre_event.date].morning = 'travel';
          slotsMap[itin.pre_event.date].evening = 'travel';
        } else if (itin.pre_event.slot_type === 'evening') {
          slotsMap[itin.pre_event.date].evening = 'travel';
          if (slotsMap[itin.pre_event.date].full_day === 'travel') delete slotsMap[itin.pre_event.date].full_day;
          if (slotsMap[itin.pre_event.date].morning === 'travel') delete slotsMap[itin.pre_event.date].morning;
        } else if (itin.pre_event.slot_type === 'morning') {
          slotsMap[itin.pre_event.date].morning = 'travel';
          if (slotsMap[itin.pre_event.date].full_day === 'travel') delete slotsMap[itin.pre_event.date].full_day;
          if (slotsMap[itin.pre_event.date].evening === 'travel') delete slotsMap[itin.pre_event.date].evening;
        }
      }
      if (itin.post_event?.enabled && itin.post_event.date) {
        if (!slotsMap[itin.post_event.date]) slotsMap[itin.post_event.date] = {};
        if (itin.post_event.slot_type === 'full_day') {
          slotsMap[itin.post_event.date].full_day = 'travel';
          slotsMap[itin.post_event.date].morning = 'travel';
          slotsMap[itin.post_event.date].evening = 'travel';
        } else if (itin.post_event.slot_type === 'evening') {
          slotsMap[itin.post_event.date].evening = 'travel';
          if (slotsMap[itin.post_event.date].full_day === 'travel') delete slotsMap[itin.post_event.date].full_day;
          if (slotsMap[itin.post_event.date].morning === 'travel') delete slotsMap[itin.post_event.date].morning;
        } else if (itin.post_event.slot_type === 'morning') {
          slotsMap[itin.post_event.date].morning = 'travel';
          if (slotsMap[itin.post_event.date].full_day === 'travel') delete slotsMap[itin.post_event.date].full_day;
          if (slotsMap[itin.post_event.date].evening === 'travel') delete slotsMap[itin.post_event.date].evening;
        }
      }
    }
  });

  return {
    profile,
    slotsMap,
    bookings: (bookingsData || []) as BookingRecord[],
    showCalendar,
  };
}

/**
 * Toggle whether the schedule/calendar is shown live on the public portfolio.
 */
export async function toggleCalendarVisibility(show: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();
  await adminClient
    .from('platform_settings')
    .upsert({
      key: `show_calendar_${profile.id}`,
      value: show ? 'true' : 'false',
      category: 'general',
      label: 'Show Public Calendar',
      description: 'Controls whether the live schedule calendar is visible on the public profile',
      field_type: 'toggle',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });

  revalidatePath('/schedule');
  revalidatePath('/settings');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true, showCalendar: show };
}

/**
 * Upsert or clear a slot status on a date.
 */
export async function upsertSlot(
  date: string,
  slotType: SlotType,
  status: SlotStatus | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();

  if (status === null) {
    // Delete slot
    await adminClient
      .from('schedule_slots')
      .delete()
      .eq('profile_id', profile.id)
      .eq('date', date)
      .eq('slot_type', slotType);

    // Also delete any booking linked to this date and slot type
    await adminClient
      .from('bookings')
      .delete()
      .eq('profile_id', profile.id)
      .eq('date', date)
      .eq('slot_type', slotType);
  } else {
    // Upsert slot: ensure Postgres constraint is respected if tentative passed
    const safeStatus = status === 'tentative' ? 'booked' : status;
    const { error } = await adminClient
      .from('schedule_slots')
      .upsert({
        profile_id: profile.id,
        date,
        slot_type: slotType,
        status: safeStatus,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,date,slot_type',
      });

    if (error) throw new Error(error.message);
  }

  revalidatePath('/schedule');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}

/**
 * Save booking details and mark slot as booked.
 * Supports morning and evening functions independently.
 */
export async function saveBooking(booking: {
  id?: string;
  old_date?: string;
  old_slot_type?: SlotType;
  date: string;
  slot_type: SlotType;
  booking_status?: 'confirmed' | 'tentative';
  event_type?: string;
  event_name?: string;
  event_time?: string;
  city?: string;
  venue?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  amount?: number;
  notes?: string;
  cue_notes?: string;
  is_out_of_city?: boolean;
  old_travel_buffer?: {
    pre_event?: { enabled?: boolean; date?: string; slot_type?: string };
    post_event?: { enabled?: boolean; date?: string; slot_type?: string };
  };
  travel_buffer?: {
    pre_event?: {
      enabled: boolean;
      date: string;
      slot_type: 'morning' | 'evening' | 'full_day';
      transport_mode?: string;
      from_city?: string;
      to_city?: string;
      travel_time?: string;
      notes?: string;
    };
    post_event?: {
      enabled: boolean;
      date: string;
      slot_type: 'morning' | 'evening' | 'full_day';
      transport_mode?: string;
      from_city?: string;
      to_city?: string;
      travel_time?: string;
      notes?: string;
    };
  };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();

  // 1. In Postgres, schedule_slots has CHECK (status IN ('available', 'booked', 'blocked', 'travel')).
  // Therefore, slots are stored in the database as 'booked'.
  // We represent tentative / pencil hold status cleanly via booking metadata without altering Postgres constraints.
  const dbSlotStatus = 'booked';

  const { data: slot, error: slotErr } = await adminClient
    .from('schedule_slots')
    .upsert({
      profile_id: profile.id,
      date: booking.date,
      slot_type: booking.slot_type,
      status: dbSlotStatus,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,date,slot_type',
    })
    .select()
    .single();

  if (slotErr) throw new Error(slotErr.message);

  // If full day, also mark morning and evening as 'booked'
  if (booking.slot_type === 'full_day') {
    await adminClient
      .from('schedule_slots')
      .upsert([
        {
          profile_id: profile.id,
          date: booking.date,
          slot_type: 'morning',
          status: dbSlotStatus,
          updated_at: new Date().toISOString(),
        },
        {
          profile_id: profile.id,
          date: booking.date,
          slot_type: 'evening',
          status: dbSlotStatus,
          updated_at: new Date().toISOString(),
        },
      ], {
        onConflict: 'profile_id,date,slot_type',
      });
  }

  // 2. Prepare clean notes with [PENCIL_HOLD], [TIME: ...], cue sheet, and travel itinerary
  let cleanUserNotes = (booking.notes || '').replace(/^\[PENCIL_HOLD\]\s*/, '').trim();

  // If travel buffer was unchecked, ensure any lingering ---TRAVEL_ITINERARY--- is cleanly stripped from notes
  if (!booking.is_out_of_city && cleanUserNotes.includes('---TRAVEL_ITINERARY---')) {
    cleanUserNotes = cleanUserNotes.split(/---TRAVEL_ITINERARY---\n?/)[0]?.trim() || '';
  }

  let finalNotes = booking.booking_status === 'tentative'
    ? `[PENCIL_HOLD]\n${cleanUserNotes}`
    : cleanUserNotes;

  if (booking.event_time?.trim()) {
    finalNotes = `${finalNotes}\n[TIME: ${booking.event_time.trim()}]`;
  }

  if (booking.cue_notes?.trim()) {
    finalNotes = `${finalNotes}\n---CUE_SHEET---\n${booking.cue_notes.trim()}`;
  }

  if (booking.is_out_of_city && booking.travel_buffer) {
    finalNotes = `${finalNotes}\n---TRAVEL_ITINERARY---\n${JSON.stringify(booking.travel_buffer)}`;
  }

  // 3. Insert or update booking details
  const isValidUuid = (val?: string | null) =>
    typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  const cleanBookingId = isValidUuid(booking.id) ? booking.id : undefined;

  let existingBookingRecord: any = null;
  if (cleanBookingId) {
    const { data: bById } = await adminClient
      .from('bookings')
      .select('id, notes, date, slot_type, is_out_of_city')
      .eq('id', cleanBookingId)
      .eq('profile_id', profile.id)
      .maybeSingle();
    existingBookingRecord = bById;
  }

  if (!existingBookingRecord) {
    const { data: existing } = await adminClient
      .from('bookings')
      .select('id, notes, date, slot_type, is_out_of_city')
      .eq('profile_id', profile.id)
      .eq('date', booking.date)
      .eq('slot_type', booking.slot_type)
      .maybeSingle();
    existingBookingRecord = existing;
  }

  const targetId = cleanBookingId || existingBookingRecord?.id;
  let savedBookingId = targetId;

  // Extract previous travel itinerary if exists
  let previousTravelItinerary: any = null;
  if (existingBookingRecord?.notes?.includes('---TRAVEL_ITINERARY---')) {
    try {
      const parts = existingBookingRecord.notes.split(/---TRAVEL_ITINERARY---\n?/);
      previousTravelItinerary = JSON.parse(parts[1] || '{}');
    } catch (e) {}
  }

  if (targetId) {
    const { error: updateErr } = await adminClient
      .from('bookings')
      .update({
        slot_id: slot?.id,
        date: booking.date,
        slot_type: booking.slot_type,
        event_type: booking.event_type || '',
        event_name: booking.event_name || '',
        city: booking.city || '',
        venue: booking.venue || '',
        client_name: booking.client_name || '',
        client_phone: booking.client_phone || '',
        client_email: booking.client_email || '',
        amount: booking.amount ? Number(booking.amount) : null,
        notes: finalNotes,
        is_out_of_city: !!booking.is_out_of_city,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId);

    if (updateErr) throw new Error(updateErr.message);

    // If rescheduled to a new date or slot, check and clean up old slot
    if (booking.old_date && (booking.old_date !== booking.date || booking.old_slot_type !== booking.slot_type)) {
      const oldSlotType = booking.old_slot_type || booking.slot_type;
      const { data: remaining } = await adminClient
        .from('bookings')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date', booking.old_date)
        .eq('slot_type', oldSlotType)
        .neq('id', targetId);

      if (!remaining || remaining.length === 0) {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', booking.old_date)
          .eq('slot_type', oldSlotType);
      }
    }
  } else {
    const { data: inserted, error: bookErr } = await adminClient
      .from('bookings')
      .insert({
        profile_id: profile.id,
        slot_id: slot?.id,
        date: booking.date,
        slot_type: booking.slot_type,
        event_type: booking.event_type || '',
        event_name: booking.event_name || '',
        city: booking.city || '',
        venue: booking.venue || '',
        client_name: booking.client_name || '',
        client_phone: booking.client_phone || '',
        client_email: booking.client_email || '',
        amount: booking.amount ? Number(booking.amount) : null,
        notes: finalNotes,
        is_out_of_city: !!booking.is_out_of_city,
      })
      .select('id')
      .single();

    if (bookErr) throw new Error(bookErr.message);
    savedBookingId = inserted?.id;
  }

  // 4. Travel buffer management for out of city event (Aage & Peeche ka safar)
  const isDateUsedByOtherBooking = async (date: string, excludeId?: string) => {
    const { data: otherBookings } = await adminClient
      .from('bookings')
      .select('id, notes, date, event_type')
      .eq('profile_id', profile.id)
      .neq('id', excludeId || '00000000-0000-0000-0000-000000000000');

    if (!otherBookings) return false;
    for (const ob of otherBookings) {
      if (ob.event_type === 'Travel' && ob.date === date) return true;
      if (ob.notes?.includes('---TRAVEL_ITINERARY---')) {
        try {
          const parts = ob.notes.split(/---TRAVEL_ITINERARY---\n?/);
          const itin = JSON.parse(parts[1] || '{}');
          if (itin.pre_event?.enabled && itin.pre_event.date === date) return true;
          if (itin.post_event?.enabled && itin.post_event.date === date) return true;
        } catch (e) {}
      }
    }
    return false;
  };

  if (booking.is_out_of_city && booking.travel_buffer) {
    const tb = booking.travel_buffer;

    // If previous itinerary had travel dates that are no longer in the new buffer, clean them up!
    const oldDates = [
      previousTravelItinerary?.pre_event?.date,
      previousTravelItinerary?.post_event?.date,
      booking.old_travel_buffer?.pre_event?.date,
      booking.old_travel_buffer?.post_event?.date,
    ].filter(Boolean) as string[];

    const newDates = new Set([
      tb.pre_event?.enabled ? tb.pre_event.date : null,
      tb.post_event?.enabled ? tb.post_event.date : null,
    ].filter(Boolean));

    for (const od of oldDates) {
      if (!newDates.has(od)) {
        const inUse = await isDateUsedByOtherBooking(od, targetId);
        if (!inUse) {
          await adminClient
            .from('schedule_slots')
            .delete()
            .eq('profile_id', profile.id)
            .eq('date', od)
            .eq('status', 'travel');
        }
      }
    }

    // Aage ka Safar (Departure buffer)
    if (tb.pre_event?.enabled && tb.pre_event.date) {
      const pre = tb.pre_event;
      await adminClient
        .from('schedule_slots')
        .upsert({
          profile_id: profile.id,
          date: pre.date,
          slot_type: pre.slot_type,
          status: 'travel',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,date,slot_type' });

      if (pre.slot_type === 'full_day') {
        await adminClient
          .from('schedule_slots')
          .upsert([
            { profile_id: profile.id, date: pre.date, slot_type: 'morning', status: 'travel', updated_at: new Date().toISOString() },
            { profile_id: profile.id, date: pre.date, slot_type: 'evening', status: 'travel', updated_at: new Date().toISOString() },
          ], { onConflict: 'profile_id,date,slot_type' });
      } else if (pre.slot_type === 'evening') {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', pre.date)
          .eq('slot_type', 'full_day')
          .eq('status', 'travel');
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', pre.date)
          .eq('slot_type', 'morning')
          .eq('status', 'travel');
      } else if (pre.slot_type === 'morning') {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', pre.date)
          .eq('slot_type', 'full_day')
          .eq('status', 'travel');
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', pre.date)
          .eq('slot_type', 'evening')
          .eq('status', 'travel');
      }

      await adminClient
        .from('bookings')
        .delete()
        .eq('profile_id', profile.id)
        .eq('date', pre.date)
        .eq('event_type', 'Travel');
    }

    // Peeche ka Safar (Return buffer)
    if (tb.post_event?.enabled && tb.post_event.date) {
      const post = tb.post_event;
      await adminClient
        .from('schedule_slots')
        .upsert({
          profile_id: profile.id,
          date: post.date,
          slot_type: post.slot_type,
          status: 'travel',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,date,slot_type' });

      if (post.slot_type === 'full_day') {
        await adminClient
          .from('schedule_slots')
          .upsert([
            { profile_id: profile.id, date: post.date, slot_type: 'morning', status: 'travel', updated_at: new Date().toISOString() },
            { profile_id: profile.id, date: post.date, slot_type: 'evening', status: 'travel', updated_at: new Date().toISOString() },
          ], { onConflict: 'profile_id,date,slot_type' });
      } else if (post.slot_type === 'evening') {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', post.date)
          .eq('slot_type', 'full_day')
          .eq('status', 'travel');
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', post.date)
          .eq('slot_type', 'morning')
          .eq('status', 'travel');
      } else if (post.slot_type === 'morning') {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', post.date)
          .eq('slot_type', 'full_day')
          .eq('status', 'travel');
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', post.date)
          .eq('slot_type', 'evening')
          .eq('status', 'travel');
      }

      await adminClient
        .from('bookings')
        .delete()
        .eq('profile_id', profile.id)
        .eq('date', post.date)
        .eq('event_type', 'Travel');
    }
  } else if (booking.is_out_of_city) {
    const eventDate = new Date(booking.date);
    const prevDay = new Date(eventDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = toDateString(prevDay);

    await adminClient
      .from('schedule_slots')
      .upsert({
        profile_id: profile.id,
        date: prevDayStr,
        slot_type: 'full_day',
        status: 'travel',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,date,slot_type' });
  } else {
    // Travel buffer was unchecked / disabled!
    // Clean up previous travel buffer dates from schedule_slots
    const oldDatesToClean = new Set<string>([
      previousTravelItinerary?.pre_event?.date,
      previousTravelItinerary?.post_event?.date,
      booking.old_travel_buffer?.pre_event?.date,
      booking.old_travel_buffer?.post_event?.date,
    ].filter(Boolean) as string[]);

    // If old dates were not explicitly found in itinerary, check adjacent dates of the event
    const eventDateForBuffer = booking.old_date || booking.date;
    if (oldDatesToClean.size === 0 && eventDateForBuffer) {
      const d = new Date(eventDateForBuffer + 'T00:00:00');
      const prev = new Date(d); prev.setDate(prev.getDate() - 1);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      oldDatesToClean.add(toDateString(prev));
      oldDatesToClean.add(toDateString(next));
    }

    for (const od of Array.from(oldDatesToClean)) {
      const inUse = await isDateUsedByOtherBooking(od, targetId);
      if (!inUse) {
        await adminClient
          .from('schedule_slots')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', od)
          .eq('status', 'travel');

        await adminClient
          .from('bookings')
          .delete()
          .eq('profile_id', profile.id)
          .eq('date', od)
          .eq('event_type', 'Travel');
      }
    }
  }

  revalidatePath('/schedule');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true, bookingId: savedBookingId };
}

/**
 * Delete a booking record and free up the slot.
 */
export async function deleteBooking(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const isValidUuid = (val?: string | null) =>
    typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  if (!isValidUuid(bookingId)) {
    return { success: true };
  }

  const adminClient = createAdminClient();

  const { data: b } = await adminClient
    .from('bookings')
    .select('date, slot_type, notes')
    .eq('id', bookingId)
    .eq('profile_id', profile.id)
    .single();

  if (b) {
    // If this booking had travel itinerary, remove the travel slots from schedule_slots
    if (b.notes?.includes('---TRAVEL_ITINERARY---')) {
      try {
        const parts = b.notes.split('---TRAVEL_ITINERARY---');
        const itin = JSON.parse(parts[1]?.trim() || '{}');
        if (itin.pre_event?.date) {
          await adminClient
            .from('schedule_slots')
            .delete()
            .eq('profile_id', profile.id)
            .eq('date', itin.pre_event.date);
        }
        if (itin.post_event?.date) {
          await adminClient
            .from('schedule_slots')
            .delete()
            .eq('profile_id', profile.id)
            .eq('date', itin.post_event.date);
        }
      } catch (e) {}
    }

    await adminClient.from('bookings').delete().eq('id', bookingId);
    await adminClient
      .from('schedule_slots')
      .delete()
      .eq('profile_id', profile.id)
      .eq('date', b.date)
      .eq('slot_type', b.slot_type);

    if (b.slot_type === 'full_day') {
      await adminClient
        .from('schedule_slots')
        .delete()
        .eq('profile_id', profile.id)
        .eq('date', b.date);
    }
  }

  revalidatePath('/schedule');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}

/**
 * Set travel hours for morning, evening, or full day.
 * Automatically keeps remaining part of day available.
 */
export async function setTravelSlot(params: {
  date: string;
  slot_type: 'morning' | 'evening' | 'full_day';
  travel_hours?: string;
  travel_route?: string;
  transport_mode?: string;
  departure_time?: string;
  arrival_time?: string;
  transit_number?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const adminClient = createAdminClient();

  // 1. Set slot as travel
  await adminClient
    .from('schedule_slots')
    .upsert({
      profile_id: profile.id,
      date: params.date,
      slot_type: params.slot_type,
      status: 'travel',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id,date,slot_type' });

  // 2. Keep the other half available explicitly, or if full_day mark morning and evening as travel
  if (params.slot_type === 'full_day') {
    await adminClient
      .from('schedule_slots')
      .upsert([
        {
          profile_id: profile.id,
          date: params.date,
          slot_type: 'morning',
          status: 'travel',
          updated_at: new Date().toISOString(),
        },
        {
          profile_id: profile.id,
          date: params.date,
          slot_type: 'evening',
          status: 'travel',
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'profile_id,date,slot_type' });
  } else if (params.slot_type === 'morning') {
    const { data: evSlot } = await adminClient
      .from('schedule_slots')
      .select('status')
      .eq('profile_id', profile.id)
      .eq('date', params.date)
      .eq('slot_type', 'evening')
      .maybeSingle();

    if (!evSlot) {
      await adminClient
        .from('schedule_slots')
        .upsert({
          profile_id: profile.id,
          date: params.date,
          slot_type: 'evening',
          status: 'available',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,date,slot_type' });
    }
  } else if (params.slot_type === 'evening') {
    const { data: mornSlot } = await adminClient
      .from('schedule_slots')
      .select('status')
      .eq('profile_id', profile.id)
      .eq('date', params.date)
      .eq('slot_type', 'morning')
      .maybeSingle();

    if (!mornSlot) {
      await adminClient
        .from('schedule_slots')
        .upsert({
          profile_id: profile.id,
          date: params.date,
          slot_type: 'morning',
          status: 'available',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,date,slot_type' });
    }
  }

  // 3. Construct rich travel title and notes
  const modeStr = params.transport_mode ? params.transport_mode.trim() : 'Travel';
  const hoursStr = params.travel_hours ? params.travel_hours.trim() : '';
  const routeStr = params.travel_route ? params.travel_route.trim() : '';
  const timingStr = (params.departure_time || params.arrival_time)
    ? `${params.departure_time || ''}${params.departure_time && params.arrival_time ? ' – ' : ''}${params.arrival_time || ''}`
    : '';

  // Title e.g. "✈️ Flight · Mumbai to Goa (4.5 hours)"
  let travelTitle = modeStr;
  if (routeStr) travelTitle += ` · ${routeStr}`;
  if (hoursStr) {
    travelTitle += ` (${hoursStr})`;
  } else if (timingStr) {
    travelTitle += ` (${timingStr})`;
  }

  // Build comprehensive notes string
  const noteParts: string[] = [];
  if (params.transport_mode) noteParts.push(`Mode: ${params.transport_mode}`);
  if (params.transit_number) noteParts.push(`Carrier/Vehicle: ${params.transit_number}`);
  if (timingStr) noteParts.push(`Timing: ${timingStr}`);
  if (hoursStr) noteParts.push(`Duration: ${hoursStr}`);
  if (params.notes) noteParts.push(params.notes.trim());
  const combinedNotes = noteParts.join(' | ');

  await adminClient
    .from('bookings')
    .delete()
    .eq('profile_id', profile.id)
    .eq('date', params.date)
    .eq('slot_type', params.slot_type);

  await adminClient
    .from('bookings')
    .insert({
      profile_id: profile.id,
      date: params.date,
      slot_type: params.slot_type,
      event_type: 'Travel',
      event_name: travelTitle,
      city: routeStr || 'In Transit',
      notes: combinedNotes || 'Travel time',
      is_out_of_city: true,
    });

  revalidatePath('/schedule');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return { success: true };
}

/**
 * Public function to get an anchor's live schedule for their public profile.
 */
export async function getPublicAnchorSchedule(profileId: string) {
  const adminClient = createAdminClient();

  // 1. Check if schedule visibility is enabled
  const { data: setting } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', `show_calendar_${profileId}`)
    .maybeSingle();

  const showCalendar = setting ? setting.value === 'true' : true;

  if (!showCalendar) {
    return { showCalendar: false, slotsMap: {}, bookings: [] };
  }

  // 2. Fetch slots from current month onwards (3 months range)
  const today = new Date();
  const startMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: slotsData } = await adminClient
    .from('schedule_slots')
    .select('date, slot_type, status')
    .eq('profile_id', profileId)
    .gte('date', startMonthStr);

  const { data: bookingsData } = await adminClient
    .from('bookings')
    .select('date, slot_type, event_type, event_name, city, notes')
    .eq('profile_id', profileId)
    .gte('date', startMonthStr);

  // Identify active travel dates to skip orphaned travel slots
  const legitimateTravelDates = new Set<string>();
  (bookingsData || []).forEach((b: any) => {
    if (b.event_type === 'Travel') {
      legitimateTravelDates.add(b.date);
    }
    const raw = b.notes || '';
    if (raw.includes('---TRAVEL_ITINERARY---')) {
      try {
        const parts = raw.split(/---TRAVEL_ITINERARY---\n?/);
        const itin = JSON.parse(parts[1] || '{}');
        if (itin.pre_event?.enabled && itin.pre_event.date) legitimateTravelDates.add(itin.pre_event.date);
        if (itin.post_event?.enabled && itin.post_event.date) legitimateTravelDates.add(itin.post_event.date);
      } catch (e) {}
    }
  });

  const slotsMap: Record<string, DaySlots> = {};
  (slotsData || []).forEach(slot => {
    if (slot.status === 'travel' && !legitimateTravelDates.has(slot.date)) {
      return; // Skip orphaned travel slot
    }
    if (!slotsMap[slot.date]) slotsMap[slot.date] = {};
    const type = slot.slot_type as keyof DaySlots;
    slotsMap[slot.date][type] = slot.status as SlotStatus;
  });

  // Cross-reference with bookings
  (bookingsData || []).forEach((b: any) => {
    const isTravel = b.event_type === 'Travel';
    const isTentative = (b.notes || '').includes('[PENCIL_HOLD]');
    const resolvedStatus: SlotStatus = isTravel ? 'travel' : (isTentative ? 'tentative' : 'booked');

    if (!slotsMap[b.date]) slotsMap[b.date] = {};
    if (b.slot_type === 'full_day') {
      slotsMap[b.date].full_day = resolvedStatus;
      slotsMap[b.date].morning = resolvedStatus;
      slotsMap[b.date].evening = resolvedStatus;
    } else if (b.slot_type === 'morning') {
      slotsMap[b.date].morning = resolvedStatus;
    } else if (b.slot_type === 'evening') {
      slotsMap[b.date].evening = resolvedStatus;
    }
  });

  return {
    showCalendar: true,
    slotsMap,
    bookings: bookingsData || [],
  };
}

/**
 * Fetch upcoming booked events for the dashboard.
 */
export async function getUpcomingEvents(limit = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  const adminClient = createAdminClient();
  const today = toDateString(new Date());

  // Try fetching from bookings table
  const { data: bookings } = await adminClient
    .from('bookings')
    .select('*')
    .eq('profile_id', profile.id)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit);

  if (bookings && bookings.length > 0) {
    return bookings.map(b => {
      let rawNotes = b.notes || '';
      let cueNotes = b.cue_notes || '';
      if (rawNotes.includes('\n---CUE_SHEET---\n')) {
        const parts = rawNotes.split('\n---CUE_SHEET---\n');
        rawNotes = parts[0] || '';
        cueNotes = parts[1] || '';
      }
      return {
        id: b.id,
        event_name: b.event_name,
        event_type: b.event_type,
        date: b.date,
        slot_type: b.slot_type,
        event_city: b.city,
        venue: b.venue,
        amount: b.amount,
        client_name: b.client_name,
        client_phone: b.client_phone,
        booking_status: (b.booking_status || 'confirmed') as 'confirmed' | 'tentative',
        notes: rawNotes,
        cue_notes: cueNotes,
      };
    });
  }

  // Fallback to schedule_slots where status in ('booked', 'tentative')
  const { data: slots } = await adminClient
    .from('schedule_slots')
    .select('*')
    .eq('profile_id', profile.id)
    .in('status', ['booked', 'tentative'])
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit);

  return (slots || []).map(s => ({
    id: s.id,
    event_name: s.status === 'tentative' ? 'Pencil Hold (Tentative)' : 'Confirmed Event',
    event_type: 'Live Show',
    date: s.date,
    slot_type: s.slot_type,
    event_city: s.status === 'tentative' ? 'Tentative Hold' : 'Confirmed Booking',
    venue: undefined as string | undefined,
    amount: undefined as number | undefined,
    client_name: undefined as string | undefined,
    client_phone: undefined as string | undefined,
    booking_status: (s.status === 'tentative' ? 'tentative' : 'confirmed') as 'confirmed' | 'tentative',
    notes: s.notes,
    cue_notes: undefined as string | undefined,
  }));
}

/**
 * Bulk import bookings from CSV/Excel data for the logged-in anchor.
 * Supports auto-matching slots, creating bookings, and marking dates as booked.
 */
export async function importBookingsBulk(
  rawBookings: Array<{
    date: string;
    slot_type?: 'morning' | 'evening' | 'full_day';
    booking_status?: 'confirmed' | 'tentative';
    event_name?: string;
    event_type?: string;
    city?: string;
    venue?: string;
    client_name?: string;
    client_phone?: string;
    client_email?: string;
    amount?: number | string;
    event_time?: string;
    notes?: string;
    is_out_of_city?: boolean;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('anchor_profiles')
    .select('id, slug, city')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Anchor profile not found');

  if (!Array.isArray(rawBookings) || rawBookings.length === 0) {
    throw new Error('No valid bookings data provided for import');
  }

  const adminClient = createAdminClient();
  let importedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawBookings.length; i++) {
    const item = rawBookings[i];
    try {
      // Validate date (YYYY-MM-DD)
      let cleanDate = (item.date || '').trim();
      if (!cleanDate) {
        errors.push(`Row ${i + 1}: Missing date`);
        continue;
      }

      // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD if needed
      if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(cleanDate)) {
        const parts = cleanDate.split(/[/-]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        cleanDate = `${year}-${month}-${day}`;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        errors.push(`Row ${i + 1}: Invalid date format "${item.date}". Use YYYY-MM-DD or DD/MM/YYYY.`);
        continue;
      }

      // Validate slot type
      let sType: SlotType = 'full_day';
      const rawSlot = (item.slot_type || '').toLowerCase().trim();
      if (rawSlot.includes('morn') || rawSlot === 'day') {
        sType = 'morning';
      } else if (rawSlot.includes('eve') || rawSlot.includes('night')) {
        sType = 'evening';
      } else {
        sType = 'full_day';
      }

      const status = item.booking_status === 'tentative' ? 'tentative' : 'confirmed';
      const eventName = item.event_name?.trim() || 'Event Booking';
      const eventType = item.event_type?.trim() || 'Wedding';
      const city = item.city?.trim() || profile.city || '';
      const venue = item.venue?.trim() || '';
      const clientName = item.client_name?.trim() || '';
      const clientPhone = item.client_phone?.trim() || '';
      const clientEmail = item.client_email?.trim() || '';
      const amountNum = item.amount ? Number(String(item.amount).replace(/[^0-9.]/g, '')) : undefined;
      const notes = item.notes?.trim() || '';
      const isOutOfCity = item.is_out_of_city !== undefined
        ? !!item.is_out_of_city
        : (profile.city && city && profile.city.toLowerCase() !== city.toLowerCase());

      // Upsert schedule_slot (booked in DB constraint)
      await adminClient
        .from('schedule_slots')
        .upsert({
          profile_id: profile.id,
          date: cleanDate,
          slot_type: sType,
          status: 'booked',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,date,slot_type',
        });

      if (sType === 'full_day') {
        await adminClient
          .from('schedule_slots')
          .upsert([
            {
              profile_id: profile.id,
              date: cleanDate,
              slot_type: 'morning',
              status: 'booked',
              updated_at: new Date().toISOString(),
            },
            {
              profile_id: profile.id,
              date: cleanDate,
              slot_type: 'evening',
              status: 'booked',
              updated_at: new Date().toISOString(),
            },
          ], {
            onConflict: 'profile_id,date,slot_type',
          });
      }

      // Prepare notes with metadata
      let cleanNotes = notes;
      if (status === 'tentative') {
        cleanNotes = `[PENCIL_HOLD]\n${cleanNotes}`;
      }
      if (item.event_time?.trim()) {
        cleanNotes = `${cleanNotes}\n[TIME: ${item.event_time.trim()}]`;
      }

      // Check existing booking on this profile, date, slot
      const { data: existingBooking } = await adminClient
        .from('bookings')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date', cleanDate)
        .eq('slot_type', sType)
        .maybeSingle();

      if (existingBooking) {
        await adminClient
          .from('bookings')
          .update({
            event_type: eventType,
            event_name: eventName,
            city,
            venue,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            amount: amountNum || null,
            notes: cleanNotes,
            is_out_of_city: isOutOfCity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBooking.id);
      } else {
        await adminClient
          .from('bookings')
          .insert({
            profile_id: profile.id,
            date: cleanDate,
            slot_type: sType,
            event_type: eventType,
            event_name: eventName,
            city,
            venue,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            amount: amountNum || null,
            notes: cleanNotes,
            is_out_of_city: isOutOfCity,
          });
      }

      importedCount++;
    } catch (rowErr) {
      errors.push(`Row ${i + 1}: ${rowErr instanceof Error ? rowErr.message : 'Import failed'}`);
    }
  }

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
  if (profile.slug) {
    revalidatePath(`/${profile.slug}`);
  }

  return {
    success: true,
    importedCount,
    totalReceived: rawBookings.length,
    errors,
  };
}

