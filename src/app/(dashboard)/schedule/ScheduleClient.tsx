'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  MapPin,
  Plus,
  X,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Plane,
  Edit2,
  Trash2,
  Sparkles,
  Star,
  AlertCircle,
  Phone,
  Receipt,
  Check,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
  Lock,
  FileSpreadsheet,
  Search,
  MessageCircle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { getDaysInMonth, getFirstDayOfMonth, toDateString, cn } from '@/lib/utils';
import { SLOT_STATUS_COLORS, SLOT_STATUS_LABELS, EVENT_TYPES } from '@/constants';
import type { SlotType, SlotStatus } from '@/types';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BookingReceiptModal } from '@/components/schedule/BookingReceiptModal';
import { CalendarSyncModal } from '@/components/schedule/CalendarSyncModal';
import { BookingImportExportModal } from '@/components/schedule/BookingImportExportModal';
import { EventFunctionsPicker } from '@/components/common/EventFunctionsPicker';
import { saveSlotTimings } from '@/lib/actions/profile';
import {
  upsertSlot,
  saveBooking,
  deleteBooking,
  setTravelSlot,
  toggleCalendarVisibility,
  type DaySlots,
  type BookingRecord,
} from '@/lib/actions/schedule';
import styles from './schedule.module.css';

interface ScheduleClientProps {
  initialProfile: { id: string; name: string; slug: string; city?: string; slot_times?: any } | null;
  initialSlots: Record<string, DaySlots>;
  initialBookings: BookingRecord[];
  initialInquiries?: any[];
  initialShowCalendar: boolean;
}

interface BookingForm {
  id?: string;
  original_date?: string;
  date: string;
  booking_status?: 'confirmed' | 'tentative';
  hold_duration?: 'none' | '24h' | '48h' | '72h' | '7d' | 'custom';
  hold_expiry?: string;
  event_type: string;
  event_name: string;
  event_time?: string;
  city: string;
  venue: string;
  client_name: string;
  client_phone: string;
  amount: string;
  notes: string;
  cue_notes?: string;
  is_out_of_city: boolean;
}

