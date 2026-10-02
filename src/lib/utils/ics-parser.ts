/**
 * Lightweight, robust ICS (iCalendar) parser for Google Calendar, Apple Calendar, and Outlook
 */

export interface ParsedCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  allDay: boolean;
  status: string;    // 'CONFIRMED', 'TENTATIVE', 'CANCELLED'
  coveredDates: string[]; // List of YYYY-MM-DD strings
}

/**
 * Parses raw iCalendar text into structured events
 */
export function parseIcsCalendar(icsContent: string): ParsedCalendarEvent[] {
  // Normalize line foldings (lines starting with space or tab are continuation of previous line)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\r|\n/);

  const events: ParsedCalendarEvent[] = [];
  let inEvent = false;
  let currentEvent: Partial<ParsedCalendarEvent> & { rawStart?: string; rawEnd?: string } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        summary: 'Busy',
        status: 'CONFIRMED',
        allDay: false,
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.rawStart) {
        const parsed = finalizeEvent(currentEvent);
        if (parsed) {
          events.push(parsed);
        }
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const propHeader = line.slice(0, colonIndex).toUpperCase();
    const propValue = line.slice(colonIndex + 1);

    if (propHeader === 'UID') {
      currentEvent.uid = propValue;
    } else if (propHeader === 'SUMMARY') {
      currentEvent.summary = propValue || 'Busy / Private Event';
    } else if (propHeader === 'DESCRIPTION') {
      currentEvent.description = propValue;
    } else if (propHeader === 'STATUS') {
      currentEvent.status = propValue.toUpperCase();
    } else if (propHeader.startsWith('DTSTART')) {
      currentEvent.rawStart = propValue;
      if (propHeader.includes('VALUE=DATE')) {
        currentEvent.allDay = true;
      }
    } else if (propHeader.startsWith('DTEND')) {
      currentEvent.rawEnd = propValue;
    }
  }

  return events;
}

/**
 * Extracts YYYY-MM-DD from various iCal timestamp formats
 */
function parseIcsDate(raw: string): string | null {
  if (!raw) return null;
  // Format: 20261025 or 20261025T140000Z
  const clean = raw.replace(/\D/g, '');
  if (clean.length < 8) return null;

  const y = clean.slice(0, 4);
  const m = clean.slice(4, 6);
  const d = clean.slice(6, 8);

  return `${y}-${m}-${d}`;
}

/**
 * Finalizes event dates and computes all covered YYYY-MM-DD days
 */
function finalizeEvent(raw: Partial<ParsedCalendarEvent> & { rawStart?: string; rawEnd?: string }): ParsedCalendarEvent | null {
  const startDateStr = parseIcsDate(raw.rawStart || '');
  if (!startDateStr) return null;

  let endDateStr = parseIcsDate(raw.rawEnd || '') || startDateStr;

  // Compute all dates between startDate and endDate
  const coveredDates: string[] = [];
  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T00:00:00Z`);

  if (isNaN(start.getTime())) return null;

  // In iCal all-day events, DTEND is exclusive (day after). If start === end or end < start:
  if (end.getTime() <= start.getTime()) {
    coveredDates.push(startDateStr);
  } else {
    const cur = new Date(start);
    // If all day and end is exclusive, we stop before end, unless end is same day
    const stopCondition = raw.allDay && end.getTime() > start.getTime()
      ? end.getTime()
      : end.getTime() + 86400000;

    while (cur.getTime() < stopCondition) {
      coveredDates.push(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
      // Safety guard against infinite loops
      if (coveredDates.length > 60) break;
    }
  }

  return {
    uid: raw.uid || `evt_${Math.random().toString(36).slice(2)}`,
    summary: raw.summary || 'Busy / Private Event',
    description: raw.description,
    startDate: startDateStr,
    endDate: endDateStr,
    allDay: !!raw.allDay,
    status: raw.status || 'CONFIRMED',
    coveredDates: coveredDates.length > 0 ? coveredDates : [startDateStr],
  };
}
