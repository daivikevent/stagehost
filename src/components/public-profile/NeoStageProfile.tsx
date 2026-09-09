'use client';

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Play,
  Share2,
  Calendar,
  MapPin,
  Flame,
  CheckCircle2,
  MessageCircle,
  Clock,
  Sparkles,
  Award,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Film,
  Music,
  Radio,
  Star,
  ChevronLeft,
  ChevronRight,
  Plane,
  Globe,
  Mic,
  Activity,
  Volume2,
  Send,
} from 'lucide-react';
import type { AnchorProfile, PlanTier } from '@/types';
import {
  formatINR,
  getWhatsAppLink,
  formatEventDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
  cn,
  shouldShowBranding,
} from '@/lib/utils';
import { getEffectiveServicePackages } from '@/constants';
import styles from './NeoStageProfile.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface NeoStageProfileProps {
  profile: AnchorProfile;
  planTier: PlanTier;
  scheduleData?: {
    showCalendar: boolean;
    slotsMap: Record<string, any>;
    bookings: Array<{ date: string; slot_type: string; event_type?: string; event_name?: string; city?: string }>;
  };
  onOpenInquiry: () => void;
  onSelectDateForBooking?: (dateStr: string, preferredSlot?: 'morning' | 'evening', customMessage?: string) => void;
  onOpenShare: () => void;
  onPlayVideo: (video: { url: string; title: string; platform: string }) => void;
  onPreviewPhoto: (url: string) => void;
  onSaveContact: () => void;
  onOpenReview: () => void;
}

