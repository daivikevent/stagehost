import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminClient = createAdminClient();

    // 1. Fetch anchor profile
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('id, name, slug, city')
      .eq('slug', slug)
      .single();

    if (!profile) {
      return new NextResponse('Calendar not found', { status: 404 });
    }

    // 2. Fetch confirmed bookings
    const { data: bookings } = await adminClient
      .from('schedule_bookings')
      .select('*')
      .eq('profile_id', profile.id)
      .order('date', { ascending: true });

    // 3. Construct RFC 5545 iCalendar format
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StageHost//Anchor Tour Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${profile.name} - Stage Tour`,
      `X-WR-TIMEZONE:Asia/Kolkata`,
    ];

    (bookings || []).forEach((b) => {
      const cleanDate = b.date.replace(/-/g, ''); // YYYYMMDD
      let dtStart = '';
      let dtEnd = '';

      if (b.slot_type === 'morning') {
        dtStart = `${cleanDate}T100000`;
        dtEnd = `${cleanDate}T150000`;
      } else if (b.slot_type === 'evening') {
        dtStart = `${cleanDate}T180000`;
        dtEnd = `${cleanDate}T233000`;
      } else {
        dtStart = `${cleanDate}T100000`;
        dtEnd = `${cleanDate}T233000`;
      }

      const summary = b.event_name || b.event_type || 'Anchor Show';
      const location = [b.venue, b.city, profile.city].filter(Boolean).join(', ');
      const desc = `Client: ${b.client_name || 'Confirmed Client'}\\nSlot: ${b.slot_type}\\nVenue: ${location}\\nManaged via StageHost`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${b.id || Math.random().toString(36).slice(2)}@stagehost.in`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:🎤 ${summary}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');

    const icsContent = lines.join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${profile.slug}-schedule.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