export function extractHoldExpiry(notes?: string): { expiryDate: Date | null; isExpired: boolean; hoursLeft: number; label: string } {
  if (!notes) return { expiryDate: null, isExpired: false, hoursLeft: 0, label: '' };
  const match = notes.match(/\[HOLD_EXPIRY:\s*(.*?)\]/);
  if (!match) return { expiryDate: null, isExpired: false, hoursLeft: 0, label: '' };
  const dateStr = match[1]?.trim();
  const expiryDate = new Date(dateStr);
  if (isNaN(expiryDate.getTime())) return { expiryDate: null, isExpired: false, hoursLeft: 0, label: '' };

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
  const isExpired = diffMs <= 0;

  let label = '';
  if (isExpired) {
    const hoursAgo = Math.abs(hoursLeft);
    label = hoursAgo < 24 ? `⚠️ Expired ${hoursAgo}h ago` : `⚠️ Expired (${expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
  } else {
    label = hoursLeft < 24 ? `⏳ ${hoursLeft}h left` : `⏳ ${Math.ceil(hoursLeft / 24)}d left`;
  }

  return { expiryDate, isExpired, hoursLeft, label };
}

export function generateHoldNudgeMessage(booking: BookingRecord, profileName: string) {
  const clientName = booking.client_name?.trim() || 'Sir/Ma’am';
  const showName = booking.event_name || booking.event_type || 'your event';
  const venue = booking.venue || booking.city || '';
  const dateFormatted = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const anchor = profileName || 'Anchor';

  return `Hi ${clientName}! 🌟

This is a gentle reminder regarding the Pencil Hold for ${showName} on *${dateFormatted}*${venue ? ` at ${venue}` : ''}.

As we have incoming inquiries for this peak date, please let us know if you would like to confirm by clearing the advance token so we can reserve this date exclusively for you.

Looking forward to hosting your celebration!

Warm regards,
${anchor}`;
}

export function generateGoogleCalendarUrl(booking: {
  event_name?: string;
  event_type?: string;
  date: string;
  event_time?: string;
  slot_type?: string;
  venue?: string;
  city?: string;
  client_name?: string;
  client_phone?: string;
  cue_notes?: string;
  notes?: string;
}, profileName: string): string {
  const title = `${booking.event_name || booking.event_type || 'Show'} · ${profileName}`;
  const location = [booking.venue, booking.city].filter(Boolean).join(', ');
  
  let startHour = 19;
  let startMin = 0;
  let endHour = 23;
  let endMin = 30;

  if (booking.slot_type === 'morning') {
    startHour = 10;
    startMin = 0;
    endHour = 14;
    endMin = 30;
  } else if (booking.slot_type === 'full_day') {
    startHour = 10;
    startMin = 0;
    endHour = 23;
    endMin = 0;
  }

  const [y, m, d] = booking.date.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const startStr = `${y}${pad(m)}${pad(d)}T${pad(startHour)}${pad(startMin)}00`;
  const endStr = `${y}${pad(m)}${pad(d)}T${pad(endHour)}${pad(endMin)}00`;

  const details = [
    `🎤 StageHost Show Booking`,
    `Artist: ${profileName}`,
    `Event: ${booking.event_name || booking.event_type}`,
    `Timing: ${booking.event_time || ''}`,
    `Client: ${booking.client_name || ''} (${booking.client_phone || ''})`,
    booking.venue ? `Venue: ${booking.venue}` : '',
    booking.cue_notes ? `\n--- Green Room Run Sheet ---\n${booking.cue_notes}` : '',
  ].filter(Boolean).join('\n');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

interface TravelForm {
  slot_type: 'morning' | 'evening' | 'full_day';
  transport_mode: string;
  from_city: string;
  to_city: string;
  travel_route: string;
  departure_time: string;
  arrival_time: string;
  travel_hours: string;
  transit_number: string;
  notes: string;
}

export interface TravelBufferItem {
  enabled: boolean;
  date: string;
  slot_type: 'morning' | 'evening' | 'full_day';
  transport_mode: string;
  from_city: string;
  to_city: string;
  travel_time?: string;
  notes: string;
}

export interface TravelBufferState {
  pre_event: TravelBufferItem;
  post_event: TravelBufferItem;
}

const TRANSPORT_MODES = [
  { id: 'flight', label: 'Flight', icon: '✈️', defaultText: '✈️ Flight' },
  { id: 'train', label: 'Train', icon: '🚆', defaultText: '🚆 Train' },
  { id: 'car', label: 'By Road / Car', icon: '🚗', defaultText: '🚗 By Road' },
  { id: 'cab', label: 'Outstation Cab', icon: '🚕', defaultText: '🚕 Outstation Cab' },
  { id: 'bus', label: 'Bus / Volvo', icon: '🚌', defaultText: '🚌 Bus / Volvo' },
  { id: 'custom', label: 'Other / Custom', icon: '✍️', defaultText: 'Transit' },
];

const DURATION_PRESETS = [
  '2-3 hours',
  '3-4 hours',
  '4-5 hours',
  '6-8 hours',
  'Full Day Transit',
  'Overnight Journey',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ScheduleClient({
  initialProfile,
  initialSlots,
  initialBookings,
  initialInquiries = [],
  initialShowCalendar,
}: ScheduleClientProps) {
  const { success, error: showError } = useToast();
  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayDateStr);
  const [slots, setSlots] = useState<Record<string, DaySlots>>(initialSlots);
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [showCalendar, setShowCalendar] = useState<boolean>(initialShowCalendar);
  const [bookingViewMode, setBookingViewMode] = useState<'grid' | 'list'>('grid');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'tentative' | 'travel'>('all');

  // Helper to reliably detect whether a booking or date slot is a Pencil Hold (Tentative)
  const isBookingTentative = (b?: BookingRecord | null) => {
    if (!b) return false;
    return (
      (b as any).booking_status === 'tentative' ||
      slots[b.date]?.[b.slot_type as SlotType] === 'tentative' ||
      (b.slot_type === 'full_day' && slots[b.date]?.full_day === 'tentative') ||
      b.notes?.includes('[PENCIL_HOLD]') === true
    );
  };

  // Helper to pick primary home city when profile has multi-cities (e.g. 'Mumbai & Udaipur')
  const getPrimaryHomeCity = (profileCity?: string, destinationCity?: string) => {
    if (!profileCity) return '';
    const cities = profileCity.split(/&|,|\//).map((c) => c.trim()).filter(Boolean);
    if (cities.length <= 1) return profileCity;
    if (destinationCity) {
      const destLower = destinationCity.toLowerCase();
      const otherCity = cities.find((c) => !destLower.includes(c.toLowerCase()) && !c.toLowerCase().includes(destLower));
      if (otherCity) return otherCity;
    }
    return cities[0];
  };

  // Filtered booking collections: Shows pipeline only contains actual event bookings.
  // Outstation transit itineraries are cleanly embedded inside their respective show entry.
  const showBookings = useMemo(() => {
    return [...bookings]
      .filter((b) => b.event_type !== 'Travel')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings]);
  const confirmedBookings = useMemo(() => showBookings.filter((b) => !isBookingTentative(b)), [showBookings]);
  const tentativeBookings = useMemo(() => showBookings.filter((b) => isBookingTentative(b)), [showBookings]);
  const outstationBookings = useMemo(() => showBookings.filter((b) => b.is_out_of_city || b.travel_itinerary), [showBookings]);

  // Expiring holds with countdown calculations for smart nudging
  const expiringHolds = useMemo(() => {
    return tentativeBookings.map((b) => {
      const { expiryDate, isExpired, hoursLeft, label } = extractHoldExpiry(b.notes);
      return { booking: b, expiryDate, isExpired, hoursLeft, label };
    }).sort((a, b) => (a.hoursLeft || 999) - (b.hoursLeft || 999));
  }, [tentativeBookings]);

  // Pipeline Real-time Search State
  const [pipelineSearch, setPipelineSearch] = useState('');

  const displayBookings = useMemo(() => {
    let list = bookingFilter === 'confirmed'
      ? confirmedBookings
      : bookingFilter === 'tentative'
        ? tentativeBookings
        : bookingFilter === 'travel'
          ? outstationBookings
          : showBookings;

    if (pipelineSearch.trim()) {
      const q = pipelineSearch.toLowerCase().trim();
      list = list.filter((b) =>
        (b.event_name || '').toLowerCase().includes(q) ||
        (b.client_name || '').toLowerCase().includes(q) ||
        (b.city || '').toLowerCase().includes(q) ||
        (b.venue || '').toLowerCase().includes(q) ||
        (b.client_phone || '').includes(q) ||
        (b.date || '').includes(q)
      );
    }
    return list;
  }, [bookingFilter, confirmedBookings, tentativeBookings, outstationBookings, showBookings, pipelineSearch]);

  // Load and persist schedule view mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stagehost_schedule_view');
      if (saved === 'grid' || saved === 'list') {
        setBookingViewMode(saved);
      }
    } catch { }
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setBookingViewMode(mode);
    try {
      localStorage.setItem('stagehost_schedule_view', mode);
    } catch { }
  };

  // Primary Screen View Mode: 'calendar' | 'pipeline' | 'all'
  const [mainView, setMainView] = useState<'calendar' | 'pipeline' | 'all'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stagehost_schedule_main_view');
      if (saved === 'calendar' || saved === 'pipeline' || saved === 'all') {
        setMainView(saved);
      }
    } catch { }
  }, []);

  const handleSetMainView = (mode: 'calendar' | 'pipeline' | 'all') => {
    setMainView(mode);
    try {
      localStorage.setItem('stagehost_schedule_main_view', mode);
    } catch { }
  };

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHoldsModal, setShowHoldsModal] = useState(false);
  const [activeSlotType, setActiveSlotType] = useState<SlotType>('morning');
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    date: toDateString(today),
    booking_status: 'confirmed',
    hold_duration: 'none',
    hold_expiry: '',
    event_type: '',
    event_name: '',
    event_time: '10:00 AM – 02:30 PM',
    city: '',
    venue: '',
    client_name: '',
    client_phone: '',
    amount: '',
    notes: '',
    cue_notes: '',
    is_out_of_city: false,
  });

  // Outstation Travel Buffer State (Pre-event departure & Post-event return)
  const [travelBuffer, setTravelBuffer] = useState<TravelBufferState>({
    pre_event: {
      enabled: true,
      date: '',
      slot_type: 'full_day',
      transport_mode: '✈️ Flight',
      from_city: '',
      to_city: '',
      travel_time: '04:00 PM – 06:30 PM',
      notes: '',
    },
    post_event: {
      enabled: true,
      date: '',
      slot_type: 'morning',
      transport_mode: '✈️ Flight',
      from_city: '',
      to_city: '',
      travel_time: '10:30 AM – 01:00 PM',
      notes: '',
    },
  });

  // Backstage VIP Cue Sheet Modal State
  const [cueSheetBooking, setCueSheetBooking] = useState<BookingRecord | null>(null);

  // Travel Modal State
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [travelForm, setTravelForm] = useState<TravelForm>({
    slot_type: 'morning',
    transport_mode: '✈️ Flight',
    from_city: '',
    to_city: '',
    travel_route: '',
    departure_time: '',
    arrival_time: '',
    travel_hours: '3-4 hours',
    transit_number: '',
    notes: '',
  });

  // Delete Booking Confirmation State
  const [deletingBooking, setDeletingBooking] = useState<BookingRecord | null>(null);

  // Booking Receipt Modal State
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);

  // Calendar Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Bulk Import / Export Modal State
  const [showImportExportModal, setShowImportExportModal] = useState(false);

  // Editable Slot Timings State (Configurable by anchor, persisted in profile DB & localStorage)
  const [slotTimes, setSlotTimes] = useState<{ morning: string; evening: string; full_day: string }>(() => {
    if (initialProfile?.slot_times && typeof initialProfile.slot_times === 'object') {
      return {
        morning: initialProfile.slot_times.morning || '10 AM – 3 PM',
        evening: initialProfile.slot_times.evening || '6 PM – 11:30 PM',
        full_day: initialProfile.slot_times.full_day || 'Full Day (Morning + Evening)',
      };
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stagehost_custom_slot_times');
        if (saved) return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      morning: '10 AM – 3 PM',
      evening: '6 PM – 11:30 PM',
      full_day: 'Full Day (Morning + Evening)',
    };
  });
  const [editingSlotTime, setEditingSlotTime] = useState<'morning' | 'evening' | null>(null);
  const [tempTimeVal, setTempTimeVal] = useState('');

  const saveCustomTime = async (slot: 'morning' | 'evening') => {
    if (!tempTimeVal.trim()) {
      setEditingSlotTime(null);
      return;
    }
    const updated = { ...slotTimes, [slot]: tempTimeVal.trim() };
    setSlotTimes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stagehost_custom_slot_times', JSON.stringify(updated));
    }
    setEditingSlotTime(null);
    success(`${slot === 'morning' ? 'Morning' : 'Evening'} timing updated to "${tempTimeVal.trim()}"`);

    try {
      await saveSlotTimings(updated);
    } catch (err) {
      console.warn('Could not persist custom slot times to profile DB:', err);
    }
  };

  const [isPending, startTransition] = useTransition();

  const daysInMonth = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const firstDayOfWeek = useMemo(
    () => getFirstDayOfMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parseInt(parts[0], 10) !== newYear || parseInt(parts[1], 10) - 1 !== newMonth) {
        setSelectedDate(null);
      }
    }
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parseInt(parts[0], 10) !== newYear || parseInt(parts[1], 10) - 1 !== newMonth) {
        setSelectedDate(null);
      }
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = toDateString(new Date(currentYear, currentMonth, day));
    if (selectedDate === dateStr) {
      // Second click on the same date opens Add Booking modal directly!
      const dayBookings = getDayBookings(dateStr);
      const mBooked = dayBookings.some((b) => b.slot_type === 'morning' || b.slot_type === 'full_day');
      openBookingModal(mBooked ? 'evening' : 'morning', undefined, dateStr);
    } else {
      setSelectedDate(dateStr);
    }
  };

  const handleDateDoubleClick = (day: number) => {
    const dateStr = toDateString(new Date(currentYear, currentMonth, day));
    setSelectedDate(dateStr);
    const dayBookings = getDayBookings(dateStr);
    const mBooked = dayBookings.some((b) => b.slot_type === 'morning' || b.slot_type === 'full_day');
    openBookingModal(mBooked ? 'evening' : 'morning', undefined, dateStr);
  };

  // Toggle Live Calendar on Public Profile
  const handleToggleVisibility = () => {
    const nextShow = !showCalendar;
    setShowCalendar(nextShow);
    startTransition(async () => {
      try {
        await toggleCalendarVisibility(nextShow);
        success(
          nextShow
            ? 'Live schedule is now VISIBLE on your public portfolio!'
            : 'Live schedule is now HIDDEN from your public portfolio'
        );
      } catch (err) {
        setShowCalendar(!nextShow);
        showError('Failed to update visibility setting');
      }
    });
  };

  // Open Add / Edit Booking Modal for specific slot
  const openBookingModal = (slotType: SlotType, existingBooking?: BookingRecord, targetDate?: string) => {
    const defaultDateForMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(Math.min(today.getDate(), 28)).padStart(2, '0')}`;
    const effectiveDate = targetDate || existingBooking?.date || selectedDate || defaultDateForMonth;
    setSelectedDate(effectiveDate);
    setActiveSlotType(slotType);

    if (existingBooking) {
      let rawNotes = existingBooking.notes || '';
      let cueNotes = existingBooking.cue_notes || '';
      let isTentative = (existingBooking as any).booking_status === 'tentative';
      let eventTime = existingBooking.event_time || '';
      let attachedItinerary = existingBooking.travel_itinerary || null;

      if (rawNotes.startsWith('[PENCIL_HOLD]')) {
        isTentative = true;
        rawNotes = rawNotes.replace(/^\[PENCIL_HOLD\]\s*/, '');
      }
      if (rawNotes.includes('---TRAVEL_ITINERARY---')) {
        const parts = rawNotes.split(/---TRAVEL_ITINERARY---\n?/);
        rawNotes = parts[0] || '';
        try {
          attachedItinerary = JSON.parse(parts[1] || '{}');
        } catch (e) { }
      }
      if (rawNotes.includes('---CUE_SHEET---')) {
        const parts = rawNotes.split(/---CUE_SHEET---\n?/);
        rawNotes = parts[0] || '';
        cueNotes = parts[1] || '';
      }
      if (rawNotes.includes('[TIME:')) {
        const timeMatch = rawNotes.match(/\[TIME:\s*(.*?)\]/);
        if (timeMatch) {
          eventTime = timeMatch[1].trim();
          rawNotes = rawNotes.replace(/\[TIME:\s*.*?\]\s*/, '');
        }
      }

      let holdExpiry = '';
      if (rawNotes.includes('[HOLD_EXPIRY:')) {
        const holdMatch = rawNotes.match(/\[HOLD_EXPIRY:\s*(.*?)\]/);
        if (holdMatch) {
          holdExpiry = holdMatch[1].trim();
          rawNotes = rawNotes.replace(/\[HOLD_EXPIRY:\s*.*?\]\s*/, '');
        }
      }

      const dayStatus = effectiveDate ? slots[effectiveDate]?.[slotType] : 'booked';
      const initialDate = existingBooking.date || effectiveDate;
      setBookingForm({
        id: existingBooking.id,
        original_date: initialDate,
        date: initialDate,
        booking_status: isTentative || dayStatus === 'tentative' ? 'tentative' : 'confirmed',
        hold_duration: holdExpiry ? 'custom' : 'none',
        hold_expiry: holdExpiry,
        event_type: existingBooking.event_type || '',
        event_name: existingBooking.event_name || '',
        event_time: eventTime || (slotType === 'morning' ? '10:00 AM – 02:30 PM' : slotType === 'evening' ? '07:00 PM – 11:30 PM' : 'Full Day (All Day)'),
        city: existingBooking.city || '',
        venue: existingBooking.venue || '',
        client_name: existingBooking.client_name || '',
        client_phone: existingBooking.client_phone || '',
        amount: existingBooking.amount?.toString() || '',
        notes: rawNotes.trim(),
        cue_notes: cueNotes || '',
        is_out_of_city: !!existingBooking.is_out_of_city || !!attachedItinerary,
      });

      if (attachedItinerary) {
        setTravelBuffer(attachedItinerary);
      } else {
        const targetDateObj = new Date(initialDate + 'T00:00:00');
        const prevDateObj = new Date(targetDateObj);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        const prevDateStr = toDateString(prevDateObj);

        const nextDateObj = new Date(targetDateObj);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDateStr = toDateString(nextDateObj);

        const destCity = existingBooking?.city || '';
        const homeCity = getPrimaryHomeCity(initialProfile?.city, destCity);

        setTravelBuffer({
          pre_event: {
            enabled: true,
            date: prevDateStr,
            slot_type: 'full_day',
            transport_mode: '✈️ Flight',
            from_city: homeCity,
            to_city: destCity,
            travel_time: '04:00 PM – 06:30 PM',
            notes: '',
          },
          post_event: {
            enabled: true,
            date: nextDateStr,
            slot_type: 'morning',
            transport_mode: '✈️ Flight',
            from_city: destCity,
            to_city: homeCity,
            travel_time: '10:30 AM – 01:00 PM',
            notes: '',
          },
        });
      }
    } else {
      setBookingForm({
        date: effectiveDate,
        original_date: undefined,
        booking_status: 'confirmed',
        hold_duration: 'none',
        hold_expiry: '',
        event_type: '',
        event_name: '',
        event_time: slotType === 'morning' ? '10:00 AM – 02:30 PM' : slotType === 'evening' ? '07:00 PM – 11:30 PM' : 'Full Day (All Day)',
        city: '',
        venue: '',
        client_name: '',
        client_phone: '',
        amount: '',
        notes: '',
        cue_notes: '',
        is_out_of_city: false,
      });

      const targetDateObj = new Date(effectiveDate + 'T00:00:00');
      const prevDateObj = new Date(targetDateObj);
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevDateStr = toDateString(prevDateObj);

      const nextDateObj = new Date(targetDateObj);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const nextDateStr = toDateString(nextDateObj);

      const homeCity = getPrimaryHomeCity(initialProfile?.city, '');

      setTravelBuffer({
        pre_event: {
          enabled: true,
          date: prevDateStr,
          slot_type: 'full_day',
          transport_mode: '✈️ Flight',
          from_city: homeCity,
          to_city: '',
          travel_time: '04:00 PM – 06:30 PM',
          notes: '',
        },
        post_event: {
          enabled: true,
          date: nextDateStr,
          slot_type: 'morning',
          transport_mode: '✈️ Flight',
          from_city: '',
          to_city: homeCity,
          travel_time: '10:30 AM – 01:00 PM',
          notes: '',
        },
      });
    }

    setShowBookingModal(true);
  };

  // Handle Date change from inside the Booking Modal
  const handleDateChangeInForm = (newDate: string) => {
    if (!newDate) return;
    const oldDate = bookingForm.date || selectedDate;
    setBookingForm((prev) => ({ ...prev, date: newDate }));
    setSelectedDate(newDate);

    // If date changed, automatically shift travel buffer dates as well
    if (oldDate && oldDate !== newDate) {
      try {
        const oldTime = new Date(oldDate + 'T00:00:00').getTime();
        const newTime = new Date(newDate + 'T00:00:00').getTime();
        const diffDays = Math.round((newTime - oldTime) / (1000 * 60 * 60 * 24));

        if (Number.isFinite(diffDays) && diffDays !== 0) {
          setTravelBuffer((prev) => {
            const next = { ...prev };
            if (next.pre_event?.date) {
              const d = new Date(next.pre_event.date + 'T00:00:00');
              d.setDate(d.getDate() + diffDays);
              next.pre_event = { ...next.pre_event, date: toDateString(d) };
            }
            if (next.post_event?.date) {
              const d = new Date(next.post_event.date + 'T00:00:00');
              d.setDate(d.getDate() + diffDays);
              next.post_event = { ...next.post_event, date: toDateString(d) };
            }
            return next;
          });
        }
      } catch (e) { }
    }
  };

  // Open Travel Modal
  const openTravelModal = (preferredSlot: 'morning' | 'evening' | 'full_day' = 'morning') => {
    const existingTravel = selectedDayBookings.find(
      (b) => b.event_type === 'Travel' && (b.slot_type === preferredSlot || preferredSlot === 'full_day')
    );

    if (existingTravel) {
      const route = existingTravel.city !== 'In Transit' ? (existingTravel.city || '') : '';
      const routeParts = route ? route.split(/\s+to\s+|\s*→\s*|\s*-\s*/i) : [];
      const from = routeParts[0] || initialProfile?.city || '';
      const to = routeParts[1] || (routeParts.length === 1 ? routeParts[0] : '');

      // Parse hours e.g. from "(4.5 hours)"
      const hoursMatch = existingTravel.event_name?.match(/\((.*?)\)/)?.[1] || '';

      setTravelForm({
        slot_type: (existingTravel.slot_type as any) || preferredSlot,
        transport_mode: existingTravel.event_name?.split('·')[0]?.trim() || '✈️ Flight',
        from_city: from,
        to_city: to,
        travel_route: route,
        departure_time: '',
        arrival_time: '',
        travel_hours: hoursMatch || '3-4 hours',
        transit_number: '',
        notes: existingTravel.notes || '',
      });
    } else {
      setTravelForm({
        slot_type: preferredSlot,
        transport_mode: '✈️ Flight',
        from_city: initialProfile?.city || '',
        to_city: '',
        travel_route: '',
        departure_time: '',
        arrival_time: '',
        travel_hours: '3-4 hours',
        transit_number: '',
        notes: '',
      });
    }
    setShowTravelModal(true);
  };

  // Update Slot Status in Database (Radio selection behavior)
  const handleSlotAction = (slotType: SlotType, action: SlotStatus) => {
    if (!selectedDate) return;

    if (action === 'booked') {
      openBookingModal(slotType);
      return;
    }

    if (action === 'travel') {
      openTravelModal(slotType === 'full_day' ? 'full_day' : slotType);
      return;
    }

    const newStatus = action;

    // Optimistic UI update
    setSlots((prev) => {
      const updatedDay = { ...(prev[selectedDate] || {}) };
      updatedDay[slotType] = newStatus;
      return { ...prev, [selectedDate]: updatedDay };
    });

    startTransition(async () => {
      try {
        await upsertSlot(selectedDate, slotType, newStatus);
        success(
          `${slotType === 'morning' ? 'Morning' : slotType === 'evening' ? 'Evening' : 'Full Day'} set to ${newStatus.toUpperCase()
          }`
        );
      } catch (err) {
        showError('Failed to update slot in database');
      }
    });
  };

  // Save Booking in Database
  const handleBookingSave = () => {
    const targetSaveDate = bookingForm.date || selectedDate;
    if (!targetSaveDate) {
      showError('Please select an event date');
      return;
    }

    setSelectedDate(targetSaveDate);

    // Sync calendar view month/year if saved date is in a different month
    try {
      const savedDateObj = new Date(targetSaveDate + 'T00:00:00');
      if (!isNaN(savedDateObj.getTime())) {
        setCurrentMonth(savedDateObj.getMonth());
        setCurrentYear(savedDateObj.getFullYear());
      }
    } catch (e) { }

    const resolvedSlotStatus: SlotStatus = bookingForm.booking_status === 'tentative' ? 'tentative' : 'booked';

    // Strip temporary optimistic IDs so Postgres treats as insert/matches by date & slot
    const cleanId = bookingForm.id && !bookingForm.id.startsWith('temp-') && !bookingForm.id.startsWith('travel-')
      ? bookingForm.id
      : undefined;

    let finalNotes = bookingForm.notes || '';
    if (bookingForm.booking_status === 'tentative' && bookingForm.hold_duration && bookingForm.hold_duration !== 'none') {
      let expiryIso = bookingForm.hold_expiry;
      if (!expiryIso) {
        const now = new Date();
        const durationHours = bookingForm.hold_duration === '24h' ? 24 :
          bookingForm.hold_duration === '48h' ? 48 :
          bookingForm.hold_duration === '72h' ? 72 :
          bookingForm.hold_duration === '7d' ? 168 : 0;
        if (durationHours > 0) {
          expiryIso = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
        }
      }
      if (expiryIso) {
        finalNotes = finalNotes.replace(/\[HOLD_EXPIRY:\s*.*?\]\s*/g, '').trim();
        finalNotes = `${finalNotes ? finalNotes + '\n' : ''}[HOLD_EXPIRY: ${expiryIso}]`;
      } else {
        finalNotes = finalNotes.replace(/\[HOLD_EXPIRY:\s*.*?\]\s*/g, '').trim();
      }
    } else {
      finalNotes = finalNotes.replace(/\[HOLD_EXPIRY:\s*.*?\]\s*/g, '').trim();
    }

    const payload = {
      id: cleanId,
      old_date: bookingForm.original_date,
      old_slot_type: bookingForm.id ? activeSlotType : undefined,
      date: targetSaveDate,
      slot_type: activeSlotType,
      booking_status: bookingForm.booking_status || 'confirmed',
      event_type: bookingForm.event_type,
      event_name: bookingForm.event_name,
      event_time: bookingForm.event_time,
      city: bookingForm.city,
      venue: bookingForm.venue,
      client_name: bookingForm.client_name,
      client_phone: bookingForm.client_phone,
      amount: bookingForm.amount ? Number(bookingForm.amount) : undefined,
      notes: finalNotes,
      cue_notes: bookingForm.cue_notes,
      is_out_of_city: bookingForm.is_out_of_city,
      old_travel_buffer: travelBuffer,
      travel_buffer: bookingForm.is_out_of_city ? travelBuffer : undefined,
    };

    startTransition(async () => {
      try {
        const res = await saveBooking(payload);

        // Update slots state (including travel buffer slots)
        setSlots((prev) => {
          const updated = { ...prev };

          // If date changed from original_date, clean up old date slot
          if (bookingForm.original_date && bookingForm.original_date !== targetSaveDate && updated[bookingForm.original_date]) {
            const oldDay = { ...updated[bookingForm.original_date] };
            delete oldDay[activeSlotType];
            if (activeSlotType === 'full_day') {
              delete oldDay.morning;
              delete oldDay.evening;
              delete oldDay.full_day;
            }
            updated[bookingForm.original_date] = oldDay;
          }

          const updatedDay = { ...(updated[targetSaveDate] || {}) };
          if (activeSlotType === 'full_day') {
            updatedDay.morning = resolvedSlotStatus;
            updatedDay.evening = resolvedSlotStatus;
            updatedDay.full_day = resolvedSlotStatus;
          } else {
            updatedDay[activeSlotType] = resolvedSlotStatus;
          }
          updated[targetSaveDate] = updatedDay;

          // Optimistically update travel buffer slots on calendar
          if (bookingForm.is_out_of_city && travelBuffer) {
            if (travelBuffer.pre_event?.enabled && travelBuffer.pre_event.date) {
              const preDate = travelBuffer.pre_event.date;
              const preDay = { ...(updated[preDate] || {}) };
              if (travelBuffer.pre_event.slot_type === 'full_day') {
                preDay.morning = 'travel';
                preDay.evening = 'travel';
                preDay.full_day = 'travel';
              } else if (travelBuffer.pre_event.slot_type === 'evening') {
                preDay.evening = 'travel';
                if (preDay.full_day === 'travel') delete preDay.full_day;
                if (preDay.morning === 'travel') delete preDay.morning;
              } else if (travelBuffer.pre_event.slot_type === 'morning') {
                preDay.morning = 'travel';
                if (preDay.full_day === 'travel') delete preDay.full_day;
                if (preDay.evening === 'travel') delete preDay.evening;
              }
              updated[preDate] = preDay;
            }
            if (travelBuffer.post_event?.enabled && travelBuffer.post_event.date) {
              const postDate = travelBuffer.post_event.date;
              const postDay = { ...(updated[postDate] || {}) };
              if (travelBuffer.post_event.slot_type === 'full_day') {
                postDay.morning = 'travel';
                postDay.evening = 'travel';
                postDay.full_day = 'travel';
              } else if (travelBuffer.post_event.slot_type === 'evening') {
                postDay.evening = 'travel';
                if (postDay.full_day === 'travel') delete postDay.full_day;
                if (postDay.morning === 'travel') delete postDay.morning;
              } else if (travelBuffer.post_event.slot_type === 'morning') {
                postDay.morning = 'travel';
                if (postDay.full_day === 'travel') delete postDay.full_day;
                if (postDay.evening === 'travel') delete postDay.evening;
              }
              updated[postDate] = postDay;
            }
          } else if (!bookingForm.is_out_of_city) {
            // Clean up travel buffer slots if unchecked
            const datesToClean = [
              travelBuffer?.pre_event?.date,
              travelBuffer?.post_event?.date,
            ].filter(Boolean) as string[];

            if (datesToClean.length === 0 && targetSaveDate) {
              const d = new Date(targetSaveDate + 'T00:00:00');
              const prevD = new Date(d); prevD.setDate(prevD.getDate() - 1);
              const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
              datesToClean.push(toDateString(prevD), toDateString(nextD));
            }

            for (const dStr of datesToClean) {
              const hasOtherTravel = bookings.some((b) =>
                b.id !== cleanId &&
                ((b.event_type === 'Travel' && b.date === dStr) ||
                 (b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === dStr) ||
                 (b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === dStr))
              );

              if (!hasOtherTravel && updated[dStr]) {
                const daySlots = { ...updated[dStr] };
                if (daySlots.morning === 'travel') delete daySlots.morning;
                if (daySlots.evening === 'travel') delete daySlots.evening;
                if (daySlots.full_day === 'travel') delete daySlots.full_day;
                updated[dStr] = daySlots;
              }
            }
          }

          return updated;
        });

        // Update bookings state: Single unified entry with embedded travel itinerary
        setBookings((prev) => {
          const preDate = travelBuffer?.pre_event?.date;
          const postDate = travelBuffer?.post_event?.date;
          const filtered = prev.filter(
            (b) => {
              if (cleanId && b.id === cleanId) return false;
              if (bookingForm.original_date && b.date === bookingForm.original_date && b.slot_type === activeSlotType) return false;
              if (b.date === targetSaveDate && (b.slot_type === activeSlotType || (activeSlotType === 'full_day' && (b.slot_type === 'morning' || b.slot_type === 'evening')))) {
                return false;
              }
              // Remove any legacy standalone travel entries on the buffer dates
              if (b.event_type === 'Travel' && (b.date === preDate || b.date === postDate)) {
                return false;
              }
              return true;
            }
          );

          const unifiedEntry: BookingRecord = {
            id: res?.bookingId || cleanId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'bk-' + Date.now()),
            date: targetSaveDate,
            slot_type: activeSlotType,
            booking_status: payload.booking_status as 'confirmed' | 'tentative',
            event_type: payload.event_type,
            event_name: payload.event_name,
            event_time: payload.event_time,
            city: payload.city,
            venue: payload.venue,
            client_name: payload.client_name,
            client_phone: payload.client_phone,
            amount: payload.amount,
            notes: payload.notes,
            cue_notes: payload.cue_notes,
            is_out_of_city: payload.is_out_of_city,
            travel_itinerary: bookingForm.is_out_of_city ? travelBuffer : undefined,
          };

          return [...filtered, unifiedEntry];
        });

        setShowBookingModal(false);
        success(
          bookingForm.is_out_of_city
            ? `Booking and travel buffer days saved live on your calendar!`
            : `${activeSlotType === 'morning' ? 'Morning' : activeSlotType === 'evening' ? 'Evening' : 'Full Day'} booking saved! Marked live on your calendar.`
        );
      } catch (err: any) {
        showError(err?.message || 'Failed to save booking');
      }
    });
  };

  // 1-Tap Convert Pencil Hold to Confirmed Show
  const handleConfirmHold = (b: BookingRecord) => {
    startTransition(async () => {
      try {
        const cleanId = b.id && !b.id.startsWith('temp-') && !b.id.startsWith('travel-') ? b.id : undefined;
        const payload = {
          id: cleanId,
          date: b.date,
          slot_type: b.slot_type as SlotType,
          booking_status: 'confirmed' as const,
          event_type: b.event_type,
          event_name: b.event_name,
          city: b.city,
          venue: b.venue,
          client_name: b.client_name,
          client_phone: b.client_phone,
          amount: b.amount,
          notes: (b.notes || '')
            .replace(/^\[PENCIL_HOLD\]\s*/, '')
            .replace(/\[HOLD_EXPIRY:\s*.*?\]\s*/g, '')
            .trim(),
          cue_notes: b.cue_notes,
          is_out_of_city: b.is_out_of_city,
        };
        await saveBooking(payload);

        // Update slots state
        setSlots((prev) => {
          const updatedDay = { ...(prev[b.date] || {}) };
          if (b.slot_type === 'full_day') {
            updatedDay.morning = 'booked';
            updatedDay.evening = 'booked';
            updatedDay.full_day = 'booked';
          } else {
            updatedDay[b.slot_type as SlotType] = 'booked';
          }
          return { ...prev, [b.date]: updatedDay };
        });

        // Update bookings state
        setBookings((prev) =>
          prev.map((item) =>
            item.id === b.id
              ? { ...item, booking_status: 'confirmed' }
              : item
          )
        );

        success(`🎉 Pencil Hold for "${b.event_name || 'Event'}" is now LOCKED as a Confirmed Show!`);
      } catch (err: any) {
        showError(err?.message || 'Failed to confirm booking');
      }
    });
  };

  // 1-Tap Request Client Review on WhatsApp
  const handleRequestReview = (clientPhone?: string, clientName?: string) => {
    let cleanPhone = (clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.replace(/^0+/, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    const slug = initialProfile?.slug || 'anchor';
    const name = clientName ? `Hi ${clientName}!` : 'Hi!';
    const message = `${name} Thank you so much for having me host your event! It was an absolute pleasure bringing energy to the stage. 🎉\n\nCould you please take 20 seconds to share your quick rating & review on my official StageHost page? It means a lot to an independent artist:\n👉 https://stagehost.in/${slug}?action=review\n\nLooking forward to hosting your next big celebration! ✨`;

    if (cleanPhone && cleanPhone.length >= 10) {
      window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // Handle updates made directly from the Token Slip / Receipt Modal
  const handleReceiptUpdateBooking = async (updatedData: {
    client_name?: string;
    client_phone?: string;
    client_email?: string;
    event_name?: string;
    venue?: string;
    city?: string;
    amount?: number | null;
    advance_paid?: number;
    payment_mode?: string;
    receipt_config?: {
      service_title?: string;
      service_description?: string;
      terms_title?: string;
      terms_and_conditions?: string;
    };
    notes?: string;
  }) => {
    if (!receiptBooking) return;

    const cleanId = receiptBooking.id && !receiptBooking.id.startsWith('temp-') && !receiptBooking.id.startsWith('travel-')
      ? receiptBooking.id
      : undefined;

    let rawNotes = updatedData.notes !== undefined ? updatedData.notes : (receiptBooking.notes || '');
    if (updatedData.receipt_config || updatedData.advance_paid !== undefined || updatedData.payment_mode) {
      const parts = rawNotes.split(/---RECEIPT_CONFIG---\n?/);
      rawNotes = parts[0]?.trim() || '';
      rawNotes = rawNotes.replace(/\[TOKEN_ADVANCE:.*?\]\s*/g, '').trim();

      const configObj = {
        advance_paid: updatedData.advance_paid,
        payment_mode: updatedData.payment_mode,
        ...(updatedData.receipt_config || {}),
      };

      rawNotes = `${rawNotes}\n---RECEIPT_CONFIG---\n${JSON.stringify(configObj)}`.trim();
    }

    const payload = {
      id: cleanId,
      date: receiptBooking.date,
      slot_type: receiptBooking.slot_type as SlotType,
      booking_status: (receiptBooking.booking_status || 'confirmed') as 'confirmed' | 'tentative',
      event_type: receiptBooking.event_type,
      event_name: updatedData.event_name !== undefined ? updatedData.event_name : receiptBooking.event_name,
      event_time: receiptBooking.event_time,
      city: updatedData.city !== undefined ? updatedData.city : receiptBooking.city,
      venue: updatedData.venue !== undefined ? updatedData.venue : receiptBooking.venue,
      client_name: updatedData.client_name !== undefined ? updatedData.client_name : receiptBooking.client_name,
      client_phone: updatedData.client_phone !== undefined ? updatedData.client_phone : receiptBooking.client_phone,
      client_email: updatedData.client_email !== undefined ? updatedData.client_email : receiptBooking.client_email,
      amount: updatedData.amount !== undefined ? (updatedData.amount ? Number(updatedData.amount) : undefined) : receiptBooking.amount,
      notes: rawNotes,
      cue_notes: receiptBooking.cue_notes,
      is_out_of_city: receiptBooking.is_out_of_city,
      travel_buffer: receiptBooking.travel_itinerary,
    };

    const res = await saveBooking(payload);
    if (!res?.success) {
      throw new Error((res as any)?.error || 'Failed to update receipt details');
    }

    const merged: BookingRecord = {
      ...receiptBooking,
      ...payload,
      id: res.bookingId || receiptBooking.id,
      notes: rawNotes,
    };

    setBookings((prev) => prev.map((b) => (b.id === receiptBooking.id || (b.date === receiptBooking.date && b.slot_type === receiptBooking.slot_type) ? merged : b)));
    setReceiptBooking(merged);
    success('Receipt details updated live on your calendar and database!');
  };

  const handleOpenFullEditFromReceipt = (booking: any) => {
    setReceiptBooking(null);
    setSelectedDate(booking.date);
    openBookingModal(booking.slot_type as SlotType, booking, booking.date);
  };

  // Save Travel Hours & Route
  const handleTravelSave = () => {
    if (!selectedDate) return;

    // Calculate effective route if from_city and to_city are provided
    const route = travelForm.travel_route.trim() || (
      travelForm.from_city.trim() && travelForm.to_city.trim()
        ? `${travelForm.from_city.trim()} to ${travelForm.to_city.trim()}`
        : travelForm.to_city.trim() || travelForm.from_city.trim()
    );

    const timingStr = (travelForm.departure_time || travelForm.arrival_time)
      ? `${travelForm.departure_time || ''}${travelForm.departure_time && travelForm.arrival_time ? ' – ' : ''}${travelForm.arrival_time || ''}`
      : '';

    const effectiveTitle = `${travelForm.transport_mode || 'Travel'}${route ? ` · ${route}` : ''}${travelForm.travel_hours ? ` (${travelForm.travel_hours})` : timingStr ? ` (${timingStr})` : ''}`;

    startTransition(async () => {
      try {
        await setTravelSlot({
          date: selectedDate,
          slot_type: travelForm.slot_type,
          travel_hours: travelForm.travel_hours,
          travel_route: route,
          transport_mode: travelForm.transport_mode,
          departure_time: travelForm.departure_time,
          arrival_time: travelForm.arrival_time,
          transit_number: travelForm.transit_number,
          notes: travelForm.notes,
        });

        // Update local slots state
        setSlots((prev) => {
          const updated = { ...(prev[selectedDate] || {}) };
          updated[travelForm.slot_type] = 'travel';
          if (travelForm.slot_type === 'morning' && !updated.evening) {
            updated.evening = 'available';
          } else if (travelForm.slot_type === 'evening' && !updated.morning) {
            updated.morning = 'available';
          }
          return { ...prev, [selectedDate]: updated };
        });

        // Build comprehensive notes string for local state
        const noteParts: string[] = [];
        if (travelForm.transport_mode) noteParts.push(`Mode: ${travelForm.transport_mode}`);
        if (travelForm.transit_number) noteParts.push(`Carrier/Vehicle: ${travelForm.transit_number}`);
        if (timingStr) noteParts.push(`Timing: ${timingStr}`);
        if (travelForm.travel_hours) noteParts.push(`Duration: ${travelForm.travel_hours}`);
        if (travelForm.notes) noteParts.push(travelForm.notes.trim());
        const combinedNotes = noteParts.join(' | ');

        // Update bookings state for travel
        setBookings((prev) => [
          ...prev.filter(
            (b) => !(b.date === selectedDate && b.slot_type === travelForm.slot_type)
          ),
          {
            id: 'travel-' + Date.now(),
            date: selectedDate,
            slot_type: travelForm.slot_type,
            event_type: 'Travel',
            event_name: effectiveTitle,
            city: route || 'In Transit',
            notes: combinedNotes,
          },
        ]);

        setShowTravelModal(false);
        success(
          travelForm.slot_type === 'full_day'
            ? 'Full day travel marked.'
            : `${travelForm.slot_type === 'morning' ? 'Morning' : 'Evening'} travel set (${travelForm.travel_hours || 'scheduled'}). Remaining slot is available!`
        );
      } catch (err) {
        showError('Failed to set travel time');
      }
    });
  };

  // Delete Confirmed Booking
  const handleConfirmDeleteBooking = () => {
    if (!deletingBooking) return;
    const b = deletingBooking;

    startTransition(async () => {
      try {
        await deleteBooking(b.id);

        // Update state
        setBookings((prev) => prev.filter((item) => item.id !== b.id));
        setSlots((prev) => {
          const updated = { ...prev };
          const day = { ...(updated[b.date] || {}) };
          const type = b.slot_type as keyof DaySlots;
          delete day[type];
          if (type === 'full_day') {
            delete day.morning;
            delete day.evening;
          }
          updated[b.date] = day;

          if (b.travel_itinerary) {
            const preDate = b.travel_itinerary.pre_event?.date;
            if (preDate && updated[preDate]) {
              const preDay = { ...updated[preDate] };
              delete preDay.morning;
              delete preDay.evening;
              delete preDay.full_day;
              updated[preDate] = preDay;
            }
            const postDate = b.travel_itinerary.post_event?.date;
            if (postDate && updated[postDate]) {
              const postDay = { ...updated[postDate] };
              delete postDay.morning;
              delete postDay.evening;
              delete postDay.full_day;
              updated[postDate] = postDay;
            }
          }

          return updated;
        });

        success(`Booking for ${b.slot_type === 'full_day' ? 'full day' : b.slot_type} function removed.`);
        setDeletingBooking(null);
      } catch (err) {
        showError('Failed to delete booking');
      }
    });
  };

  const getDayStatus = (day: number): DaySlots | undefined => {
    const dateStr = toDateString(new Date(currentYear, currentMonth, day));
    return slots[dateStr];
  };

  const getDayBookings = (dateStr: string) => {
    return bookings.filter((b) => {
      if (b.date === dateStr) return true;
      if (b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === dateStr) return true;
      if (b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === dateStr) return true;
      return false;
    });
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate < todayStart;
  };

  // Selected date details
  const selectedSlots = selectedDate ? slots[selectedDate] : undefined;
  const selectedDayBookings = selectedDate ? getDayBookings(selectedDate) : [];
  // Shows strictly taking place on this date
  const selectedDayShows = selectedDate
    ? bookings.filter((b) => b.date === selectedDate && b.event_type !== 'Travel')
    : [];
  const morningBooking = selectedDayShows.find((b) => b.slot_type === 'morning');
  const eveningBooking = selectedDayShows.find((b) => b.slot_type === 'evening');
  const fullDayBooking = selectedDayShows.find((b) => b.slot_type === 'full_day');

  // Travel itineraries that have transit scheduled on this date
  const selectedDayTravelItineraries = selectedDate
    ? bookings
        .filter(
          (b) =>
            (b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === selectedDate) ||
            (b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === selectedDate)
        )
        .map((b) => {
          const isPre = b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === selectedDate;
          const travelConfig = isPre ? b.travel_itinerary.pre_event : b.travel_itinerary.post_event;
          return {
            isPre,
            parentBooking: b,
            travelConfig,
          };
        })
    : [];

  const selectedStandaloneTravel = selectedDate
    ? bookings.find((b) => b.date === selectedDate && b.event_type === 'Travel')
    : undefined;

  const hasSelectedPreMorn = selectedDayTravelItineraries.some((t) => t.isPre && t.travelConfig?.slot_type === 'morning');
  const hasSelectedPreEve = selectedDayTravelItineraries.some((t) => t.isPre && t.travelConfig?.slot_type === 'evening');
  const hasSelectedPreFull = selectedDayTravelItineraries.some((t) => t.isPre && t.travelConfig?.slot_type === 'full_day');

  const hasSelectedPostMorn = selectedDayTravelItineraries.some((t) => !t.isPre && t.travelConfig?.slot_type === 'morning');
  const hasSelectedPostEve = selectedDayTravelItineraries.some((t) => !t.isPre && t.travelConfig?.slot_type === 'evening');
  const hasSelectedPostFull = selectedDayTravelItineraries.some((t) => !t.isPre && t.travelConfig?.slot_type === 'full_day');

  const hasSelectedAnyFull = hasSelectedPreFull || hasSelectedPostFull;
  const hasSelectedAnyMorn = hasSelectedPreMorn || hasSelectedPostMorn;
  const hasSelectedAnyEve = hasSelectedPreEve || hasSelectedPostEve;

  const isFullDayTravel = hasSelectedAnyFull ||
    (hasSelectedAnyMorn && hasSelectedAnyEve) ||
    (selectedSlots?.morning === 'travel' && selectedSlots?.evening === 'travel') ||
    (!hasSelectedAnyMorn && !hasSelectedAnyEve && selectedSlots?.full_day === 'travel') ||
    !!selectedStandaloneTravel;

  const isMorningTravel = !isFullDayTravel && (hasSelectedAnyMorn || selectedSlots?.morning === 'travel');
  const isEveningTravel = !isFullDayTravel && (hasSelectedAnyEve || selectedSlots?.evening === 'travel');

  const isFullDayTentative =
    selectedSlots?.full_day === 'tentative' ||
    (!!fullDayBooking && isBookingTentative(fullDayBooking));

  const isMorningTentative =
    !isFullDayTentative &&
    (selectedSlots?.morning === 'tentative' ||
      (!!morningBooking && isBookingTentative(morningBooking)));

  const isEveningTentative =
    !isFullDayTentative &&
    (selectedSlots?.evening === 'tentative' ||
      (!!eveningBooking && isBookingTentative(eveningBooking)));

  const hasTentativeHold = isFullDayTentative || isMorningTentative || isEveningTentative;

  const isFullDayBooked =
    !isFullDayTentative &&
    !isFullDayTravel &&
    (selectedSlots?.full_day === 'booked' || (!!fullDayBooking && !isBookingTentative(fullDayBooking)));

  const isMorningBooked =
    !isFullDayTentative &&
    !isMorningTentative &&
    !isMorningTravel &&
    !isFullDayTravel &&
    (selectedSlots?.morning === 'booked' || isFullDayBooked || (!!morningBooking && !isBookingTentative(morningBooking)));

  const isEveningBooked =
    !isFullDayTentative &&
    !isEveningTentative &&
    !isEveningTravel &&
    !isFullDayTravel &&
    (selectedSlots?.evening === 'booked' || isFullDayBooked || (!!eveningBooking && !isBookingTentative(eveningBooking)));

  return (
    <div>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.pageTitle}>Tour & Availability</h1>
            <span className={styles.liveIndicatorBadge}>
              <span className={styles.livePulseDot} />
              Live Sync
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Manage dates, travel buffers, and live public booking slots.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Dedicated prominent "View Portfolio" button - ALWAYS visible! */}
          <Link
            href={`/${initialProfile?.slug || 'anchor'}`}
            target="_blank"
            className={styles.portfolioBtn}
            title="View your live public portfolio in a new tab"
          >
            <Eye size={14} />
            <span>View Portfolio</span>
            <ExternalLink size={12} style={{ opacity: 0.8 }} />
          </Link>

          {/* Primary Action Button */}
          <button
            type="button"
            className={styles.addBookingBtn}
            onClick={() => openBookingModal(isMorningBooked && !isEveningBooked ? 'evening' : 'morning')}
          >
            <Plus size={15} />
            <span>Add Booking</span>
          </button>

          {/* Unified Secondary Utility Toolbar */}
          <div className={styles.secondaryToolbar}>
            <button
              type="button"
              onClick={() => setShowImportExportModal(true)}
              className={styles.toolbarBtn}
              title="Import or Export shows (Excel/CSV)"
            >
              <FileSpreadsheet size={13} style={{ color: '#818CF8' }} />
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className={styles.toolbarBtn}
              title="Sync with Google Calendar or Apple Calendar (.ics)"
            >
              <Calendar size={13} style={{ color: '#34D399' }} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Public Portfolio Sync Bar */}
      <div className={styles.compactLiveBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              background: showCalendar ? '#10B981' : 'var(--color-text-tertiary)',
              boxShadow: showCalendar ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
            }}
          />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Public Calendar:
          </span>
          <span
            className={`badge badge-${showCalendar ? 'success' : 'ghost'}`}
            style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 600 }}
          >
            {showCalendar ? 'Live on Portfolio' : 'Hidden from Visitors'}
          </span>
          <Link
            href={`/${initialProfile?.slug || 'anchor'}`}
            target="_blank"
            style={{
              fontSize: '11.5px',
              color: 'var(--color-primary-light, #A5B4FC)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              marginLeft: '4px',
            }}
          >
            Preview ↗
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            role="switch"
            aria-checked={showCalendar}
            className={cn('toggle', showCalendar && 'active')}
            onClick={handleToggleVisibility}
            disabled={isPending}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            title={showCalendar ? 'Click to hide calendar from public portfolio' : 'Click to show calendar on public portfolio'}
          >
            <input
              type="checkbox"
              checked={showCalendar}
              readOnly
              tabIndex={-1}
            />
            <span className="toggle-slider" />
          </button>
        </div>
      </div>

      {/* Active Pencil Holds Alert Banner */}
      {expiringHolds.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>
                {expiringHolds.length} Active Pencil Hold{expiringHolds.length > 1 ? 's' : ''} in Pipeline
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Next due:{' '}
                <strong>{expiringHolds[0].booking.client_name || 'Client'}</strong> (
                {new Date(expiringHolds[0].booking.date + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
                ) —{' '}
                <span style={{ color: expiringHolds[0].isExpired ? '#F87171' : '#FCD34D', fontWeight: 700 }}>
                  {expiringHolds[0].label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {expiringHolds[0].booking.client_phone && (
              <a
                href={`https://wa.me/${expiringHolds[0].booking.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  generateHoldNudgeMessage(expiringHolds[0].booking, initialProfile?.name || 'Artist')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{
                  background: '#F59E0B',
                  borderColor: '#F59E0B',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '5px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>⚡ Nudge via WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHoldsModal(true)}
              style={{ fontSize: '11px', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}
            >
              View Holds ({expiringHolds.length})
            </button>
          </div>
        </div>
      )}

      {/* Primary View Switcher: Calendar vs Bookings Pipeline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '3px',
            width: '100%',
            maxWidth: '520px',
          }}
        >
          <button
            type="button"
            onClick={() => handleSetMainView('calendar')}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: mainView === 'calendar' ? 700 : 500,
              borderRadius: '7px',
              border: 'none',
              background: mainView === 'calendar' ? 'var(--color-primary)' : 'transparent',
              color: mainView === 'calendar' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Calendar size={13} />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetMainView('pipeline')}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: mainView === 'pipeline' ? 700 : 500,
              borderRadius: '7px',
              border: 'none',
              background: mainView === 'pipeline' ? 'var(--color-primary)' : 'transparent',
              color: mainView === 'pipeline' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <List size={13} />
            <span>Pipeline ({displayBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetMainView('all')}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: mainView === 'all' ? 700 : 500,
              borderRadius: '7px',
              border: 'none',
              background: mainView === 'all' ? 'var(--color-primary)' : 'transparent',
              color: mainView === 'all' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Layers size={13} />
            <span>All-in-One</span>
          </button>
        </div>

        <div style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {mainView === 'pipeline' && (
            <span style={{ color: '#818CF8', fontWeight: 600 }}>⚡ 1-Screen Compact Pipeline View Active</span>
          )}
          {mainView === 'calendar' && (
            <span style={{ color: '#A78BFA' }}>📅 Month Calendar & Day Detail View Active</span>
          )}
          {mainView === 'all' && (
            <span>↕️ Full scrollable combined view</span>
          )}
        </div>
      </div>

      {/* Calendar Grid & Detail Panel */}
      {(mainView === 'calendar' || mainView === 'all') && (
        <>
          {/* Legend */}
          <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#EF4444' }} />
          Booked Show
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
          Pencil Hold (Tentative)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
          Travel Day / Transit
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-text-tertiary)' }} />
          Personal / Blocked
        </div>
        <div className={styles.legendItem} style={{ color: 'var(--color-text-tertiary)' }}>
          (Unmarked dates are completely open)
        </div>
      </div>

      {/* Calendar Grid & Detail Panel */}
      <div className={styles.calendarLayout}>
        {/* Calendar Card */}
        <div className={styles.calendar}>
          {/* Header Month & Year Nav with Interactive Selector */}
          <div className={styles.calendarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                onClick={goToPreviousMonth}
                title="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                  className={styles.monthSelect}
                  aria-label="Select month"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                  className={styles.yearSelect}
                  aria-label="Select year"
                >
                  {[2025, 2026, 2027, 2028, 2029].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonth(now.getMonth());
                    setCurrentYear(now.getFullYear());
                    setSelectedDate(toDateString(now));
                  }}
                  className="btn btn-ghost btn-xs"
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(108, 92, 231, 0.3)',
                    background: 'rgba(108, 92, 231, 0.08)',
                    fontWeight: 600,
                  }}
                  title="Jump to today"
                >
                  Today
                </button>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                onClick={goToNextMonth}
                title="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className={styles.weekdays}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={styles.weekday}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.dayEmpty} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateString(new Date(currentYear, currentMonth, day));
              const daySlots = getDayStatus(day);
              const past = isPastDate(day);
              const dayBookings = getDayBookings(dateStr);
              const isCurrentToday = isToday(day);

              const morningBooking = dayBookings.find((b) => b.slot_type === 'morning' && b.date === dateStr);
              const eveningBooking = dayBookings.find((b) => b.slot_type === 'evening' && b.date === dateStr);
              const fullBooking = dayBookings.find((b) => b.slot_type === 'full_day' && b.date === dateStr);
              const eventCity = (fullBooking || morningBooking || eveningBooking)?.city || '';
              const travelBooking = dayBookings.find((b) => b.event_type === 'Travel');
              const travelCity = travelBooking?.city && travelBooking.city !== 'In Transit' ? travelBooking.city : '';

              // Explicit travel detection from booking itineraries attached to this date
              const hasExplicitPreMornTravel = dayBookings.some((b) => b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === dateStr && b.travel_itinerary.pre_event.slot_type === 'morning');
              const hasExplicitPreEveTravel = dayBookings.some((b) => b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === dateStr && b.travel_itinerary.pre_event.slot_type === 'evening');
              const hasExplicitPreFullTravel = dayBookings.some((b) => b.travel_itinerary?.pre_event?.enabled && b.travel_itinerary.pre_event.date === dateStr && b.travel_itinerary.pre_event.slot_type === 'full_day');

              const hasExplicitPostMornTravel = dayBookings.some((b) => b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === dateStr && b.travel_itinerary.post_event.slot_type === 'morning');
              const hasExplicitPostEveTravel = dayBookings.some((b) => b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === dateStr && b.travel_itinerary.post_event.slot_type === 'evening');
              const hasExplicitPostFullTravel = dayBookings.some((b) => b.travel_itinerary?.post_event?.enabled && b.travel_itinerary.post_event.date === dateStr && b.travel_itinerary.post_event.slot_type === 'full_day');

              const hasAnyExplicitFullTravel = hasExplicitPreFullTravel || hasExplicitPostFullTravel;
              const hasAnyExplicitMornTravel = hasExplicitPreMornTravel || hasExplicitPostMornTravel;
              const hasAnyExplicitEveTravel = hasExplicitPreEveTravel || hasExplicitPostEveTravel;

              // Full travel detection: only if explicit full travel, or both slots travel, or full_day slot is travel when no partial travel is declared
              const isFullTravel = hasAnyExplicitFullTravel ||
                (hasAnyExplicitMornTravel && hasAnyExplicitEveTravel) ||
                (daySlots?.morning === 'travel' && daySlots?.evening === 'travel') ||
                (!hasAnyExplicitMornTravel && !hasAnyExplicitEveTravel && daySlots?.full_day === 'travel');

              const isMornTravel = !isFullTravel && (hasAnyExplicitMornTravel || daySlots?.morning === 'travel');
              const isEveTravel = !isFullTravel && (hasAnyExplicitEveTravel || daySlots?.evening === 'travel');

              // Bookings confirmed detection
              const mBooked = (daySlots?.morning === 'booked' || (!!morningBooking && !isBookingTentative(morningBooking))) && !isMornTravel;
              const eBooked = (daySlots?.evening === 'booked' || (!!eveningBooking && !isBookingTentative(eveningBooking))) && !isEveTravel;
              const isFullDayBkd = !isFullTravel && (daySlots?.full_day === 'booked' || (!!fullBooking && !isBookingTentative(fullBooking)) || (mBooked && eBooked));
              
              // 2 Shows should ONLY show if there are genuinely 2 separate bookings and NOT a single full day show
              const isTwoSeparateShows = !fullBooking && daySlots?.full_day !== 'booked' && (
                (!!morningBooking && !!eveningBooking && morningBooking.id !== eveningBooking.id) ||
                (dayBookings.filter((b) => b.event_type !== 'Travel' && !isBookingTentative(b)).length >= 2)
              );

              // Tentative detection
              const isMornTentative = daySlots?.morning === 'tentative' || (!!morningBooking && isBookingTentative(morningBooking));
              const isEveTentative = daySlots?.evening === 'tentative' || (!!eveningBooking && isBookingTentative(eveningBooking));
              const isFullTentative = daySlots?.full_day === 'tentative' || (!!fullBooking && isBookingTentative(fullBooking));
              const hasTentative = !isFullDayBkd && !isFullTravel && (isFullTentative || isMornTentative || isEveTentative);

              // Blocked detection
              const isMornBlocked = daySlots?.morning === 'blocked';
              const isEveBlocked = daySlots?.evening === 'blocked';
              const isFullBlocked = daySlots?.full_day === 'blocked' || (isMornBlocked && isEveBlocked);

              // Partial availability
              const isOnlyEveAvailable = !past && mBooked && !eBooked && !isEveTravel && !isFullTravel && !isEveBlocked;
              const isOnlyMornAvailable = !past && eBooked && !mBooked && !isMornTravel && !isFullTravel && !isMornBlocked;
              const isEveAvailableWithMornTravel = !past && isMornTravel && !eBooked && !isEveTravel && !isFullTravel && !isEveBlocked;
              const isMornAvailableWithEveTravel = !past && isEveTravel && !mBooked && !isMornTravel && !isFullTravel && !isMornBlocked;

              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={past ? -1 : 0}
                  className={cn(
                    styles.dayCell,
                    isCurrentToday && styles.today,
                    selectedDate === dateStr && styles.selected,
                    past && styles.past,
                    isFullDayBkd && styles.dayCellBooked,
                    isFullTravel && styles.dayCellTravel,
                    hasTentative && styles.dayCellHold
                  )}
                  onClick={() => !past && handleDateClick(day)}
                  onDoubleClick={() => !past && handleDateDoubleClick(day)}
                  onKeyDown={(e) => {
                    if (!past && (e.key === 'Enter' || e.key === ' ')) {
                      handleDateClick(day);
                    }
                  }}
                  title={
                    past
                      ? 'Past date'
                      : isFullTravel
                        ? 'Blocked for Travel / Transit'
                        : isFullDayBkd
                          ? `Booked (${(fullBooking || morningBooking || eveningBooking)?.event_name || 'Show'})`
                          : hasTentative
                            ? 'Pencil Hold (Tentative Booking)'
                            : isOnlyEveAvailable
                              ? 'Morning booked · Evening available'
                              : isOnlyMornAvailable
                                ? 'Evening booked · Morning available'
                                : isEveAvailableWithMornTravel
                                  ? 'Morning transit · Evening available'
                                  : isMornAvailableWithEveTravel
                                    ? 'Morning available · Evening transit'
                                    : isFullBlocked
                                      ? 'Blocked / Personal'
                                      : selectedDate === dateStr
                                        ? 'Selected date'
                                        : 'Available'
                  }
                >
                  <div className={styles.dayCellHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className={styles.dayNumber}>{day}</span>
                      {isCurrentToday && (
                        <span className={styles.todayTag}>
                          TODAY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.dayBadgeWrapper}>
                    {isFullTravel ? (
                      <>
                        <span className={cn(styles.dayBadge, styles.badgeTravel)}>
                          <Plane size={10} /> Travel
                        </span>
                        {travelCity && (
                          <span className={styles.dayCityText}>{travelCity}</span>
                        )}
                      </>
                    ) : isTwoSeparateShows ? (
                      <>
                        <span className={cn(styles.dayBadge, styles.badgeBooked)}>
                          🔴 2 Shows
                        </span>
                        {eventCity && (
                          <span className={styles.dayCityText}>{eventCity}</span>
                        )}
                      </>
                    ) : isFullDayBkd ? (
                      <>
                        <span className={cn(styles.dayBadge, styles.badgeBooked)}>
                          🔴 Booked
                        </span>
                        {eventCity && (
                          <span className={styles.dayCityText}>{eventCity}</span>
                        )}
                      </>
                    ) : hasTentative ? (
                      <>
                        <span className={cn(styles.dayBadge, styles.badgeHold)}>
                          ⚡ Hold
                        </span>
                        {eventCity && (
                          <span className={styles.dayCityText}>{eventCity}</span>
                        )}
                      </>
                    ) : isFullBlocked ? (
                      <span className={cn(styles.dayBadge, styles.badgeBlocked)}>
                        🔒 Blocked
                      </span>
                    ) : isEveAvailableWithMornTravel ? (
                      <span
                        className={cn(styles.dayBadge, styles.badgeTravel)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <Plane size={9} /> Morn Travel
                      </span>
                    ) : isMornAvailableWithEveTravel ? (
                      <span
                        className={cn(styles.dayBadge, styles.badgeTravel)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <Plane size={9} /> Eve Travel
                      </span>
                    ) : isOnlyEveAvailable ? (
                      <>
                        <span
                          className={cn(styles.dayBadge, styles.badgeBooked)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          🔴 Morn Show
                        </span>
                        {morningBooking?.city && (
                          <span className={styles.dayCityText}>{morningBooking.city}</span>
                        )}
                      </>
                    ) : isOnlyMornAvailable ? (
                      <>
                        <span
                          className={cn(styles.dayBadge, styles.badgeBooked)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          🔴 Eve Show
                        </span>
                        {eveningBooking?.city && (
                          <span className={styles.dayCityText}>{eveningBooking.city}</span>
                        )}
                      </>
                    ) : past ? (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', paddingLeft: '2px' }}>—</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel & Mobile Bottom Sheet */}
        <div className={cn(styles.dayPanel, selectedDate && styles.dayPanelOpen)}>
          {selectedDate ? (
            <div className={styles.dayTimelineContainer}>
              {/* Mobile Drawer drag handle */}
              <div className={styles.mobileDrawerHandle} />

              {/* Day Header */}
              <div className={styles.dayPanelHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </h3>
                    {isToday(parseInt(selectedDate.split('-')[2], 10)) &&
                      currentMonth === new Date(selectedDate + 'T00:00:00').getMonth() &&
                      currentYear === new Date(selectedDate + 'T00:00:00').getFullYear() && (
                        <span className={styles.todayTag}>TODAY</span>
                      )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                    {selectedDayShows.length > 0
                      ? `${selectedDayShows.length} ${
                          selectedDayShows.length === 1
                            ? 'Show / Event'
                            : 'Shows'
                        } Scheduled`
                      : isFullDayTravel
                        ? '✈️ In Transit / Travel Day (Full Day)'
                        : isEveningTravel
                          ? '✈️ Evening Transit · Morning Available'
                          : isMorningTravel
                            ? '✈️ Morning Transit · Evening Available'
                            : selectedSlots?.full_day === 'blocked'
                              ? '🔒 Personal Day Off (Blocked)'
                              : '✨ Free Date · Open for Shows'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => openBookingModal('full_day')}
                    title="Add show for this date"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} />
                    <span>Add Show</span>
                  </button>
                  <button
                    type="button"
                    className={styles.mobileCloseBtn}
                    onClick={() => setSelectedDate(null)}
                    aria-label="Close day panel"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Day Events & Timeline Body */}
              <div className={styles.dayEventsList}>
                {/* 1. Travel Notice Cards for attached itineraries */}
                {selectedDayTravelItineraries.map((itin, idx) => {
                  const isPre = itin.isPre;
                  const cfg = itin.travelConfig;
                  const parent = itin.parentBooking;
                  const slotLabel = cfg?.slot_type === 'morning' ? 'Morning Slot' : cfg?.slot_type === 'evening' ? 'Evening Slot' : 'Full Day';
                  return (
                    <div key={`transit-${idx}`} className={styles.travelNoticeCard}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <Plane size={16} color="#38BDF8" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#E0F2FE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{isPre ? '✈️ Departure Travel' : '✈️ Return Journey'}</span>
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8' }}>
                                {slotLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#BAE6FD', marginTop: '3px' }}>
                              For: <strong>{parent.event_name || 'Show'}</strong> ({parent.date})
                            </div>
                            {(cfg?.from_city || cfg?.to_city) && (
                              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                                📍 {cfg?.from_city || 'Base'} ➔ {cfg?.to_city || parent.city || 'Venue'}
                                {cfg?.transport_mode ? ` · ${cfg.transport_mode}` : ''}
                                {cfg?.travel_time ? ` (${cfg.travel_time})` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => openBookingModal(parent.slot_type as SlotType, parent, parent.date)}
                          style={{ color: '#38BDF8', fontSize: '11px', padding: '2px 8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Standalone Travel Notice Card if exists */}
                {selectedStandaloneTravel && (
                  <div className={styles.travelNoticeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plane size={16} color="#38BDF8" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#E0F2FE' }}>
                            {selectedStandaloneTravel.event_name || 'Travel Day / In Transit'}
                          </div>
                          {selectedStandaloneTravel.city && (
                            <div style={{ fontSize: '11px', color: '#BAE6FD', marginTop: '2px' }}>
                              📍 {selectedStandaloneTravel.city}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => openTravelModal('full_day')}
                          style={{ color: '#38BDF8', fontSize: '11px', padding: '2px 8px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleSlotAction('full_day', 'available')}
                          style={{ color: 'var(--color-text-secondary)', fontSize: '11px', padding: '2px 6px' }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Blocked / Personal Day Card */}
                {selectedSlots?.full_day === 'blocked' && (
                  <div className={styles.blockedNoticeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={15} color="#F43F5E" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#FFE4E6' }}>
                            Personal Day Off (Blocked)
                          </div>
                          <div style={{ fontSize: '11px', color: '#FDA4AF', marginTop: '2px' }}>
                            Marked unavailable on your public portfolio
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleSlotAction('full_day', 'available')}
                        style={{ color: '#FDA4AF', fontSize: '11px', padding: '2px 8px' }}
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Event Cards (Confirmed Shows & Pencil Holds) */}
                {selectedDayShows.length > 0 ? (
                  selectedDayShows
                    .map((bk) => {
                      const isTentative = isBookingTentative(bk);
                      return (
                        <div
                          key={bk.id}
                          className={styles.eventCard}
                          style={{
                            borderLeft: isTentative
                              ? '3px solid #F59E0B'
                              : '3px solid #8B5CF6',
                          }}
                        >
                          {/* Timing & Status Top Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                            <div className={styles.eventTimeChip}>
                              <Clock size={12} />
                              <span>
                                {bk.event_time
                                  ? bk.event_time
                                  : bk.slot_type === 'morning'
                                    ? 'Morning Show'
                                    : bk.slot_type === 'evening'
                                      ? 'Evening Show'
                                      : 'Full Day'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isTentative && (() => {
                                const holdInfo = extractHoldExpiry(bk.notes);
                                return (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: holdInfo.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                      color: holdInfo.isExpired ? '#F87171' : '#FBBF24',
                                      border: holdInfo.isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                  >
                                    {holdInfo.label || '⏳ Hold Active'}
                                  </span>
                                );
                              })()}
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: isTentative ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isTentative ? '#F59E0B' : '#6EE7B7',
                                  border: isTentative ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                {isTentative ? '🟡 Pencil Hold' : '🟢 Confirmed'}
                              </span>
                            </div>
                          </div>

                          {/* Event Title */}
                          <div style={{ marginTop: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                              {bk.event_name || bk.event_type || (isTentative ? 'Inquiry Hold' : 'Show Event')}
                            </h4>
                            {bk.event_type && bk.event_name && bk.event_type !== bk.event_name && (
                              <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '2px', fontWeight: 500 }}>
                                {bk.event_type}
                              </div>
                            )}
                          </div>

                          {/* Venue & Location */}
                          {(bk.venue || bk.city) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                              <MapPin size={12} style={{ flexShrink: 0, color: 'var(--color-text-tertiary)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {bk.venue ? `${bk.venue}, ` : ''}{bk.city || 'Local'}
                              </span>
                            </div>
                          )}

                          {/* Client Info */}
                          {bk.client_name && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              <span>👤 {bk.client_name}</span>
                              {bk.client_phone && (
                                <a
                                  href={`https://wa.me/${bk.client_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', textDecoration: 'none' }}
                                >
                                  <Phone size={11} />
                                  <span>{bk.client_phone}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Action Buttons Row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', gap: '6px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {isTentative && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleConfirmHold(bk)}
                                  disabled={isPending}
                                  style={{ fontSize: '11px', padding: '3px 8px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none' }}
                                >
                                  <Check size={12} />
                                  <span>Lock Confirmed</span>
                                </button>
                              )}
                              {isTentative && bk.client_phone && (
                                <a
                                  href={`https://wa.me/${bk.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    generateHoldNudgeMessage(bk, initialProfile?.name || 'Artist')
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-xs"
                                  style={{ fontSize: '11px', padding: '3px 8px', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)' }}
                                  title="Send WhatsApp Hold Expiry Nudge"
                                >
                                  ⚡ Nudge
                                </a>
                              )}
                              <a
                                href={generateGoogleCalendarUrl(bk, initialProfile?.name || 'Artist')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs"
                                style={{ fontSize: '11px', padding: '3px 8px', color: '#93C5FD' }}
                                title="Add to Google Calendar directly"
                              >
                                📅 Cal
                              </a>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setReceiptBooking(bk)}
                                style={{ fontSize: '11px', padding: '3px 8px', color: '#6EE7B7' }}
                                title="Share WhatsApp Slip & Receipt"
                              >
                                <Receipt size={12} />
                                <span>Slip</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setCueSheetBooking(bk)}
                                style={{ fontSize: '11px', padding: '3px 8px', color: '#A78BFA' }}
                                title="View Cue Sheet"
                              >
                                <span>Cue</span>
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => openBookingModal(bk.slot_type as any, bk)}
                                style={{ padding: '4px', color: 'var(--color-text-secondary)' }}
                                title="Edit booking details"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setDeletingBooking(bk)}
                                style={{ padding: '4px', color: '#F43F5E' }}
                                title="Delete show"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : selectedSlots?.full_day !== 'blocked' &&
                  !isFullDayTravel &&
                  selectedDayTravelItineraries.length === 0 &&
                  !selectedStandaloneTravel ? (
                  /* 4. Open Date Clean Card */
                  <div className={styles.openDayCard}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>✨</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#F1F5F9' }}>
                      Free Date · Open for Bookings
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 14px 0' }}>
                      No events booked yet. This date shows as available on your public calendar.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openBookingModal('full_day')}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Book a Show / Hold</span>
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => openTravelModal('full_day')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        <Plane size={12} />
                        <span>Mark Travel</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleSlotAction('full_day', 'blocked')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        <Lock size={12} />
                        <span>Block Day Off</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Available Slot Notice if this date has a partial transit booking */}
                {selectedDayShows.length === 0 && selectedDayTravelItineraries.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#F1F5F9' }}>
                          {isEveningTravel ? '✨ Morning Slot Available' : isMorningTravel ? '✨ Evening Slot Available' : 'Add Show'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {isEveningTravel ? 'You travel in the evening. Morning is completely open for shows!' : isMorningTravel ? 'You travel in the morning. Evening is completely open for shows!' : 'Open for bookings'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => openBookingModal(isEveningTravel ? 'morning' : isMorningTravel ? 'evening' : 'full_day')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} />
                        <span>{isEveningTravel ? 'Add Morning Show' : isMorningTravel ? 'Add Evening Show' : 'Add Show'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Quick Action at Bottom if shows exist */}
                {selectedDayShows.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => openBookingModal('full_day')}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Plus size={12} />
                      <span>Add Another Show / Slot</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => openTravelModal('full_day')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}
                      title="Add travel buffer"
                    >
                      <Plane size={12} />
                      <span>Travel</span>
                    </button>
                  </div>
                )}

                {/* Inbound Inquiries on this Selected Date */}
                {(() => {
                  const dateInquiries = (inquiries || []).filter((iq: any) => iq.event_date === selectedDate);
                  if (dateInquiries.length === 0) return null;
                  return (
                    <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#D8B4FE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📥</span> Inbound Inquiries on this Date ({dateInquiries.length})
                        </span>
                        <Link href="/inquiries" style={{ fontSize: '11px', color: 'var(--color-primary-light)', textDecoration: 'none' }}>
                          View Leads →
                        </Link>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {dateInquiries.map((iq: any) => (
                          <div key={iq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{iq.name} ({iq.event_type || 'Event'})</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{iq.event_city || ''} {iq.budget_range ? `· ${iq.budget_range}` : ''}</div>
                            </div>
                            {iq.phone && (
                              <a
                                href={`https://wa.me/${iq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${iq.name}! Thank you for inquiring on StageHost for ${selectedDate}. Can we discuss your event requirements?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs"
                                style={{ fontSize: '11px', color: '#25D366' }}
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">
                <Calendar size={28} />
              </div>
              <div className="empty-state-title">Select a Date</div>
              <div className="empty-state-text">
                Tap any date to check timeline, set exact show timings, mark travel hours, or block a personal day.
              </div>
            </div>
          )}
          </div>
        </div>
      </>
    )}

    {/* ========================================================= */}
    {/* SHOWS & BOOKINGS PIPELINE (CONFIRMED & PENCIL HOLDS) */}
    {/* ========================================================= */}
    {(mainView === 'pipeline' || mainView === 'all') && (
      <div
        id="bookings-pipeline-section"
        className={styles.allShowsSection}
        style={{ marginTop: mainView === 'pipeline' ? '4px' : undefined }}
      >
        <div className={styles.allShowsHeader}>
          <div>
            <h2 className={styles.allShowsTitle}>
              <Calendar size={18} color="var(--color-primary)" />
              Shows & Bookings Pipeline
              <span className={styles.titleBadge}>
                {displayBookings.length} {displayBookings.length === 1 ? 'Show' : 'Shows'}
              </span>
            </h2>
            <p className={styles.allShowsSubtitle}>
              Overview of your confirmed shows, wedding functions, and active pencil holds
            </p>
          </div>
          <div className={styles.toolbarControls}>
            {/* Real-time Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px', maxWidth: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                placeholder="Search show, client, city, venue..."
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              {pipelineSearch && (
                <button
                  type="button"
                  onClick={() => setPipelineSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={cn(styles.filterTabBtn, bookingFilter === 'all' && styles.filterTabActive)}
                onClick={() => setBookingFilter('all')}
              >
                All ({showBookings.length})
              </button>
              <button
                type="button"
                className={cn(styles.filterTabBtn, bookingFilter === 'confirmed' && styles.filterTabActive)}
                onClick={() => setBookingFilter('confirmed')}
                style={{ color: bookingFilter === 'confirmed' ? '#6EE7B7' : undefined }}
              >
                🟢 Confirmed ({confirmedBookings.length})
              </button>
              <button
                type="button"
                className={cn(styles.filterTabBtn, bookingFilter === 'tentative' && styles.filterTabActive)}
                onClick={() => setBookingFilter('tentative')}
                style={{ color: bookingFilter === 'tentative' ? '#FCD34D' : undefined }}
              >
                🟡 Holds ({tentativeBookings.length})
              </button>
              <button
                type="button"
                className={cn(styles.filterTabBtn, bookingFilter === 'travel' && styles.filterTabActive)}
                onClick={() => setBookingFilter('travel')}
                style={{ color: bookingFilter === 'travel' ? '#60A5FA' : undefined }}
              >
                ✈️ Outstation ({outstationBookings.length})
              </button>
            </div>

            {/* View Mode Toggle: Cards vs List */}
            <div className={styles.viewToggleGroup}>
              <button
                type="button"
                className={cn(styles.viewToggleBtn, bookingViewMode === 'grid' && styles.viewToggleActive)}
                onClick={() => handleSetViewMode('grid')}
                title="Card Grid View"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                className={cn(styles.viewToggleBtn, bookingViewMode === 'list' && styles.viewToggleActive)}
                onClick={() => handleSetViewMode('list')}
                title="Table List View"
              >
                <List size={13} />
                <span>List</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowImportExportModal(true)}
              style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              title="Bulk Import Excel/CSV or Export Bookings"
            >
              <FileSpreadsheet size={13} /> Import / Export
            </button>

            <button
              type="button"
              className={styles.addBookingBtn}
              onClick={() => openBookingModal(isMorningBooked && !isEveningBooked ? 'evening' : 'morning')}
            >
              <Plus size={14} /> Add Booking
            </button>
          </div>
        </div>

        {displayBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-state-icon">
              <Calendar size={28} />
            </div>
            <div className="empty-state-title">
              {bookingFilter === 'confirmed'
                ? 'No Confirmed Shows Yet'
                : bookingFilter === 'tentative'
                  ? 'No Active Pencil Holds'
                  : 'No Bookings or Shows Found'}
            </div>
            <div className="empty-state-text">
              {bookingFilter === 'confirmed'
                ? 'Pencil holds are listed under the Holds tab. Click "Confirm Show" to lock one as confirmed.'
                : bookingFilter === 'tentative'
                  ? 'All of your currently scheduled shows are locked as confirmed bookings.'
                  : 'Click on any date in the calendar above to log your shows, pencil holds, and client details.'}
            </div>
          </div>
        ) : bookingViewMode === 'grid' ? (
          <div className={styles.allShowsGrid}>
            {displayBookings.map((b) => {
              const bDate = new Date(b.date + 'T00:00:00');
              const isSelected = selectedDate === b.date;
              const isTentative = isBookingTentative(b);
              return (
                <div
                  key={b.id}
                  className={cn(
                    styles.showCard,
                    isSelected && styles.showCardSelected,
                    isTentative && styles.showCardHold
                  )}
                >
                  <div className={styles.showCardHeader}>
                    <div className={styles.dateBlock}>
                      <span className={styles.dateWeekday}>
                        {bDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                      <span className={styles.dateMain}>
                        {bDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={styles.headerBadges}>
                      <span className={cn(styles.slotBadge, b.slot_type === 'morning' ? styles.badgeMorning : b.slot_type === 'evening' ? styles.badgeEvening : styles.badgeFullDay)}>
                        {b.slot_type === 'morning' ? '☀️ Morning' : b.slot_type === 'evening' ? '🌙 Evening' : '🌟 Full Day'}
                      </span>
                      {isTentative ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {(() => {
                            const hold = extractHoldExpiry(b.notes);
                            return (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  background: hold.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: hold.isExpired ? '#F87171' : '#FBBF24',
                                }}
                              >
                                {hold.label || 'Hold'}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className={styles.statusConfirmedBadge}>
                          <span className={styles.statusDot} /> Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.showCardContent}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.showCardTitle}>
                        {b.event_name || b.event_type || (isTentative ? 'Tentative Inquiry' : 'Confirmed Event')}
                      </h3>
                      {b.amount ? (
                        <span className={styles.feeBadge}>
                          ₹{b.amount.toLocaleString('en-IN')}
                        </span>
                      ) : null}
                    </div>

                    {b.event_type && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {b.event_type.split(',').map((tag, tIdx) => (
                          <span key={tIdx} className={styles.tagPill}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.metaRow}>
                      {(b.venue || b.city) && (
                        <div className={styles.metaItem}>
                          <MapPin size={12} className={styles.metaIcon} />
                          <span>{b.venue ? `${b.venue}, ` : ''}{b.city || 'Venue'}</span>
                        </div>
                      )}
                      {b.client_name && (
                        <div className={styles.metaItem}>
                          <User size={12} className={styles.metaIcon} />
                          <span>{b.client_name}</span>
                          {b.client_phone && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                              <a
                                href={`https://wa.me/${(() => {
                                  const p = b.client_phone.replace(/\D/g, '');
                                  return p.startsWith('91') ? p : `91${p}`;
                                })()}?text=${encodeURIComponent(
                                  `Hi ${b.client_name}! This is regarding your booking on StageHost for ${b.event_name || 'the event'} on ${b.date} in ${b.city || ''}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.clientPhoneLink}
                                style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', background: 'rgba(37, 211, 102, 0.08)' }}
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={10} /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {b.event_time && (
                        <div className={styles.metaItem}>
                          <Clock size={12} className={styles.metaIcon} />
                          <span>{b.event_time}</span>
                        </div>
                      )}
                    </div>

                    {/* Compact Airline-Style Transit Strip */}
                    {b.travel_itinerary && (
                      <div className={styles.travelStrip}>
                        <div className={styles.travelStripHeader}>
                          <span className={styles.travelStripBadge}>
                            <Plane size={11} /> Outstation Transit
                          </span>
                          <span className={styles.travelRoute}>
                            {b.travel_itinerary.pre_event?.from_city || 'Base'} ⇄ {b.city || b.travel_itinerary.pre_event?.to_city || 'Venue'}
                          </span>
                        </div>
                        <div className={styles.travelLegs}>
                          {b.travel_itinerary.pre_event?.enabled && b.travel_itinerary.pre_event.date && (
                            <div className={styles.travelLeg}>
                              <span className={styles.travelLegLabel}>🛫 Dep:</span>
                              <span className={styles.travelLegTime}>
                                {new Date(b.travel_itinerary.pre_event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {b.travel_itinerary.pre_event.travel_time ? ` (${b.travel_itinerary.pre_event.travel_time})` : ''}
                              </span>
                            </div>
                          )}
                          {b.travel_itinerary.post_event?.enabled && b.travel_itinerary.post_event.date && (
                            <div className={styles.travelLeg}>
                              <span className={styles.travelLegLabel}>🛬 Ret:</span>
                              <span className={styles.travelLegTime}>
                                {new Date(b.travel_itinerary.post_event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {b.travel_itinerary.post_event.travel_time ? ` (${b.travel_itinerary.post_event.travel_time})` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.showCardFooter}>
                    {isTentative ? (
                      <button
                        type="button"
                        className={styles.confirmHoldBtn}
                        onClick={() => handleConfirmHold(b)}
                        disabled={isPending}
                        title="Lock & Confirm Show"
                      >
                        <CheckCircle2 size={12} /> Confirm Show
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.calendarJumpBtn}
                        onClick={() => {
                          setSelectedDate(b.date);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        title="View date in calendar"
                      >
                        <Calendar size={12} /> View in Calendar
                      </button>
                    )}

                    {isTentative && b.client_phone && (
                      <a
                        href={`https://wa.me/${b.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          generateHoldNudgeMessage(b, initialProfile?.name || 'Artist')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-xs"
                        style={{ fontSize: '11px', padding: '4px 8px', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)', textDecoration: 'none' }}
                        title="Send WhatsApp Hold Nudge"
                      >
                        ⚡ Nudge
                      </a>
                    )}
                    <a
                      href={generateGoogleCalendarUrl(b, initialProfile?.name || 'Artist')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-xs"
                      style={{ fontSize: '11px', padding: '4px 8px', color: '#93C5FD', textDecoration: 'none' }}
                      title="Add to Google Calendar"
                    >
                      📅 Cal
                    </a>

                    <div className={styles.actionIconGroup}>
                      {b.client_phone && !isTentative && (
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => handleRequestReview(b.client_phone, b.client_name)}
                          title="Request 5-Star WhatsApp Review"
                          aria-label="Request Review"
                        >
                          <Star size={13} color="#22C55E" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => setCueSheetBooking(b)}
                        title="Backstage Green Room Cue Sheet"
                        aria-label="Cue Sheet"
                      >
                        <Sparkles size={13} color="#EAB308" />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => setReceiptBooking(b)}
                        title="Token Slip & Receipt"
                        aria-label="Token Slip"
                      >
                        <Receipt size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => {
                          setSelectedDate(b.date);
                          openBookingModal(b.slot_type as SlotType, b, b.date);
                        }}
                        title="Edit Show Details"
                        aria-label="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={cn(styles.actionIconBtn, styles.actionIconBtnDanger)}
                        onClick={() => setDeletingBooking(b)}
                        title="Clear Booking"
                        aria-label="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.modernTable}>
                <thead>
                  <tr>
                    <th>Date & Slot</th>
                    <th>Status</th>
                    <th>Show / Event</th>
                    <th>Location</th>
                    <th>Client Contact</th>
                    <th>Commercial</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayBookings.map((b) => {
                    const bDate = new Date(b.date + 'T00:00:00');
                    const isSelected = selectedDate === b.date;
                    const isTentative = isBookingTentative(b);
                    return (
                      <tr
                        key={b.id}
                        className={cn(styles.modernTableRow, isSelected && styles.modernTableRowSelected)}
                      >
                        <td>
                          <div className={styles.tableDateCol}>
                            <span className={styles.tableDateText}>
                              {bDate.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className={styles.tableWeekdayText}>
                              {bDate.toLocaleDateString('en-IN', { weekday: 'short' })} ·{' '}
                              {b.slot_type === 'morning' ? 'Morning' : b.slot_type === 'evening' ? 'Evening' : 'Full Day'}
                              {b.event_time ? ` (${b.event_time})` : ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          {isTentative ? (
                            <span className={styles.statusHoldBadge}>
                              🟡 Hold
                            </span>
                          ) : (
                            <span className={styles.statusConfirmedBadge}>
                              <span className={styles.statusDot} /> Confirmed
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.tableEventCol}>
                            <span className={styles.tableEventTitle}>
                              {b.event_name || b.event_type || (isTentative ? 'Tentative Inquiry' : 'Confirmed Show')}
                            </span>
                            <div className={styles.tableEventTags}>
                              {b.event_type && (
                                <span className={styles.tagPill}>{b.event_type}</span>
                              )}
                              {b.travel_itinerary && (
                                <span className={styles.transitTagPill}>
                                  <Plane size={9} /> Transit ({b.city || 'Outstation'})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {b.city ? (
                            <div className={styles.tableMetaText}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={11} color="var(--color-accent)" />
                                <strong>{b.city}</strong>
                              </div>
                              {b.venue && <div className={styles.tableSubText}>{b.venue}</div>}
                            </div>
                          ) : (
                            <span className={styles.tableMuted}>Local Show</span>
                          )}
                        </td>
                        <td>
                          {b.client_name ? (
                            <div className={styles.tableMetaText}>
                              <div style={{ fontWeight: 500 }}>{b.client_name}</div>
                              {b.client_phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <a href={`tel:${b.client_phone}`} className={styles.tablePhone}>
                                    {b.client_phone}
                                  </a>
                                  <a
                                    href={`https://wa.me/${(() => {
                                      const p = b.client_phone.replace(/\D/g, '');
                                      return p.startsWith('91') ? p : `91${p}`;
                                    })()}?text=${encodeURIComponent(
                                      `Hi ${b.client_name}! This is regarding your booking on StageHost for ${b.event_name || 'the event'} on ${b.date} in ${b.city || ''}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '4px',
                                      background: 'rgba(37, 211, 102, 0.15)',
                                      color: '#25D366',
                                      border: '1px solid rgba(37, 211, 102, 0.3)',
                                      textDecoration: 'none',
                                    }}
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle size={10} />
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={styles.tableMuted}>Direct</span>
                          )}
                        </td>
                        <td>
                          {b.amount ? (
                            <span className={styles.tableFee}>
                              ₹{b.amount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className={styles.tableMuted}>TBD</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.tableActions}>
                            {isTentative ? (
                              <button
                                type="button"
                                className={styles.tableConfirmBtn}
                                onClick={() => handleConfirmHold(b)}
                                disabled={isPending}
                                title="Convert Pencil Hold to Confirmed Show"
                              >
                                <CheckCircle2 size={12} /> Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.tableCalendarBtn}
                                onClick={() => {
                                  setSelectedDate(b.date);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                title="View in Calendar"
                              >
                                <Calendar size={12} /> Date
                              </button>
                            )}
                            {isTentative && b.client_phone && (
                              <a
                                href={`https://wa.me/${b.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  generateHoldNudgeMessage(b, initialProfile?.name || 'Artist')
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionIconBtn}
                                style={{ color: '#34D399', textDecoration: 'none' }}
                                title="Send WhatsApp Hold Nudge"
                                aria-label="Nudge"
                              >
                                ⚡
                              </a>
                            )}
                            <a
                              href={generateGoogleCalendarUrl(b, initialProfile?.name || 'Artist')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionIconBtn}
                              style={{ color: '#93C5FD', textDecoration: 'none' }}
                              title="Add to Google Calendar directly"
                              aria-label="Google Calendar"
                            >
                              <Calendar size={12} />
                            </a>
                            {b.client_phone && !isTentative && (
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                onClick={() => handleRequestReview(b.client_phone, b.client_name)}
                                title="Request WhatsApp Review"
                                aria-label="Review"
                              >
                                <Star size={12} color="#22C55E" />
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => setCueSheetBooking(b)}
                              title="Backstage Green Room Cue Sheet"
                              aria-label="Cue Sheet"
                            >
                              <Sparkles size={12} color="#EAB308" />
                            </button>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => setReceiptBooking(b)}
                              title="Token Slip & Receipt"
                              aria-label="Slip"
                            >
                              <Receipt size={12} />
                            </button>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => {
                                setSelectedDate(b.date);
                                openBookingModal(b.slot_type as SlotType, b, b.date);
                              }}
                              title="Edit Details"
                              aria-label="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className={cn(styles.actionIconBtn, styles.actionIconBtnDanger)}
                              onClick={() => setDeletingBooking(b)}
                              title="Clear Booking"
                              aria-label="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}

    {/* ========================================================= */}
  {/* 1. ADD / EDIT BOOKING MODAL (Supports custom city & venue) */ }
  {/* ========================================================= */ }
  {
    showBookingModal && (
      <div className="modal-backdrop" onClick={() => setShowBookingModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeSlotType === 'morning' ? (
                <Sun size={18} color="var(--color-warning)" />
              ) : activeSlotType === 'evening' ? (
                <Moon size={18} color="var(--color-primary)" />
              ) : (
                <Sparkles size={18} color="#F472B6" />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: '15px' }}>
                  {bookingForm.id ? 'Edit Booking' : 'Add Booking'} — {activeSlotType === 'morning' ? '☀️ Morning Show' : activeSlotType === 'evening' ? '🌙 Evening Show' : '💍 Full Day'}
                </h3>
                {bookingForm.date && (
                  <span style={{ fontSize: '12px', color: 'var(--color-primary-light)', fontWeight: 500, marginTop: '2px' }}>
                    📅 {new Date(bookingForm.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setShowBookingModal(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Event Date & Function Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                {/* Event Date Picker */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                      <span>Event Date *</span>
                    </span>
                    {bookingForm.date && (
                      <span style={{ fontSize: '11px', color: 'var(--color-primary-light)', fontWeight: 600 }}>
                        {new Date(bookingForm.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={bookingForm.date || ''}
                    onChange={(e) => handleDateChangeInForm(e.target.value)}
                    required
                    style={{ fontWeight: 600, color: 'var(--color-foreground)', cursor: 'pointer' }}
                  />
                </div>

                {/* Function Slot */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ marginBottom: '4px', fontWeight: 600 }}>Function Slot *</label>
                  <select
                    className="input"
                    value={activeSlotType}
                    onChange={(e) => {
                      const newSlot = e.target.value as SlotType;
                      setActiveSlotType(newSlot);
                      if (!bookingForm.event_time || bookingForm.event_time.includes('Morning') || bookingForm.event_time.includes('Evening') || bookingForm.event_time.includes('Full Day')) {
                        setBookingForm((prev) => ({
                          ...prev,
                          event_time: newSlot === 'morning' ? '10:00 AM – 02:30 PM' : newSlot === 'evening' ? '07:00 PM – 11:30 PM' : 'Full Day (Morning + Evening)',
                        }));
                      }
                    }}
                    style={{ fontWeight: 500 }}
                  >
                    <option value="morning">☀️ Morning Show</option>
                    <option value="evening">🌙 Evening Show</option>
                    <option value="full_day">💍 Full Day</option>
                  </select>
                </div>
              </div>

              {/* Booking Status: Confirmed vs Pencil Hold */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Booking Status *</span>
                  <span style={{ fontSize: '11px', color: bookingForm.booking_status === 'tentative' ? '#F59E0B' : 'var(--color-success)' }}>
                    {bookingForm.booking_status === 'tentative' ? '🟡 Pencil Hold (Shows tentative hold to planners)' : '🟢 Confirmed (Shows booked on public calendar)'}
                  </span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${bookingForm.booking_status !== 'tentative' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: bookingForm.booking_status !== 'tentative' ? undefined : '1px solid var(--color-border)' }}
                    onClick={() => setBookingForm({ ...bookingForm, booking_status: 'confirmed' })}
                  >
                    🟢 Confirmed Show
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${bookingForm.booking_status === 'tentative' ? 'btn-warning' : 'btn-ghost'}`}
                    style={{
                      background: bookingForm.booking_status === 'tentative' ? 'rgba(245, 158, 11, 0.2)' : undefined,
                      borderColor: bookingForm.booking_status === 'tentative' ? '#F59E0B' : 'var(--color-border)',
                      color: bookingForm.booking_status === 'tentative' ? '#F59E0B' : undefined,
                    }}
                    onClick={() => {
                      setBookingForm({
                        ...bookingForm,
                        booking_status: 'tentative',
                        hold_duration: bookingForm.hold_duration || 'none',
                        hold_expiry:
                          bookingForm.hold_duration && bookingForm.hold_duration !== 'none'
                            ? bookingForm.hold_expiry
                            : '',
                      });
                    }}
                  >
                    🟡 Pencil Hold (Tentative)
                  </button>
                </div>
              </div>

              {/* Hold Duration & Auto-Expiry Settings */}
              {bookingForm.booking_status === 'tentative' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B', margin: 0 }}>
                      ⏳ Hold Validity & Expiry Timer
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Optional countdown & nudges
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {[
                      { id: 'none', label: '🚫 None (Manual Hold)' },
                      { id: '24h', label: '24 Hours' },
                      { id: '48h', label: '48 Hours' },
                      { id: '72h', label: '72 Hours (3 Days)' },
                      { id: '7d', label: '7 Days' },
                      { id: 'custom', label: '✍️ Custom Time' },
                    ].map((opt) => {
                      const isSelected =
                        bookingForm.hold_duration === opt.id ||
                        (!bookingForm.hold_duration && opt.id === 'none');
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (opt.id === 'none') {
                              setBookingForm((prev) => ({
                                ...prev,
                                hold_duration: 'none',
                                hold_expiry: '',
                              }));
                              return;
                            }
                            if (opt.id === 'custom') {
                              const now = new Date();
                              const expIso =
                                bookingForm.hold_expiry ||
                                new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
                              setBookingForm((prev) => ({
                                ...prev,
                                hold_duration: 'custom',
                                hold_expiry: expIso,
                              }));
                              return;
                            }
                            const now = new Date();
                            const hrs =
                              opt.id === '24h'
                                ? 24
                                : opt.id === '48h'
                                ? 48
                                : opt.id === '72h'
                                ? 72
                                : 168;
                            const expIso = new Date(
                              now.getTime() + hrs * 60 * 60 * 1000
                            ).toISOString();
                            setBookingForm((prev) => ({
                              ...prev,
                              hold_duration: opt.id as any,
                              hold_expiry: expIso,
                            }));
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isSelected
                              ? '1px solid #F59E0B'
                              : '1px solid var(--color-border)',
                            background: isSelected
                              ? 'rgba(245, 158, 11, 0.25)'
                              : 'rgba(255, 255, 255, 0.04)',
                            color: isSelected
                              ? '#F59E0B'
                              : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: isSelected ? 700 : 400,
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {(!bookingForm.hold_duration || bookingForm.hold_duration === 'none') && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      ℹ️ <strong>Manual Hold (No Timer):</strong> No automatic expiry countdown. You can follow up with the client manually whenever you prefer.
                    </div>
                  )}

                  {/* Custom Expiry Date & Time Picker */}
                  {bookingForm.hold_duration === 'custom' && (
                    <div
                      style={{
                        marginTop: '8px',
                        marginBottom: '8px',
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px dashed rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <label
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#FCD34D',
                            margin: 0,
                          }}
                        >
                          Set Your Own Expiry (Date & Time):
                        </label>
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          User-defined expiry
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <input
                          type="datetime-local"
                          value={(() => {
                            if (!bookingForm.hold_expiry) return '';
                            try {
                              const d = new Date(bookingForm.hold_expiry);
                              const tzOffset = d.getTimezoneOffset() * 60000;
                              return new Date(d.getTime() - tzOffset)
                                .toISOString()
                                .slice(0, 16);
                            } catch {
                              return '';
                            }
                          })()}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const d = new Date(e.target.value);
                            if (!isNaN(d.getTime())) {
                              setBookingForm((prev) => ({
                                ...prev,
                                hold_duration: 'custom',
                                hold_expiry: d.toISOString(),
                              }));
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid #F59E0B',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />

                        {/* Quick custom offset adders */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {[
                            { label: '+12h', hrs: 12 },
                            { label: '+36h', hrs: 36 },
                            { label: '+5 Days', hrs: 120 },
                            { label: '+10 Days', hrs: 240 },
                            { label: '+14 Days', hrs: 336 },
                          ].map((shortcut) => (
                            <button
                              key={shortcut.label}
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                const exp = new Date(
                                  now.getTime() + shortcut.hrs * 60 * 60 * 1000
                                ).toISOString();
                                setBookingForm((prev) => ({
                                  ...prev,
                                  hold_duration: 'custom',
                                  hold_expiry: exp,
                                }));
                              }}
                              style={{
                                fontSize: '10px',
                                padding: '3px 7px',
                                borderRadius: '4px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#FCD34D',
                                cursor: 'pointer',
                              }}
                            >
                              {shortcut.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingForm.hold_expiry && bookingForm.hold_duration !== 'none' && (
                    <div style={{ fontSize: '11px', color: '#FCD34D' }}>
                      Hold expires on:{' '}
                      <strong>
                        {new Date(bookingForm.hold_expiry).toLocaleString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Show Timing (Flexible / Exact Hours) */}
              <div className="input-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    ⏰ Show Timing (Flexible / Exact Hours) *
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary-light)' }}>
                    Presets or custom timing
                  </span>
                </div>

                {/* Quick Timing Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { label: '☀️ 10 AM – 2:30 PM (Morning)', slot: 'morning', time: '10:00 AM – 02:30 PM' },
                    { label: '🌇 3 PM – 7 PM (Afternoon)', slot: 'evening', time: '03:00 PM – 07:00 PM' },
                    { label: '🌙 7 PM – 11:30 PM (Sangeet)', slot: 'evening', time: '07:00 PM – 11:30 PM' },
                    { label: '✨ 8 PM – 1 AM (Late Night)', slot: 'evening', time: '08:00 PM – 01:00 AM' },
                    { label: '🌟 Full Day (All Day)', slot: 'full_day', time: 'Full Day (Morning + Evening)' },
                  ].map((preset) => {
                    const isSelected = bookingForm.event_time === preset.time;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setBookingForm((prev) => ({ ...prev, event_time: preset.time }));
                          setActiveSlotType(preset.slot as SlotType);
                        }}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#DDD6FE' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Flexible Custom Input */}
                <input
                  className="input"
                  placeholder="e.g. 7:30 PM – 11:30 PM, 4 PM onwards, 6:00 PM to 10:00 PM..."
                  value={bookingForm.event_time || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, event_time: e.target.value })}
                />
              </div>

              {/* Multi-Select Event Functions & Custom Function Creator */}
              <EventFunctionsPicker
                value={bookingForm.event_type}
                onChange={(val) => setBookingForm({ ...bookingForm, event_type: val })}
                label="Event Functions *"
                allowCustom={true}
              />

              <div className="input-group">
                <label className="input-label">Event / Function Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Kapoor Wedding Sangeet / Tech Conclave"
                  value={bookingForm.event_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, event_name: e.target.value })}
                />
              </div>

              {/* City & Venue (With Custom City Datalist!) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Destination City *</label>
                  <input
                    required
                    className="input"
                    placeholder="e.g. Udaipur, Mumbai, Goa..."
                    value={bookingForm.city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setBookingForm({ ...bookingForm, city: newCity });
                      setTravelBuffer((prev) => ({
                        ...prev,
                        pre_event: { ...prev.pre_event, to_city: newCity },
                        post_event: { ...prev.post_event, from_city: newCity },
                      }));
                    }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Venue / Hotel</label>
                  <input
                    className="input"
                    placeholder="e.g. Taj Lake Palace"
                    value={bookingForm.venue}
                    onChange={(e) => setBookingForm({ ...bookingForm, venue: e.target.value })}
                  />
                </div>
              </div>

              {/* Client Details & Fee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Client / Agency Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Amit Singhania"
                    value={bookingForm.client_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, client_name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Fee / Amount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 45000"
                    value={bookingForm.amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Client Phone / WhatsApp</label>
                <input
                  className="input"
                  placeholder="+91 98765 43210"
                  value={bookingForm.client_phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, client_phone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Special Notes / Agenda</label>
                <textarea
                  className="input textarea"
                  placeholder="Dress code, theme, arrival time, or sequence details..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Backstage VIP Run-Sheet & Names */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋 Backstage VIP Run-Sheet & Names (Green Room Cheat Sheet)</span>
                </label>
                <textarea
                  className="input textarea"
                  placeholder="VIP names to announce (e.g. Groom Chacha: Mr. R.K. Sharma, MD: Sunita Roy), sequence cues, or special moments..."
                  value={bookingForm.cue_notes || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, cue_notes: e.target.value })}
                  rows={3}
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Out of city event & Travel Buffer Planner */}
              <div
                style={{
                  borderRadius: '12px',
                  border: bookingForm.is_out_of_city
                    ? '1px solid rgba(59, 130, 246, 0.45)'
                    : '1px solid var(--color-border)',
                  background: bookingForm.is_out_of_city
                    ? 'rgba(59, 130, 246, 0.05)'
                    : 'var(--color-surface-elevated)',
                  padding: '14px',
                  transition: 'all 0.2s ease',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bookingForm.is_out_of_city}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setBookingForm({ ...bookingForm, is_out_of_city: checked });
                      if (checked) {
                        setTravelBuffer((prev) => ({
                          ...prev,
                          pre_event: {
                            ...prev.pre_event,
                            to_city: bookingForm.city || prev.pre_event.to_city,
                            from_city: prev.pre_event.from_city || initialProfile?.city || '',
                          },
                          post_event: {
                            ...prev.post_event,
                            from_city: bookingForm.city || prev.post_event.from_city,
                            to_city: prev.post_event.to_city || initialProfile?.city || '',
                          },
                        }));
                      }
                    }}
                    style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#3B82F6', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px' }}>
                        <span>✈️ Out of city event (Need travel buffer)</span>
                      </div>
                      {bookingForm.is_out_of_city && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#60A5FA',
                            background: 'rgba(59, 130, 246, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          Auto-Blocks Calendar
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--color-text-tertiary)' }}>
                      Show ke aage aur peeche ke travel days / transit slots calendar me automatically add aur block karein
                    </p>
                  </div>
                </label>

                {/* Expanded Transit Buffer Controls */}
                {bookingForm.is_out_of_city && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Visual Route Indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🏠 Base: <strong style={{ color: 'var(--color-text-primary)' }}>{initialProfile?.city || 'Home City'}</strong>
                      </span>
                      <ArrowRight size={14} color="#60A5FA" />
                      <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📍 Event: <strong style={{ color: '#F59E0B' }}>{bookingForm.city || 'Event City'}</strong>
                      </span>
                    </div>

                    {/* 1. Pre-Event Departure Buffer */}
                    <div
                      style={{
                        background: travelBuffer.pre_event.enabled ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: travelBuffer.pre_event.enabled ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: travelBuffer.pre_event.enabled ? '10px' : '0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={travelBuffer.pre_event.enabled}
                            onChange={(e) =>
                              setTravelBuffer((prev) => ({
                                ...prev,
                                pre_event: { ...prev.pre_event, enabled: e.target.checked },
                              }))
                            }
                            style={{ accentColor: '#3B82F6' }}
                          />
                          <span>🛫 Aage ka Safar (Departure Travel)</span>
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          Before Show ({travelBuffer.pre_event.date})
                        </span>
                      </div>

                      {travelBuffer.pre_event.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Travel Date
                              </label>
                              <input
                                type="date"
                                className="input input-sm"
                                value={travelBuffer.pre_event.date}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    pre_event: { ...prev.pre_event, date: e.target.value },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Transit Slot
                              </label>
                              <select
                                className="input input-sm"
                                value={travelBuffer.pre_event.slot_type}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    pre_event: {
                                      ...prev.pre_event,
                                      slot_type: e.target.value as 'morning' | 'evening' | 'full_day',
                                    },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                <option value="full_day">Full Day (Block)</option>
                                <option value="morning">Morning Slot</option>
                                <option value="evening">Evening Slot</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Mode
                              </label>
                              <select
                                className="input input-sm"
                                value={travelBuffer.pre_event.transport_mode}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    pre_event: { ...prev.pre_event, transport_mode: e.target.value },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                <option value="✈️ Flight">✈️ Flight</option>
                                <option value="🚘 Cab / Drive">🚘 Cab / Drive</option>
                                <option value="🚆 Train">🚆 Train</option>
                                <option value="🚌 Bus">🚌 Bus</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                              className="input input-sm"
                              placeholder={`From: ${initialProfile?.city || 'Home City'}`}
                              value={travelBuffer.pre_event.from_city}
                              onChange={(e) =>
                                setTravelBuffer((prev) => ({
                                  ...prev,
                                  pre_event: { ...prev.pre_event, from_city: e.target.value },
                                }))
                              }
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                            <input
                              className="input input-sm"
                              placeholder={`To: ${bookingForm.city || 'Event City'}`}
                              value={travelBuffer.pre_event.to_city}
                              onChange={(e) =>
                                setTravelBuffer((prev) => ({
                                  ...prev,
                                  pre_event: { ...prev.pre_event, to_city: e.target.value },
                                }))
                              }
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                          </div>

                          <input
                            className="input input-sm"
                            placeholder="Notes (optional e.g. Flight 6E-204, departure 9 AM)"
                            value={travelBuffer.pre_event.notes}
                            onChange={(e) =>
                              setTravelBuffer((prev) => ({
                                ...prev,
                                pre_event: { ...prev.pre_event, notes: e.target.value },
                              }))
                            }
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2. Post-Event Return Buffer */}
                    <div
                      style={{
                        background: travelBuffer.post_event.enabled ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: travelBuffer.post_event.enabled ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: travelBuffer.post_event.enabled ? '10px' : '0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={travelBuffer.post_event.enabled}
                            onChange={(e) =>
                              setTravelBuffer((prev) => ({
                                ...prev,
                                post_event: { ...prev.post_event, enabled: e.target.checked },
                              }))
                            }
                            style={{ accentColor: '#3B82F6' }}
                          />
                          <span>🛬 Peeche ka Safar (Return Journey)</span>
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          After Show ({travelBuffer.post_event.date})
                        </span>
                      </div>

                      {travelBuffer.post_event.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Travel Date
                              </label>
                              <input
                                type="date"
                                className="input input-sm"
                                value={travelBuffer.post_event.date}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    post_event: { ...prev.post_event, date: e.target.value },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Transit Slot
                              </label>
                              <select
                                className="input input-sm"
                                value={travelBuffer.post_event.slot_type}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    post_event: {
                                      ...prev.post_event,
                                      slot_type: e.target.value as 'morning' | 'evening' | 'full_day',
                                    },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                <option value="morning">Morning Slot (Recommended)</option>
                                <option value="full_day">Full Day (Block)</option>
                                <option value="evening">Evening Slot</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>
                                Mode
                              </label>
                              <select
                                className="input input-sm"
                                value={travelBuffer.post_event.transport_mode}
                                onChange={(e) =>
                                  setTravelBuffer((prev) => ({
                                    ...prev,
                                    post_event: { ...prev.post_event, transport_mode: e.target.value },
                                  }))
                                }
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                <option value="✈️ Flight">✈️ Flight</option>
                                <option value="🚘 Cab / Drive">🚘 Cab / Drive</option>
                                <option value="🚆 Train">🚆 Train</option>
                                <option value="🚌 Bus">🚌 Bus</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                              className="input input-sm"
                              placeholder={`From: ${bookingForm.city || 'Event City'}`}
                              value={travelBuffer.post_event.from_city}
                              onChange={(e) =>
                                setTravelBuffer((prev) => ({
                                  ...prev,
                                  post_event: { ...prev.post_event, from_city: e.target.value },
                                }))
                              }
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                            <input
                              className="input input-sm"
                              placeholder={`To: ${initialProfile?.city || 'Home City'}`}
                              value={travelBuffer.post_event.to_city}
                              onChange={(e) =>
                                setTravelBuffer((prev) => ({
                                  ...prev,
                                  post_event: { ...prev.post_event, to_city: e.target.value },
                                }))
                              }
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                          </div>

                          <input
                            className="input input-sm"
                            placeholder="Notes (optional e.g. Morning return flight / drive back)"
                            value={travelBuffer.post_event.notes}
                            onChange={(e) =>
                              setTravelBuffer((prev) => ({
                                ...prev,
                                post_event: { ...prev.post_event, notes: e.target.value },
                              }))
                            }
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Quick Summary Pill */}
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#93C5FD',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={14} />
                      <span>
                        Save par click karne se ye dates aapke calendar me automatically <strong>Travel / In Transit</strong> mark ho jayengi.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBookingSave}
              disabled={isPending || !bookingForm.event_name.trim() || !bookingForm.date}
            >
              {isPending ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Save Booking
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* ========================================================= */ }
  {/* 2. TRAVEL HOURS & ROUTE MODAL                             */ }
  {/* ========================================================= */ }
  {
    showTravelModal && (
      <div className="modal-backdrop" onClick={() => setShowTravelModal(false)}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '540px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plane size={18} color="var(--color-warning)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Set Travel Time & Route</h3>
                {selectedDate && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    For {selectedDate}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setShowTravelModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Travel Window Selection */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>Travel Window *</label>
              <select
                className="input"
                value={travelForm.slot_type}
                onChange={(e) =>
                  setTravelForm({ ...travelForm, slot_type: e.target.value as any })
                }
              >
                <option value="morning">☀️ Morning Travel (Keep Evening Available for shows)</option>
                <option value="evening">🌙 Evening Travel (Keep Morning Available for shows)</option>
                <option value="full_day">✈️ Full Day Travel (All Day Transit)</option>
              </select>
            </div>

            {/* Helper notice */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '12px',
                color: '#6EE7B7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>
                {travelForm.slot_type === 'morning'
                  ? 'StageHost marks Morning for transit and keeps your Evening 100% AVAILABLE for gigs!'
                  : travelForm.slot_type === 'evening'
                    ? 'StageHost keeps your Morning open for shows and marks Evening for transit!'
                    : 'StageHost marks the full day as traveling. No bookings will be accepted.'}
              </span>
            </div>

            {/* 2. Mode of Transport (Quick Chips + Freeform Input) */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>
                Mode of Transport & Details
              </label>
              <div className={styles.modeGrid} style={{ marginBottom: '8px' }}>
                {TRANSPORT_MODES.map((mode) => {
                  const isSelected = travelForm.transport_mode.toLowerCase().includes(mode.id) ||
                    travelForm.transport_mode.toLowerCase().includes(mode.label.toLowerCase());
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      className={cn(styles.modeBtn, isSelected && styles.modeBtnActive)}
                      onClick={() => {
                        setTravelForm({
                          ...travelForm,
                          transport_mode: mode.defaultText,
                        });
                      }}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                className="input"
                placeholder="e.g. ✈️ Flight 6E-204 / 🚆 Rajdhani Exp / 🚗 Innova Cab"
                value={travelForm.transport_mode}
                onChange={(e) => setTravelForm({ ...travelForm, transport_mode: e.target.value })}
                title="You can freely write or edit the transport mode and carrier"
              />
            </div>

            {/* 3. Travel Route: Origin and Destination */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>Journey Route</label>
              <div className={styles.twoColGrid}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                    From (Origin City)
                  </span>
                  <input
                    className="input"
                    placeholder="e.g. Mumbai / Surat"
                    value={travelForm.from_city}
                    onChange={(e) => setTravelForm({ ...travelForm, from_city: e.target.value })}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                    To (Destination City)
                  </span>
                  <input
                    className="input"
                    placeholder="e.g. Goa / Jaipur / Delhi"
                    value={travelForm.to_city}
                    onChange={(e) => setTravelForm({ ...travelForm, to_city: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 4. Timings: Departure & Arrival */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>Timings (Optional)</label>
              <div className={styles.twoColGrid}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Departure / Pickup
                  </span>
                  <input
                    className="input"
                    placeholder="e.g. 08:30 AM"
                    value={travelForm.departure_time}
                    onChange={(e) => setTravelForm({ ...travelForm, departure_time: e.target.value })}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Arrival / Landing
                  </span>
                  <input
                    className="input"
                    placeholder="e.g. 01:45 PM"
                    value={travelForm.arrival_time}
                    onChange={(e) => setTravelForm({ ...travelForm, arrival_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 5. Accurate Travel Hours / Duration */}
            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ fontWeight: 600, margin: 0 }}>
                  Travel Duration / Hours
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  Type freely or pick quick duration
                </span>
              </div>
              <input
                className="input"
                placeholder="e.g. 3.5 hours / 4 hours 30 mins / Overnight"
                value={travelForm.travel_hours}
                onChange={(e) => setTravelForm({ ...travelForm, travel_hours: e.target.value })}
                style={{ marginTop: '4px' }}
              />
              <div className={styles.travelPillsRow}>
                {DURATION_PRESETS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    className={cn(
                      styles.travelPill,
                      travelForm.travel_hours === dur && styles.travelPillActive
                    )}
                    onClick={() => setTravelForm({ ...travelForm, travel_hours: dur })}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Ticket / PNR / Vehicle Info */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>
                Ticket / PNR / Vehicle No. (Optional)
              </label>
              <input
                className="input"
                placeholder="e.g. PNR: 4892184 / Driver: Ramesh (98200XXXXX)"
                value={travelForm.transit_number}
                onChange={(e) => setTravelForm({ ...travelForm, transit_number: e.target.value })}
              />
            </div>

            {/* 7. Transit Notes & Pickup Arrangements */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>
                Transit Notes & Pickup Instructions (Optional)
              </label>
              <textarea
                className="input"
                placeholder="e.g. Airport cab arranged by client. Reach venue 2 hours before soundcheck at 4:00 PM."
                value={travelForm.notes}
                onChange={(e) => setTravelForm({ ...travelForm, notes: e.target.value })}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 20px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowTravelModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTravelSave}
              disabled={isPending}
              style={{ gap: '6px' }}
            >
              {isPending ? <Loader2 size={14} className="spin" /> : <Plane size={14} />} Save Travel Time
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Delete Confirmation Modal */ }
  <ConfirmModal
    isOpen={!!deletingBooking}
    onClose={() => setDeletingBooking(null)}
    onConfirm={handleConfirmDeleteBooking}
    title="Cancel This Booking?"
    description={`Are you sure you want to cancel the booking "${deletingBooking?.event_name || 'Event'}" on ${deletingBooking?.date}? This will free up the ${deletingBooking?.slot_type} slot.`}
    confirmText="Yes, Cancel Booking"
    cancelText="Keep Booking"
    variant="danger"
    isLoading={isPending}
  />

  {/* Booking Confirmation & Advance Receipt Modal */ }
  {
    receiptBooking && (
      <BookingReceiptModal
        isOpen={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
        booking={receiptBooking}
        anchorProfile={initialProfile || { name: 'Anchor', slug: 'anchor' }}
        onUpdateBooking={handleReceiptUpdateBooking}
        onOpenFullEdit={handleOpenFullEditFromReceipt}
      />
    )
  }

  {/* Backstage VIP Run-Sheet & Green Room Cue Sheet Modal */ }
  {
    cueSheetBooking && (
      <div className="modal-backdrop" onClick={() => setCueSheetBooking(null)} style={{ zIndex: 9999 }}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '560px',
            background: '#0d0e15',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15)',
            borderRadius: '16px',
          }}
        >
          <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🎤</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 700 }}>
                  Green Room VIP Run-Sheet
                </h3>
                <div style={{ fontSize: '12px', color: '#d4af37', fontWeight: 500 }}>
                  {cueSheetBooking.event_name} · {cueSheetBooking.city || 'Event Venue'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setCueSheetBooking(null)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Info Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Date & Slot</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{cueSheetBooking.date} ({cueSheetBooking.slot_type})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Venue</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{cueSheetBooking.venue || cueSheetBooking.city || 'On Stage'}</div>
              </div>
              {cueSheetBooking.client_name && (
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Client / POC</div>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{cueSheetBooking.client_name}</div>
                </div>
              )}
            </div>

            {/* VIP Names & Cue Sheet High Contrast Box */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                📋 VIP Names to Announce & Stage Flow
              </label>
              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '120px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  fontFamily: 'monospace',
                }}
              >
                {(() => {
                  const [, cueNotes] = (cueSheetBooking.notes || '').split('\n---CUE_SHEET---\n');
                  return cueNotes?.trim() || cueSheetBooking.notes?.trim() || 'No backstage cue notes added yet. Click "Edit Notes" below to add VIP family names, CEO announcements, or performance flow!';
                })()}
              </div>
            </div>

            {/* General Agenda / Special Notes */}
            {(() => {
              const [mainNotes] = (cueSheetBooking.notes || '').split('\n---CUE_SHEET---\n');
              return mainNotes?.trim() ? (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Agenda & Dress Code Notes
                  </label>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                    {mainNotes}
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {cueSheetBooking.client_phone ? (
              <a
                href={`tel:${cueSheetBooking.client_phone}`}
                className="btn btn-ghost btn-sm"
                style={{ gap: '6px', color: '#4ade80' }}
              >
                <Phone size={14} /> Call Client POC
              </a>
            ) : <div />}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const bk = cueSheetBooking;
                  setCueSheetBooking(null);
                  openBookingModal(bk.slot_type as SlotType, bk, bk.date);
                }}
              >
                <Edit2 size={13} /> Edit Notes
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCueSheetBooking(null)}
              >
                <Check size={14} /> Ready for Stage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  {/* Calendar Sync Modal */}
  {
    initialProfile?.slug && (
      <CalendarSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        slug={initialProfile.slug}
        anchorName={initialProfile.name || 'Anchor'}
      />
    )
  }

  {/* Active Pencil Holds Quick Modal */}
  {showHoldsModal && (
    <div className="modal-backdrop" onClick={() => setShowHoldsModal(false)}>
      <div
        className="modal"
        style={{ maxWidth: '640px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <h3 className="modal-title">Active Pencil Holds ({expiringHolds.length})</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setShowHoldsModal(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto' }}>
          {expiringHolds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: 'var(--color-text-secondary)' }}>
              No active pencil holds currently.
            </div>
          ) : (
            expiringHolds.map(({ booking: bk, label, isExpired }) => {
              const bDate = new Date(bk.date + 'T00:00:00');
              const dateFormatted = bDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={bk.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderLeft: '4px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                          {bk.event_name || bk.event_type || 'Event Show'}
                        </h4>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isExpired ? '#F87171' : '#FBBF24',
                            border: isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          {label || '⏳ Hold Active'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary-light)', marginTop: '3px' }}>
                        📅 {dateFormatted} {bk.event_time ? `· ${bk.event_time}` : ''}
                      </div>
                    </div>

                    {bk.amount ? (
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#6EE7B7' }}>
                        ₹{bk.amount.toLocaleString('en-IN')}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {(bk.venue || bk.city) && (
                      <span>📍 {bk.venue ? `${bk.venue}, ` : ''}{bk.city || 'Local'}</span>
                    )}
                    {bk.client_name && (
                      <span>👤 {bk.client_name}</span>
                    )}
                    {bk.client_phone && (
                      <span>📞 {bk.client_phone}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          setShowHoldsModal(false);
                          handleConfirmHold(bk);
                        }}
                        disabled={isPending}
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontSize: '11px', padding: '4px 10px' }}
                      >
                        <CheckCircle2 size={12} /> Confirm Show
                      </button>

                      {bk.client_phone && (
                        <a
                          href={`https://wa.me/${bk.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            generateHoldNudgeMessage(bk, initialProfile?.name || 'Artist')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          style={{
                            background: '#F59E0B',
                            borderColor: '#F59E0B',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '11px',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          <MessageCircle size={12} /> ⚡ WhatsApp Nudge
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setShowHoldsModal(false);
                          openBookingModal(bk.slot_type as SlotType, bk, bk.date);
                        }}
                        style={{
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          padding: '4px 10px',
                        }}
                        title="Edit hold details directly"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setShowHoldsModal(false);
              setBookingFilter('tentative');
              const el = document.getElementById('bookings-pipeline-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ fontSize: '12px', color: '#FCD34D' }}
          >
            Scroll to Pipeline Table ↓
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowHoldsModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Bulk Booking Import / Export Modal */}
  <BookingImportExportModal
    isOpen={showImportExportModal}
    onClose={() => setShowImportExportModal(false)}
    bookings={initialBookings}
    anchorCity={initialProfile?.city}
    onSuccessReload={() => window.location.reload()}
  />
    </div>
  );
}