const TOUR_CITIES = [
  { city: 'Mumbai', tag: 'Celebrity Galas & Arenas', code: 'BOM' },
  { city: 'Delhi NCR', tag: 'Mega Arenas & Sangeets', code: 'DEL' },
  { city: 'Goa', tag: 'Destination Beach Festivals', code: 'GOI' },
  { city: 'Udaipur / Jaipur', tag: 'Palace Royal Weddings', code: 'UDR' },
  { city: 'Dubai, UAE', tag: 'International Conventions', code: 'DXB' },
  { city: 'Bengaluru', tag: 'Tech Summits & Music Fests', code: 'BLR' },
  { city: 'Hyderabad', tag: 'Grand Stadiums & Award Nights', code: 'HYD' },
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop';

const DEFAULT_STAGE_PHOTOS = [
  {
    id: 'stage-p1',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    caption: 'Arena Concert Headliner · 10,000+ Crowd Mic Control',
  },
  {
    id: 'stage-p2',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
    caption: 'Grand Celebrity Sangeet · High-Voltage Stage Interaction',
  },
  {
    id: 'stage-p3',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    caption: 'Corporate Tech Summit & Global Leadership Stage',
  },
  {
    id: 'stage-p4',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    caption: 'Stadium Festival Bass Drop · Audience Synchronization',
  },
];

export function NeoStageProfile({
  profile,
  planTier,
  scheduleData,
  onOpenInquiry,
  onSelectDateForBooking,
  onOpenShare,
  onPlayVideo,
  onPreviewPhoto,
  onSaveContact,
  onOpenReview,
}: NeoStageProfileProps) {
  const [fastPassDate, setFastPassDate] = useState('');
  const [slotType, setSlotType] = useState<'evening' | 'morning' | 'full'>('evening');
  const [targetEventType, setTargetEventType] = useState(profile.event_types?.[0] || 'Wedding / Sangeet');

  // Live Calendar State
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const daysInCalMonth = useMemo(() => getDaysInMonth(calYear, calMonth), [calYear, calMonth]);
  const firstDayOfCalMonth = useMemo(() => getFirstDayOfMonth(calYear, calMonth), [calYear, calMonth]);

  const prevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  // Month Statistics
  const calStats = useMemo(() => {
    let bookedCount = 0;
    let travelCount = 0;
    let holdCount = 0;
    let availableCount = 0;

    for (let day = 1; day <= daysInCalMonth; day++) {
      const dateStr = toDateString(new Date(calYear, calMonth, day));
      const dayDate = new Date(calYear, calMonth, day);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (isPast) continue;

      const slot = scheduleData?.slotsMap?.[dateStr];
      const isMornTravel = slot?.morning === 'travel';
      const isEveTravel = slot?.evening === 'travel';
      const isFullTravel = slot?.full_day === 'travel' || (isMornTravel && isEveTravel);

      const isMornBooked = slot?.morning === 'booked';
      const isEveBooked = slot?.evening === 'booked';
      const isFullBooked = !isFullTravel && (slot?.full_day === 'booked' || (isMornBooked && isEveBooked));

      const isMornTentative = slot?.morning === 'tentative';
      const isEveTentative = slot?.evening === 'tentative';
      const isFullTentative = slot?.full_day === 'tentative' || (isMornTentative && isEveTentative);
      const hasTentative = !isFullBooked && !isFullTravel && (isFullTentative || isMornTentative || isEveTentative);

      if (isFullTravel) travelCount++;
      else if (isFullBooked) bookedCount++;
      else if (hasTentative) holdCount++;
      else availableCount++;
    }

    return { bookedCount, travelCount, holdCount, availableCount };
  }, [calYear, calMonth, daysInCalMonth, scheduleData, today]);

  // Date selection handler
  const handleDateClick = (
    dateStr: string,
    isPast: boolean,
    isFullBooked: boolean,
    isFullTravel: boolean,
    hasTentative: boolean,
    isOnlyEveAvailable: boolean,
    isEveAvailableWithMornTravel: boolean,
    isOnlyMornAvailable: boolean,
    isMornAvailableWithEveTravel: boolean,
    isCompletelyAvailable: boolean
  ) => {
    if (isPast || isFullBooked || isFullTravel) return;
    if (hasTentative) {
      if (onSelectDateForBooking) {
        onSelectDateForBooking(
          dateStr,
          undefined,
          `Hi ${profile.name}! ⚡ I am looking at ${dateStr} on your Live Tour Radar (marked on pencil hold). I would like to lock this date with a booking token.`
        );
      } else {
        onOpenInquiry();
      }
      return;
    }
    if (isOnlyEveAvailable || isEveAvailableWithMornTravel) {
      if (onSelectDateForBooking) onSelectDateForBooking(dateStr, 'evening');
      else onOpenInquiry();
    } else if (isOnlyMornAvailable || isMornAvailableWithEveTravel) {
      if (onSelectDateForBooking) onSelectDateForBooking(dateStr, 'morning');
      else onOpenInquiry();
    } else if (isCompletelyAvailable) {
      if (onSelectDateForBooking) onSelectDateForBooking(dateStr);
      else onOpenInquiry();
    }
  };

  const featuredVideo = profile.videos && profile.videos.length > 0 ? profile.videos[0] : null;
  const otherVideos = profile.videos && profile.videos.length > 1 ? profile.videos.slice(1) : [];

  const handleFastPassLock = () => {
    const formattedDate = fastPassDate ? formatEventDate(fastPassDate) || fastPassDate : 'Upcoming Date';
    const slotLabel = slotType === 'evening' ? 'Evening Prime Slot' : slotType === 'morning' ? 'Morning / Daytime Slot' : 'Full Day Stage';

    if (profile.whatsapp_number || profile.phone) {
      const msg = `Hey ${profile.name}! ⚡ I am viewing your Neo-Stage Festival portfolio on StageHost and want to instantly lock your availability for ${formattedDate} (${slotLabel} · ${targetEventType}). Please let me know if this slot is open!`;
      window.open(getWhatsAppLink(profile.whatsapp_number || profile.phone, msg), '_blank');
    } else {
      if (onSelectDateForBooking && fastPassDate) {
        onSelectDateForBooking(fastPassDate, slotType === 'full' ? undefined : slotType);
      } else {
        onOpenInquiry();
      }
    }
  };

  const waMessage = `Hey ${profile.name}! ⚡ Inquiring from your official StageHost Neo-Stage portfolio regarding booking availability for an upcoming arena event.`;
  const waLink = getWhatsAppLink(profile.whatsapp_number || profile.phone, waMessage);

  const handleDirectWhatsApp = () => {
    if (profile.whatsapp_number || profile.phone) {
      window.open(waLink, '_blank');
    } else {
      onOpenInquiry();
    }
  };

  const avatarUrl = profile.profile_photo_url || DEFAULT_AVATAR;
  const packagesList = getEffectiveServicePackages(profile);
  const photosList = profile.photos && profile.photos.length > 0
    ? profile.photos
    : DEFAULT_STAGE_PHOTOS;

  const eventPills = profile.event_types && profile.event_types.length > 0
    ? profile.event_types
    : ['Wedding / Sangeet', 'Concert / Fest', 'Corporate Gala', 'Private VIP'];

  return (
    <div className={styles.cyberWrapper}>
      <div className={styles.cyberGridPattern} />

      {/* ---------------- Top Cyber Running Ticker ---------------- */}
      <div className={styles.topTickerBar}>
        <div className={styles.tickerTrack}>
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={styles.tickerContent}>
              <span className={styles.tickerCyan}>STAGE TERMINAL MATRIX</span>
              <span className={styles.tickerDot}>⚡</span>
              <span>NEON LIVE TOUR 2026/27</span>
              <span className={styles.tickerDot}>⚡</span>
              <span>{profile.name.toUpperCase()}</span>
              <span className={styles.tickerDot}>⚡</span>
              <span>DIRECT BOOKINGS OPEN</span>
              <span className={styles.tickerDot}>⚡</span>
              <span>ARENAS · FESTIVALS · SANGEETS · CORPORATE GALAS</span>
              <span className={styles.tickerDot}>⚡</span>
              <span>LIVE AUDIO 4K SHOWREEL</span>
              <span className={styles.tickerDot}>⚡</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Sticky Cyber HUD Header ---------------- */}
      <header className={styles.cyberHeader}>
        <div className={styles.container}>
          <div className={styles.headerNav}>
            <div className={styles.headerBrand}>
              <div className={styles.monogramBadge}>
                <Zap size={17} />
              </div>
              <div className={styles.brandTextGroup}>
                <div className={styles.brandNameRow}>
                  <span>{profile.name}</span>
                  <ShieldCheck size={15} color="#00f2fe" className={styles.verifiedShield} />
                </div>
                <div className={styles.brandSubtitle}>
                  NEO-STAGE CYBER TERMINAL · HEADLINER
                </div>
              </div>
            </div>

            <div className={styles.headerButtons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onOpenShare}
                title="Share Cyber Terminal"
                aria-label="Share"
              >
                <Share2 size={15} />
                <span className={styles.btnLabel}>Share</span>
              </button>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onSaveContact}
                title="Save Contact"
                aria-label="Save Contact"
              >
                <UserPlus size={15} />
                <span className={styles.btnLabel}>Save</span>
              </button>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnCyberNeon}
                >
                  <Zap size={14} />
                  <span className={styles.btnFullText}>Fast-Pass VIP</span>
                  <span className={styles.btnShortText}>VIP Access</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenInquiry}
                  className={styles.btnCyberNeon}
                >
                  <Zap size={14} />
                  <span className={styles.btnFullText}>Fast-Pass VIP</span>
                  <span className={styles.btnShortText}>VIP Access</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {/* ==========================================================================
           Hero Section with Holographic Stage Presence & Fast-Pass Terminal
           ========================================================================== */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            {/* Live Radar Pulse Indicator */}
            <div className={styles.heroFestivalTag}>
              <span className={styles.radarBeaconDot} />
              <span>LIVE STAGE RADAR ACTIVE · 2026/27 TOUR</span>
            </div>

            {/* Artist Holographic Avatar Pod */}
            <div className={styles.artistHoloPod}>
              <div className={styles.holoRingContainer}>
                <div className={styles.holoRingPulse} />
                <img
                  src={avatarUrl}
                  alt={profile.name}
                  className={styles.holoAvatarImg}
                />
                <div className={styles.cornerAccentTL} />
                <div className={styles.cornerAccentBR} />
              </div>
              <div className={styles.holoBadgeText}>
                <div className={styles.holoBadgeName}>{profile.name}</div>
                <div className={styles.holoBadgeRole}>
                  <Mic size={12} style={{ color: '#00f2fe' }} />
                  <span>{profile.tagline ? profile.tagline.split('·')[0] : 'Arena & Festival Headliner'}</span>
                </div>
              </div>
            </div>

            <h1 className={styles.heroCyberTitle}>
              {profile.name} <br />
              <span className={styles.heroCyberGradient}>On Stage & Arena.</span>
            </h1>

            <p className={styles.heroBioSummary}>
              {profile.bio ||
                profile.tagline ||
                'High-energy crowd catalyst, stadium concert emcee, and celebrity wedding host. Redefining modern stage presence with unmatched bilingual crowd control.'}
            </p>

            {/* Live Equalizer Audio Visualizer Simulation */}
            <div className={styles.audioVisualizerCard}>
              <div className={styles.eqHeader}>
                <div className={styles.eqTitle}>
                  <Volume2 size={14} style={{ color: '#00f2fe' }} />
                  <span>LIVE FREQUENCY TELEMETRY</span>
                </div>
                <span className={styles.eqStatusTag}>98.8 DB HIGH-ENERGY</span>
              </div>
              <div className={styles.eqBarsTrack}>
                {[14, 28, 42, 65, 80, 50, 92, 45, 70, 85, 60, 95, 78, 55, 88, 62, 40, 75, 58, 84, 90, 68, 48, 30].map((h, idx) => (
                  <div
                    key={idx}
                    className={styles.eqBar}
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(idx * 0.07).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Meta Specifications Pills */}
            <div className={styles.heroMetaRow}>
              {profile.city && (
                <span className={styles.heroMetaPill}>
                  <MapPin size={13} style={{ color: '#00f2fe' }} />
                  {profile.city}{profile.state ? `, ${profile.state}` : ''}
                </span>
              )}
              {profile.experience_years && (
                <span className={styles.heroMetaPill}>
                  <Award size={13} style={{ color: '#ff0080' }} />
                  {profile.experience_years}+ Years Tour Mastery
                </span>
              )}
              <span className={styles.heroMetaPillCyan}>
                <Flame size={13} />
                {profile.gigs_completed || '650'}+ Stages Executed
              </span>
              <span className={styles.heroMetaPill}>
                <Star size={13} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                5.0 ★ Client Rave Score
              </span>
              {profile.languages && profile.languages.length > 0 && (
                <span className={styles.heroMetaPill}>
                  <Globe size={13} style={{ color: '#38bdf8' }} />
                  {profile.languages.join(' · ')}
                </span>
              )}
            </div>

            {/* Event Specialties */}
            <div className={styles.specialtiesWrapper}>
              <span className={styles.specialtiesLabel}>SPECIALIZATIONS:</span>
              <div className={styles.specialtiesRow}>
                {eventPills.map((ev, i) => (
                  <span key={i} className={styles.specialtyChip}>
                    <Zap size={11} style={{ color: '#00f2fe' }} />
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ==========================================================================
             Fast-Pass Date Terminal Card (Upgraded Cyberdeck UI)
             ========================================================================== */}
          <div className={styles.fastPassCard}>
            <div className={styles.cardCornerTL} />
            <div className={styles.cardCornerTR} />
            <div className={styles.cardCornerBL} />
            <div className={styles.cardCornerBR} />

            <div className={styles.fastPassHeader}>
              <div className={styles.fastPassTitle}>
                <Radio size={18} style={{ color: '#00f2fe' }} />
                <span>Fast-Pass Date Terminal</span>
              </div>
              <div className={styles.fastPassLivePulse}>
                <span className={styles.livePulseDot} />
                Instant Response (&lt; 5m)
              </div>
            </div>

            <div className={styles.dateInputGroup}>
              <label>Target Event Date</label>
              <input
                type="date"
                value={fastPassDate}
                onChange={(e) => setFastPassDate(e.target.value)}
                className={styles.cyberInput}
              />
            </div>

            {/* Event Type Quick Switcher */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                Event / Production Type
              </label>
              <div className={styles.eventTypePills}>
                {eventPills.slice(0, 4).map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => setTargetEventType(et)}
                    className={`${styles.eventChip} ${targetEventType === et ? styles.eventChipActive : ''}`}
                  >
                    {et}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                Preferred Stage Slot
              </label>
              <div className={styles.slotStatusPills}>
                <button
                  type="button"
                  onClick={() => setSlotType('evening')}
                  className={`${styles.slotChip} ${slotType === 'evening' ? styles.slotChipAvailable : ''}`}
                >
                  🌙 Evening Gala
                </button>
                <button
                  type="button"
                  onClick={() => setSlotType('morning')}
                  className={`${styles.slotChip} ${slotType === 'morning' ? styles.slotChipAvailable : ''}`}
                >
                  ☀️ Daytime Slot
                </button>
                <button
                  type="button"
                  onClick={() => setSlotType('full')}
                  className={`${styles.slotChip} ${slotType === 'full' ? styles.slotChipAvailable : ''}`}
                >
                  ⚡ Full Day
                </button>
              </div>
            </div>

            <button type="button" onClick={handleFastPassLock} className={styles.fastPassLockBtn}>
              <Zap size={16} />
              <span>Lock Stage Slot Instantly</span>
              <ArrowRight size={15} />
            </button>

            <div className={styles.fastPassGuarantee}>
              <CheckCircle2 size={12} style={{ color: '#10b981' }} />
              <span>Transmits verified slot hold to WhatsApp/Host Desk instantly</span>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           Metrics Terminal Banner
           ========================================================================== */}
        <section className={styles.metricsBanner}>
          <div className={styles.metricItem}>
            <div className={styles.metricIndex}>[01]</div>
            <div className={styles.metricValue}>{profile.gigs_completed || '650'}+</div>
            <div className={styles.metricLabel}>Stages Executed</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricIndex}>[02]</div>
            <div className={styles.metricValue}>{profile.experience_years || '8'}+</div>
            <div className={styles.metricLabel}>Years Arena Mic Tour</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricIndex}>[03]</div>
            <div className={styles.metricValue}>5.0 ★</div>
            <div className={styles.metricLabel}>Client Rave Score</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricIndex}>[04]</div>
            <div className={styles.metricValue}>
              {profile.starting_price ? formatINR(profile.starting_price) : 'Custom'}
            </div>
            <div className={styles.metricLabel}>Base Performance Fee</div>
          </div>
        </section>

        {/* ==========================================================================
           Interactive Media Terminal (Live Energy Showreel)
           ========================================================================== */}
        <section className={styles.mediaTerminalSection}>
          <div className={styles.terminalHeader}>
            <div>
              <div className={styles.terminalHeading}>
                <Music size={24} style={{ color: '#00f2fe' }} />
                <span>Live Energy Showreel Terminal</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                Raw live microphone sound, massive stadium bass drops, and unfiltered audience interaction.
              </p>
            </div>

            <button type="button" onClick={handleDirectWhatsApp} className={styles.hudDockBtnPrimary}>
              <MessageCircle size={15} />
              Book Arena Date
            </button>
          </div>

          <div
            className={styles.terminalScreen}
            onClick={() => {
              if (featuredVideo) {
                onPlayVideo({
                  url: featuredVideo.url,
                  title: featuredVideo.title || `${profile.name} Live Energy Reel`,
                  platform: featuredVideo.platform || 'youtube',
                });
              } else if (profile.profile_photo_url) {
                onPreviewPhoto(profile.profile_photo_url);
              }
            }}
          >
            <img
              src={
                featuredVideo?.thumbnail_url ||
                avatarUrl ||
                'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80'
              }
              alt={`${profile.name} Festival Showreel`}
              className={styles.terminalImage}
            />

            <div className={styles.terminalOverlay}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0,0,0,0.75)', borderRadius: '999px', alignSelf: 'flex-start', border: '1px solid rgba(0, 242, 254, 0.4)', fontSize: '0.75rem', fontWeight: 700, color: '#00f2fe' }}>
                <Film size={13} />
                <span>4K MASTER SHOWREEL · LIVE STAGE FREQUENCY</span>
              </div>

              <div className={styles.neonPlayTrigger}>
                <div className={styles.neonPlayCircle}>
                  <Play size={34} style={{ fill: '#060813', stroke: 'none', marginLeft: '4px' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#fff', textTransform: 'uppercase', textShadow: '0 0 10px rgba(0, 242, 254, 0.8)' }}>
                  Launch Video Stream
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                    {featuredVideo?.title || `${profile.name} — Stadium Arena & Festival Showreel`}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                    Recorded Live across Premier Arenas, High-Octane Sangeets & Tech Summits
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    ● 100% LIVE AUDIO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Vault (Secondary Clips) */}
        {otherVideos.length > 0 && (
          <section style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Film size={18} style={{ color: '#00f2fe' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  Live Clips & Audience Interactions
                </h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {otherVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() =>
                    onPlayVideo({
                      url: vid.url,
                      title: vid.title || `${profile.name} Clip`,
                      platform: vid.platform || 'youtube',
                    })
                  }
                  className={styles.clipCard}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img
                      src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
                      alt={vid.title || 'Video'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00f2fe', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={16} style={{ fill: '#000', stroke: 'none', marginLeft: '2px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vid.title || 'Live Clip'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==========================================================================
           Curated Performance Modules & Riders
           ========================================================================== */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: '#00f2fe', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              STAGE RIDERS & PERFORMANCE MODULES
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>
              Curated Performance Modules
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '580px', margin: '8px auto 0' }}>
              Engineered for seamless event flow, energetic crowd immersion, and flawless run-of-show execution.
            </p>
          </div>

          <div className={styles.cyberPackagesGrid}>
            {packagesList.map((pkg) => {
              const priceDisplay = (pkg.price_range_min || pkg.price_range_max)
                ? (pkg.price_range_min && pkg.price_range_max
                  ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                  : pkg.price_range_min
                    ? `From ${formatINR(pkg.price_range_min)}`
                    : `Up to ${formatINR(pkg.price_range_max!)}`)
                : 'Bespoke Quote';

              const inclusions: string[] = Array.isArray((pkg as any).inclusions) && (pkg as any).inclusions.length > 0
                ? (pkg as any).inclusions
                : [
                  (pkg as any).event_type ? `${(pkg as any).event_type} Host & Crowd Emcee` : 'Festival & Arena Mic Control',
                  'Full Stage Run-of-Show Synchronization',
                  'High-Octane Audience Interaction & Energy',
                ];

              return (
                <div key={pkg.id} className={styles.cyberPackageCard}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#ff0080', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      FEATURED MODULE
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                      {pkg.name}
                    </h3>
                    <div className={styles.cyberPackagePrice}>{priceDisplay}</div>

                    {pkg.description && (
                      <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '20px' }}>
                        {pkg.description}
                      </p>
                    )}

                    <ul className={styles.cyberInclusions}>
                      {inclusions.map((inc, i) => (
                        <li key={i} className={styles.cyberInclusionItem}>
                          <Zap size={14} style={{ color: '#00f2fe', flexShrink: 0 }} />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (profile.whatsapp_number || profile.phone) {
                        const msg = `Hey ${profile.name}! ⚡ I am looking to book your "${pkg.name}" module for an upcoming event (${priceDisplay}). Let's discuss details and dates!`;
                        window.open(getWhatsAppLink(profile.whatsapp_number || profile.phone, msg), '_blank');
                      } else {
                        onOpenInquiry();
                      }
                    }}
                    className={styles.cyberBookBtn}
                  >
                    <span>Reserve Module</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==========================================================================
           Tour Routing & Active Destination Hubs
           ========================================================================== */}
        <section className={styles.tourTimelineSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: '#00f2fe' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Tour Routing & Active Destination Hubs
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
            Frequently touring key circuits with streamlined flight logistics across India & worldwide.
          </p>

          <div className={styles.tourTimelineGrid}>
            {(profile.tour_cities && profile.tour_cities.length > 0 ? profile.tour_cities : TOUR_CITIES).map((c, i) => (
              <div key={i} className={styles.tourCityChip}>
                <MapPin size={13} style={{ color: '#ff0080' }} />
                <span style={{ fontWeight: 700, color: '#fff' }}>{c.city}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>· {c.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
           Live Tour Schedule & Telemetry Calendar
           ========================================================================== */}
        <section id="live-calendar" className={styles.calendarSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 10px #00f2fe' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              // LIVE TOUR TELEMETRY · AVAILABILITY RADAR
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Tour Schedule & Live Dates
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '650px', marginBottom: '28px' }}>
            Real-time availability matrix across arena shows, corporate summits, and private stages. Click any open slot to transmit a lock-in inquiry.
          </p>

          {scheduleData?.showCalendar !== false ? (
            <div className={styles.cyberCalendarCard}>
              {/* Header */}
              <div className={styles.calendarHeader}>
                <button
                  type="button"
                  onClick={prevCalMonth}
                  className={styles.cyberNavBtn}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} /> PREV
                </button>

                <div className={styles.monthTitleWrapper}>
                  <div className={styles.cyberMonthTitle}>
                    {MONTHS[calMonth]} {calYear}
                  </div>
                  <div className={styles.cyberMonthCode}>
                    <span>RADAR://ACTIVE_TELEMETRY</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextCalMonth}
                  className={styles.cyberNavBtn}
                  title="Next Month"
                >
                  NEXT <ChevronRight size={16} />
                </button>
              </div>

              {/* Telemetry Strip */}
              <div className={styles.telemetryStrip}>
                <div className={styles.telemetryBox}>
                  <div className={styles.telemetryVal} style={{ color: '#ff0080' }}>
                    <span>●</span> {calStats.bookedCount}
                  </div>
                  <div className={styles.telemetryLabel}>[LOCKED SHOWS]</div>
                </div>
                <div className={styles.telemetryBox}>
                  <div className={styles.telemetryVal} style={{ color: '#00f2fe' }}>
                    <span>◆</span> {calStats.availableCount}
                  </div>
                  <div className={styles.telemetryLabel}>[OPEN SLOTS]</div>
                </div>
                <div className={styles.telemetryBox}>
                  <div className={styles.telemetryVal} style={{ color: '#38bdf8' }}>
                    <Plane size={14} /> {calStats.travelCount}
                  </div>
                  <div className={styles.telemetryLabel}>[TRANSIT BUFFER]</div>
                </div>
                <div className={styles.telemetryBox}>
                  <div className={styles.telemetryVal} style={{ color: '#fbbf24' }}>
                    <span>⚡</span> {calStats.holdCount}
                  </div>
                  <div className={styles.telemetryLabel}>[PENCIL HOLDS]</div>
                </div>
              </div>

              {/* Legend */}
              <div className={styles.cyberLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.dotCyan} /> [OPEN FOR BOOKING]
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotPink} /> [CONFIRMED SHOW]
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotBlue} /> [FLIGHT / TRANSIT]
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.dotAmber} /> [PENCIL HOLD]
                </div>
              </div>

              {/* Weekdays */}
              <div className={styles.cyberWeekdays}>
                {WEEKDAYS.map((w) => (
                  <div key={w} className={styles.cyberWeekdayCell}>
                    [{w}]
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className={styles.cyberDaysGrid}>
                {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.cyberDayEmpty} />
                ))}

                {Array.from({ length: daysInCalMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateString(new Date(calYear, calMonth, day));
                  const dayDate = new Date(calYear, calMonth, day);
                  const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isCurrentToday =
                    day === today.getDate() &&
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear();

                  const slot = scheduleData?.slotsMap?.[dateStr];
                  const dayBookings = scheduleData?.bookings?.filter((b) => b.date === dateStr) || [];
                  const morningBooking = dayBookings.find((b) => b.slot_type === 'morning');
                  const eveningBooking = dayBookings.find((b) => b.slot_type === 'evening');
                  const fullBooking = dayBookings.find((b) => b.slot_type === 'full_day');
                  const isMornTravel = slot?.morning === 'travel';
                  const isEveTravel = slot?.evening === 'travel';
                  const isFullTravel = slot?.full_day === 'travel' || (isMornTravel && isEveTravel);

                  const isMornBooked = slot?.morning === 'booked';
                  const isEveBooked = slot?.evening === 'booked';
                  const isFullBooked = !isFullTravel && (slot?.full_day === 'booked' || (isMornBooked && isEveBooked));

                  const isMornTentative = slot?.morning === 'tentative';
                  const isEveTentative = slot?.evening === 'tentative';
                  const isFullTentative = slot?.full_day === 'tentative' || (isMornTentative && isEveTentative);
                  const hasTentative = !isFullBooked && !isFullTravel && (isFullTentative || isMornTentative || isEveTentative);

                  // Partial availability
                  const isOnlyEveAvailable = !isPast && isMornBooked && !isEveBooked && !isEveTravel && !isFullTravel;
                  const isOnlyMornAvailable = !isPast && isEveBooked && !isMornBooked && !isMornTravel && !isFullTravel;
                  const isEveAvailableWithMornTravel = !isPast && isMornTravel && !isEveBooked && !isEveTravel && !isFullTravel;
                  const isMornAvailableWithEveTravel = !isPast && isEveTravel && !isMornBooked && !isMornTravel && !isFullTravel;

                  const isCompletelyAvailable = !isPast && !isFullBooked && !hasTentative && !isMornBooked && !isEveBooked && !isFullTravel && !isMornTravel && !isEveTravel;

                  const eventCity = (fullBooking || morningBooking || eveningBooking)?.city || '';
                  const travelBooking = dayBookings.find((b) => b.event_type === 'Travel');
                  const travelCity = travelBooking?.city && travelBooking.city !== 'In Transit' ? travelBooking.city : '';
                  const isTwoSeparateShows = !fullBooking && slot?.full_day !== 'booked' && (!!morningBooking && !!eveningBooking);

                  return (
                    <div
                      key={day}
                      className={cn(
                        styles.cyberDayCell,
                        isCurrentToday && styles.dayToday,
                        isPast && styles.dayPast,
                        isFullBooked && styles.dayBooked,
                        isFullTravel && styles.dayTravel,
                        hasTentative && styles.dayHold
                      )}
                      onClick={() =>
                        handleDateClick(
                          dateStr,
                          isPast,
                          isFullBooked,
                          isFullTravel,
                          hasTentative,
                          isOnlyEveAvailable,
                          isEveAvailableWithMornTravel,
                          isOnlyMornAvailable,
                          isMornAvailableWithEveTravel,
                          isCompletelyAvailable
                        )
                      }
                      style={{
                        cursor: isPast || isFullBooked || isFullTravel ? 'default' : 'pointer',
                      }}
                      title={
                        isFullTravel
                          ? 'Blocked for Travel / Transit'
                          : isFullBooked
                            ? `Booked (${morningBooking?.event_name || ''} · ${eveningBooking?.event_name || fullBooking?.event_name || ''})`
                            : hasTentative
                              ? 'Date on Tentative Pencil Hold — Click to Inquire'
                              : isOnlyEveAvailable
                                ? 'Morning booked. Evening is AVAILABLE!'
                                : isOnlyMornAvailable
                                  ? 'Evening booked. Morning is AVAILABLE!'
                                  : isEveAvailableWithMornTravel
                                    ? 'Morning transit buffer. Evening is AVAILABLE!'
                                    : isMornAvailableWithEveTravel
                                      ? 'Evening transit buffer. Morning is AVAILABLE!'
                                      : 'Available for booking'
                      }
                    >
                      <div className={styles.dayCellTop}>
                        <span className={styles.dayNum}>{day}</span>
                        {isCurrentToday && <span className={styles.todayTag}>NOW</span>}
                      </div>

                      <div className={styles.chipWrap}>
                        {isFullTravel ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipTransit)}>
                              <Plane size={9} /> FLIGHT
                            </span>
                            {travelCity && <span className={styles.cityText}>{travelCity}</span>}
                          </>
                        ) : isTwoSeparateShows ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipLocked)}>
                              ● 2 SHOWS
                            </span>
                            {eventCity && <span className={styles.cityText}>{eventCity}</span>}
                          </>
                        ) : isFullBooked ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipLocked)}>
                              ● LOCKED
                            </span>
                            {eventCity && <span className={styles.cityText}>{eventCity}</span>}
                          </>
                        ) : hasTentative ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipHold)}>
                              ⚡ HOLD
                            </span>
                            {eventCity && <span className={styles.cityText}>{eventCity}</span>}
                          </>
                        ) : isEveAvailableWithMornTravel ? (
                          <span className={cn(styles.cyberChip, styles.chipSplit)}>
                            ✈ MORN · 🌙 EVE
                          </span>
                        ) : isMornAvailableWithEveTravel ? (
                          <span className={cn(styles.cyberChip, styles.chipSplit)}>
                            ☀️ MORN · ✈ EVE
                          </span>
                        ) : isOnlyEveAvailable ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipAvailable)}>
                              🌙 EVE FREE
                            </span>
                            {morningBooking?.city && <span className={styles.cityText}>{morningBooking.city}</span>}
                          </>
                        ) : isOnlyMornAvailable ? (
                          <>
                            <span className={cn(styles.cyberChip, styles.chipAvailable)}>
                              ☀️ MORN FREE
                            </span>
                            {eveningBooking?.city && <span className={styles.cityText}>{eveningBooking.city}</span>}
                          </>
                        ) : isPast ? (
                          <span style={{ fontSize: '9px', color: '#475569' }}>—</span>
                        ) : (
                          <span className={cn(styles.cyberChip, styles.chipAvailable)}>
                            OPEN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className={styles.calendarFooterAction}>
                <button
                  type="button"
                  onClick={onOpenInquiry}
                  className={styles.cyberCtaBtn}
                >
                  <Calendar size={15} /> Transmit Custom Date Inquiry
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.cyberAvailabilityFallback}>
              <Calendar size={32} style={{ color: '#00f2fe' }} />
              <h3>Check Live Radar Availability</h3>
              <p>
                Interested in locking in {profile.name} for your upcoming arena show, festival, or private gala? Transmit your event specs for immediate review.
              </p>
              <button
                type="button"
                onClick={onOpenInquiry}
                className={styles.cyberCtaBtn}
              >
                <Calendar size={15} /> Check Availability Now
              </button>
            </div>
          )}
        </section>

        {/* ==========================================================================
           Stage Presence & Crowd Captures Gallery
           ========================================================================== */}
        <section className={styles.photoSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 10px #00f2fe' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              // HIGH-RES TRANSMISSION · VISUAL REPERTOIRE
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Stage Presence & Crowd Captures
          </h3>

          <div className={styles.photoGrid}>
            {photosList.map((photo) => (
              <div
                key={photo.id}
                className={styles.photoCard}
                onClick={() => onPreviewPhoto(photo.url)}
              >
                <img src={photo.url} alt={photo.caption || 'Live Stage Performance'} />
                <div className={styles.cardCornerTL} />
                <div className={styles.cardCornerBR} />
                <div className={styles.photoOverlay}>
                  <span className={styles.photoCaption}>{photo.caption || 'Live Arena Engagement'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
           Verified Client Testimonials & Transmissions Feed
           ========================================================================== */}
        {profile.testimonials && profile.testimonials.length > 0 && (
          <section className={styles.testimonialsSection}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0080', boxShadow: '0 0 10px #ff0080' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, color: '#ff0080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    // CLIENT TRANSMISSIONS · VERIFIED TELEMETRY
                  </span>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                  Direct Testimonials & Event Feedback
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>
                  Verified reports from concert producers, corporate summit heads, and celebrity couples.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenReview}
                className={styles.transmitReviewBtn}
              >
                <Sparkles size={14} /> + Transmit Review
              </button>
            </div>

            <div className={styles.cyberReviewGrid}>
              {profile.testimonials.map((test) => (
                <div key={test.id} className={styles.cyberReviewCard}>
                  <div className={styles.cyberReviewCardTop}>
                    <div className={styles.starsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < (test.rating || 5) ? styles.starFilled : ''}
                          style={{
                            color: i < (test.rating || 5) ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                            fill: i < (test.rating || 5) ? '#fbbf24' : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span className={styles.verifiedChip}>
                      <ShieldCheck size={12} /> VERIFIED CLIENT
                    </span>
                  </div>

                  <p className={styles.cyberReviewText}>
                    “{test.text}”
                  </p>

                  <div className={styles.cyberReviewAuthor}>
                    <div className={styles.authorAvatar}>
                      {test.client_name ? test.client_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className={styles.authorInfo}>
                      <div className={styles.authorName}>{test.client_name}</div>
                      <div className={styles.authorTag}>
                        {test.client_designation || test.event_type || 'Private Client'}
                        {test.event_date ? ` · ${test.event_date}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==========================================================================
           Direct Stage Booking / Fast Rider Transmit Banner
           ========================================================================== */}
        <section className={styles.preFooterCtaBox}>
          <div className={styles.preFooterInner}>
            <div className={styles.preFooterBadge}>
              <Zap size={14} style={{ color: '#00f2fe' }} />
              <span>DIRECT STAGE BOOKING DESK</span>
            </div>
            <h2 className={styles.preFooterHeading}>
              Planning a Stadium Concert, Celebrity Sangeet, or Corporate Arena?
            </h2>
            <p className={styles.preFooterSub}>
              Lock in {profile.name} directly. Check live date availability, request bespoke technical rider specifications, and get instant booking confirmation.
            </p>
            <div className={styles.preFooterBtnRow}>
              <button type="button" onClick={handleDirectWhatsApp} className={styles.hudDockBtnPrimary}>
                <MessageCircle size={16} />
                <span>Instant WhatsApp Inquiry</span>
              </button>
              <button type="button" onClick={onOpenInquiry} className={styles.hudDockBtnGhost}>
                <Send size={15} />
                <span>Transmit Formal Rider</span>
              </button>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           Platform Branding Footer (StageHost Disclaimer)
           ========================================================================== */}
        {shouldShowBranding(planTier, 'footer') && (
          <footer className={styles.cyberFooter}>
            <a href="https://stagehost.in/" target="_blank" rel="noopener noreferrer">
              <Sparkles size={14} color="#00f2fe" />
              <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
            </a>
            <div className={styles.cyberFooterNotice}>
              StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
            </div>
          </footer>
        )}
      </div>

      {/* ==========================================================================
         Floating Cyber HUD Bottom Bar
         ========================================================================== */}
      <aside className={styles.cyberHudDock}>
        <div className={styles.dockStatusGroup}>
          <span className={styles.livePulseDot} />
          <span className={styles.dockStatusText}>Stage Terminal</span>
        </div>

        <button type="button" onClick={handleDirectWhatsApp} className={styles.hudDockBtnPrimary}>
          <MessageCircle size={15} />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('live-calendar');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              onOpenInquiry();
            }
          }}
          className={styles.hudDockBtnGhost}
        >
          <Calendar size={14} />
          <span>Tour Radar</span>
        </button>

        <button type="button" onClick={onSaveContact} className={styles.hudDockBtnGhost}>
          <UserPlus size={14} />
          <span>Save Contact</span>
        </button>
      </aside>
    </div>
  );
}
