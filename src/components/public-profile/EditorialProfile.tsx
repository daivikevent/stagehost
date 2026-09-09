'use client';

import React, { useState, useMemo } from 'react';
import {
  Crown,
  Star,
  Play,
  Share2,
  Calendar,
  MapPin,
  CheckCircle2,
  MessageCircle,
  Phone,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  Plane,
  ShieldCheck,
  UserPlus,
  ArrowUpRight,
  Clock,
  Film,
  Globe,
} from 'lucide-react';
import { InstagramIcon as Instagram, YoutubeIcon as Youtube, FacebookIcon as Facebook } from '@/components/ui/SocialIcons';
import type { AnchorProfile, PlanTier } from '@/types';
import {
  formatINR,
  getWhatsAppLink,
  getVideoEmbedInfo,
  normalizeExternalUrl,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
  cn,
  shouldShowBranding,
} from '@/lib/utils';
import { getEffectiveServicePackages } from '@/constants';
import styles from './EditorialProfile.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EditorialProfileProps {
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

const LUXURY_BRANDS = [
  'Taj Hotels & Palaces',
  'Forbes India Gala',
  'BMW Excellence Club',
  'Marriott Bonvoy',
  'Filmfare Red Carpet',
  'The Oberoi Group',
  'Rolls-Royce Motor Cars',
  'Hyatt Regency',
  'TEDx Conferences',
  'Vogue Weddings',
];

export function EditorialProfile({
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
}: EditorialProfileProps) {
  const featuredVideo = profile.videos && profile.videos.length > 0 ? profile.videos[0] : null;
  const otherVideos = profile.videos && profile.videos.length > 1 ? profile.videos.slice(1) : [];

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
          `Hi ${profile.name}! I noticed ${dateStr} is currently marked on tentative pencil hold. I would like to check availability and lock this date with an advance token.`
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

  const waMessage = `Hello ${profile.name}! 👋 I am viewing your official Vogue Editorial showcase on StageHost and would love to inquire about your availability and bespoke packages for an upcoming event.`;
  const waLink = getWhatsAppLink(profile.whatsapp_number || profile.phone, waMessage);

  const handleWhatsAppInquiry = () => {
    if (profile.whatsapp_number || profile.phone) {
      window.open(waLink, '_blank');
    } else {
      onOpenInquiry();
    }
  };

  const packagesList = getEffectiveServicePackages(profile);

  return (
    <div className={styles.editorialWrapper}>
      {/* ---------------- Top Ticker Bar ---------------- */}
      <div className={styles.topTickerBar}>
        <div className={styles.tickerTrack}>
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={styles.tickerContent}>
              <span className={styles.tickerGold}>STAGEHOST PRIVATE DOSSIER</span>
              <span className={styles.tickerDot}>✦</span>
              <span>ISSUE № 24</span>
              <span className={styles.tickerDot}>✦</span>
              <span>{profile.name.toUpperCase()}</span>
              <span className={styles.tickerDot}>✦</span>
              <span>WORLDWIDE TOUR CALENDAR OPEN</span>
              <span className={styles.tickerDot}>✦</span>
              <span>DIRECT HONORARIUMS</span>
              <span className={styles.tickerDot}>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Editorial Masthead Header ---------------- */}
      <header className={styles.editorialHeader}>
        <div className={styles.container}>
          <div className={styles.headerNav}>
            <div className={styles.headerBrand}>
              <div className={styles.monogramBadge}>
                <Crown size={16} />
              </div>
              <div className={styles.brandTextGroup}>
                <div className={styles.brandNameRow}>
                  <span>{profile.name}</span>
                  <ShieldCheck size={15} color="#d4af37" className={styles.verifiedShield} />
                </div>
                <div className={styles.brandSubtitle}>
                  Vogue Editorial Dossier · Official Host
                </div>
              </div>
            </div>

            <div className={styles.headerButtons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onOpenShare}
                title="Share Editorial Profile"
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
                  className={styles.btnEditorialGold}
                >
                  <MessageCircle size={14} />
                  <span className={styles.conciergeFullText}>Bespoke Concierge</span>
                  <span className={styles.conciergeShortText}>Concierge</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onOpenInquiry}
                  className={styles.btnEditorialGold}
                >
                  <MessageCircle size={14} />
                  <span className={styles.conciergeFullText}>Bespoke Concierge</span>
                  <span className={styles.conciergeShortText}>Concierge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.container}>

        {/* Hero Billboard Typography */}
        <section className={styles.heroSection}>
          <span className={styles.heroSuperTitle}>Exclusive Artist Spotlight</span>

          <h1 className={styles.heroArtistName}>
            {profile.name} <span className={styles.heroArtistNameItalic}>Live</span>
          </h1>

          <p className={styles.heroTagline}>
            {profile.tagline || 'Celebrity Wedding & High-Octane Corporate Emcee. Captivating audiences worldwide.'}
          </p>

          {/* Meta Pills */}
          <div className={styles.heroMetaRow}>
            {profile.city && (
              <span className={styles.heroMetaPill}>
                <MapPin size={13} style={{ color: '#d4af37' }} />
                {profile.city}{profile.state ? `, ${profile.state}` : ''}
              </span>
            )}
            {profile.experience_years && (
              <span className={styles.heroMetaPill}>
                <Award size={13} style={{ color: '#d4af37' }} />
                {profile.experience_years}+ Years Master of Ceremonies
              </span>
            )}
            {profile.gigs_completed && (
              <span className={styles.heroMetaPillGold}>
                <Sparkles size={13} style={{ color: '#d4af37' }} />
                {profile.gigs_completed}+ Landmark Stages Executed
              </span>
            )}
            <span className={styles.heroMetaPill}>
              <Star size={13} style={{ color: '#d4af37', fill: '#d4af37' }} />
              5.0 ★ Client Trust Rating
            </span>
          </div>

          {/* Billboard-Scale Widescreen 16:9 Showcase Frame */}
          <div
            className={styles.billboardHeroFrame}
            onClick={() => {
              if (featuredVideo) {
                onPlayVideo({
                  url: featuredVideo.url,
                  title: featuredVideo.title || `${profile.name} Showreel`,
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
                profile.profile_photo_url ||
                'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80'
              }
              alt={`${profile.name} Showcase`}
              className={styles.billboardImage}
            />

            <div className={styles.billboardOverlay}>
              <div className={styles.billboardTopTag}>
                <Film size={12} style={{ color: '#d4af37' }} />
                <span>Cinematic Showreel · Master 4K Frame</span>
              </div>

              <div className={styles.billboardCenterPlay}>
                <div className={styles.playCircleGold}>
                  <Play size={32} style={{ fill: '#08070d', stroke: 'none', marginLeft: '4px' }} />
                </div>
                <span className={styles.playLabel}>Watch Headline Showreel</span>
              </div>

              <div className={styles.billboardBottomInfo}>
                <div>
                  <div className={styles.billboardReelTitle}>
                    {featuredVideo?.title || `${profile.name} — Live Stage Atmosphere & Audience Energy`}
                  </div>
                  <div className={styles.billboardReelSub}>
                    Official Highlight Reel · Live Arena & Luxury Wedding Sets
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsAppInquiry();
                  }}
                  className={styles.dockBtnGold}
                  style={{ alignSelf: 'center' }}
                >
                  <MessageCircle size={15} />
                  Inquire For Event Date
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Luxury Brand Marquee Ticker */}
      <section className={styles.marqueeSection}>
        <div className={styles.marqueeTrack}>
          {(() => {
            const brands = (profile.client_brands && profile.client_brands.length > 0)
              ? profile.client_brands
              : LUXURY_BRANDS;
            return brands.concat(brands).map((brand, i) => (
              <div key={i} className={styles.marqueeItem}>
                <span>{brand}</span>
                <span className={styles.marqueeDot}>✦</span>
              </div>
            ));
          })()}
        </div>
      </section>

      <div className={styles.container}>
        {/* Monograph / Bio Spread Section */}
        <section className={styles.editorialSectionHeader}>
          <span className={styles.sectionRomanNum}>SECTION I</span>
          <h2 className={styles.sectionMainHeading}>The Monograph</h2>
          <p className={styles.sectionSubHeading}>
            An uncompromising commitment to stagecraft, audience calibration, and spontaneous wit.
          </p>
        </section>

        <div className={styles.monographGrid}>
          <div className={styles.monographBio}>
            <span className={styles.dropCap}>
              {profile.bio ? profile.bio.charAt(0).toUpperCase() : 'W'}
            </span>
            {profile.bio ? (
              <p style={{ whiteSpace: 'pre-line' }}>{profile.bio}</p>
            ) : (
              <p>
                Renowned for commanding stages with magnetic poise and dynamic crowd control, {profile.name} brings an
                inimitable blend of sophistication, bilingual fluency, and unforgettable energy to every occasion.
                From intimate high-profile celebrations to stadium-scale corporate conventions, each engagement is
                treated as an artistic masterpiece.
              </p>
            )}

            {/* Social Icons Strip */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '28px' }}>
              {profile.instagram_url && (
                <a
                  href={normalizeExternalUrl(profile.instagram_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                >
                  <Instagram size={16} /> Instagram
                </a>
              )}
              {profile.youtube_url && (
                <a
                  href={normalizeExternalUrl(profile.youtube_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                >
                  <Youtube size={16} /> YouTube
                </a>
              )}
              {profile.website_url && (
                <a
                  href={normalizeExternalUrl(profile.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={16} /> Website
                </a>
              )}
            </div>
          </div>

          <div className={styles.monographStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.gigs_completed || '650'}+</div>
              <div className={styles.statLabel}>Curated Events Hosted</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.experience_years || '10'}+</div>
              <div className={styles.statLabel}>Years Industry Tenure</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Audience Retention</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {profile.starting_price ? formatINR(profile.starting_price) : 'Custom'}
              </div>
              <div className={styles.statLabel}>Starting Honorarium</div>
            </div>
          </div>
        </div>

        {/* Repertoire / Service Packages */}
        {packagesList.length > 0 && (
          <>
            <section className={styles.editorialSectionHeader}>
              <span className={styles.sectionRomanNum}>SECTION II</span>
              <h2 className={styles.sectionMainHeading}>Private Engagements</h2>
              <p className={styles.sectionSubHeading}>
                Signature hosting packages customized for weddings, corporate summits, and private galas.
              </p>
            </section>

            <div className={styles.packagesGrid}>
              {packagesList.map((pkg) => {
                const priceDisplay = (pkg.price_range_min || pkg.price_range_max)
                  ? (pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                        ? `From ${formatINR(pkg.price_range_min)}`
                        : `Up to ${formatINR(pkg.price_range_max!)}`)
                  : 'Custom Honorarium';

                const inclusions: string[] = Array.isArray((pkg as any).inclusions) && (pkg as any).inclusions.length > 0
                  ? (pkg as any).inclusions
                  : [
                      pkg.event_type ? `${pkg.event_type} Curation & Hosting` : 'Signature Stage Presence',
                      'High-Impact Guest Calibration & Wit',
                      'Pre-Event Briefing & Run of Show',
                    ];

                return (
                  <div key={pkg.id} className={styles.packageVogueCard}>
                    <div>
                      <div className={styles.packageCardHeader}>
                        <h3 className={styles.packageVogueTitle}>{pkg.name}</h3>
                        <div className={styles.packageVoguePrice}>{priceDisplay}</div>
                        {pkg.event_type && (
                          <div style={{ fontSize: '0.78rem', color: '#d4af37', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {pkg.event_type}
                          </div>
                        )}
                      </div>

                      {pkg.description && (
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', marginBottom: '20px' }}>
                          {pkg.description}
                        </p>
                      )}

                      <ul className={styles.packageInclusionsList}>
                        {inclusions.map((inc, idx) => (
                          <li key={idx} className={styles.packageInclusionItem}>
                            <Crown size={14} className={styles.inclusionIcon} />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (profile.whatsapp_number) {
                          const msg = `Hi ${profile.name}! 👋 I am interested in booking your "${pkg.name}" package (${priceDisplay}). Could you please confirm date availability?`;
                          window.open(getWhatsAppLink(profile.whatsapp_number, msg), '_blank');
                        } else {
                          onOpenInquiry();
                        }
                      }}
                      className={styles.vogueBookBtn}
                    >
                      Reserve Engagement <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Video Reels Gallery */}
        {otherVideos.length > 0 && (
          <>
            <section className={styles.editorialSectionHeader}>
              <span className={styles.sectionRomanNum}>SECTION III</span>
              <h2 className={styles.sectionMainHeading}>The Showreel Vault</h2>
              <p className={styles.sectionSubHeading}>
                Capturing high-voltage crowd reactions, keynote openings, and sangeet celebrations.
              </p>
            </section>

            <div className={styles.videosGrid}>
              {otherVideos.map((vid) => (
                <div
                  key={vid.id}
                  className={styles.videoCard}
                  onClick={() =>
                    onPlayVideo({
                      url: vid.url,
                      title: vid.title || `${profile.name} Reel`,
                      platform: vid.platform || 'youtube',
                    })
                  }
                >
                  <div className={styles.videoThumbWrapper}>
                    <img
                      src={vid.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
                      alt={vid.title || 'Video Reel'}
                      className={styles.videoThumb}
                    />
                    <div className={styles.videoMiniPlay}>
                      <div className={styles.miniPlayIcon}>
                        <Play size={18} style={{ fill: '#08070d', stroke: 'none', marginLeft: '2px' }} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.videoCardBody}>
                    <div className={styles.videoTitle}>{vid.title || 'Live Event Performance'}</div>
                    <div className={styles.videoPlatform}>{vid.platform || 'Video Showcase'}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SECTION IV: Live Itinerary & Availability Calendar */}
        <section id="live-calendar" className={styles.calendarSection}>
          <div className={styles.editorialSectionHeader}>
            <span className={styles.sectionRomanNum}>SECTION IV</span>
            <h2 className={styles.sectionMainHeading}>Live Itinerary & Tour Availability</h2>
            <p className={styles.sectionSubHeading}>
              Real-time schedule of confirmed private galas, destination weddings, and corporate summits. Click any available date to submit an inquiry.
            </p>
          </div>

          {scheduleData?.showCalendar !== false ? (
            <div className={styles.calendarCard}>
              {/* Calendar Header with Month Navigation */}
              <div className={styles.calendarHeader}>
                <button
                  type="button"
                  onClick={prevCalMonth}
                  className={styles.navArrowBtn}
                  title="Previous Month"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className={styles.monthTitleWrapper}>
                  <div className={styles.monthTitle}>
                    {MONTHS[calMonth]} {calYear}
                  </div>
                  <div className={styles.monthSubtitle}>Live Availability Matrix</div>
                </div>

                <button
                  type="button"
                  onClick={nextCalMonth}
                  className={styles.navArrowBtn}
                  title="Next Month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Stats Strip */}
              <div className={styles.statsStrip}>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: '#ef4444' }}>
                    <span>●</span> {calStats.bookedCount}
                  </div>
                  <div className={styles.statLabel}>Confirmed Shows</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: '#10b981' }}>
                    <span>◈</span> {calStats.availableCount}
                  </div>
                  <div className={styles.statLabel}>Open Dates</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: '#3b82f6' }}>
                    <Plane size={14} /> {calStats.travelCount}
                  </div>
                  <div className={styles.statLabel}>Transit Buffers</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: '#f59e0b' }}>
                    <span>⚡</span> {calStats.holdCount}
                  </div>
                  <div className={styles.statLabel}>Pencil Holds</div>
                </div>
              </div>

              {/* Legend */}
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDotAvailable} /> Available for Booking
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDotBooked} /> Confirmed / Reserved
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDotTravel} /> Transit / Flight Buffer
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDotHold} /> Tentative Hold
                </div>
              </div>

              {/* Weekdays Row */}
              <div className={styles.weekdaysRow}>
                {WEEKDAYS.map((w) => (
                  <div key={w} className={styles.weekdayHeader}>
                    {w}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className={styles.daysGrid}>
                {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.dayEmpty} />
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
                        styles.dayCell,
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
                          ? `Reserved (${morningBooking?.event_name || ''} · ${eveningBooking?.event_name || fullBooking?.event_name || ''})`
                          : hasTentative
                          ? 'Tentative Pencil Hold — Click to Inquire & Challenge Date'
                          : isOnlyEveAvailable
                          ? 'Morning booked. Evening is AVAILABLE!'
                          : isOnlyMornAvailable
                          ? 'Evening booked. Morning is AVAILABLE!'
                          : isEveAvailableWithMornTravel
                          ? 'Morning transit buffer. Evening is AVAILABLE!'
                          : isMornAvailableWithEveTravel
                          ? 'Evening transit buffer. Morning is AVAILABLE!'
                          : 'Available for private engagement'
                      }
                    >
                      <div className={styles.dayCellTop}>
                        <span className={styles.dayNum}>{day}</span>
                        {isCurrentToday && <span className={styles.todayTag}>TODAY</span>}
                      </div>

                      <div className={styles.badgeWrap}>
                        {isFullTravel ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeTravel)}>
                              <Plane size={9} /> Transit
                            </span>
                            {travelCity && <span className={styles.dayCity}>{travelCity}</span>}
                          </>
                        ) : isTwoSeparateShows ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeBooked)}>
                              ● 2 Shows
                            </span>
                            {eventCity && <span className={styles.dayCity}>{eventCity}</span>}
                          </>
                        ) : isFullBooked ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeBooked)}>
                              ● Reserved
                            </span>
                            {eventCity && <span className={styles.dayCity}>{eventCity}</span>}
                          </>
                        ) : hasTentative ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeHold)}>
                              ⚡ Hold
                            </span>
                            {eventCity && <span className={styles.dayCity}>{eventCity}</span>}
                          </>
                        ) : isEveAvailableWithMornTravel ? (
                          <span className={cn(styles.dayBadge, styles.badgeSplit)} title="Morning Travel · Evening Free">
                            <span className={styles.badgeDesktopText}>✈ Morn · 🌙 Eve</span>
                            <span className={styles.badgeMobileText}>✈ Split</span>
                          </span>
                        ) : isMornAvailableWithEveTravel ? (
                          <span className={cn(styles.dayBadge, styles.badgeSplit)} title="Morning Free · Evening Travel">
                            <span className={styles.badgeDesktopText}>☀️ Morn · ✈ Eve</span>
                            <span className={styles.badgeMobileText}>✈ Split</span>
                          </span>
                        ) : isOnlyEveAvailable ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeAvailable)}>
                              <span className={styles.badgeDesktopText}>🌙 Eve Free</span>
                              <span className={styles.badgeMobileText}>🌙 Eve</span>
                            </span>
                            {morningBooking?.city && <span className={styles.dayCity}>{morningBooking.city}</span>}
                          </>
                        ) : isOnlyMornAvailable ? (
                          <>
                            <span className={cn(styles.dayBadge, styles.badgeAvailable)}>
                              <span className={styles.badgeDesktopText}>☀️ Morn Free</span>
                              <span className={styles.badgeMobileText}>☀️ Morn</span>
                            </span>
                            {eveningBooking?.city && <span className={styles.dayCity}>{eveningBooking.city}</span>}
                          </>
                        ) : isPast ? (
                          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                        ) : (
                          <span className={cn(styles.dayBadge, styles.badgeAvailable)}>
                            <span className={styles.badgeDesktopText}>Available</span>
                            <span className={styles.badgeMobileText}>Open</span>
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
                  className={styles.requestDateBtn}
                >
                  <Calendar size={15} /> Request Unlisted Date / Custom Engagement
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.availabilityFallbackCard}>
              <Calendar size={32} style={{ color: '#d4af37' }} />
              <h3>Check Live Availability</h3>
              <p>
                Interested in booking {profile.name} for your event? Send an inquiry with your dates and event location for an immediate quote and timeline confirmation.
              </p>
              <button
                type="button"
                onClick={onOpenInquiry}
                className={styles.requestDateBtn}
              >
                <Calendar size={15} /> Check Availability Now
              </button>
            </div>
          )}
        </section>

        {/* Photos Gallery */}
        {profile.photos && profile.photos.length > 0 && (
          <>
            <section className={styles.editorialSectionHeader}>
              <span className={styles.sectionRomanNum}>SECTION V</span>
              <h2 className={styles.sectionMainHeading}>Editorial Gallery</h2>
              <p className={styles.sectionSubHeading}>
                Stage presence, backstage couture, and grand ballroom celebrations.
              </p>
            </section>

            <div className={styles.photosGrid}>
              {profile.photos.map((photo) => (
                <div
                  key={photo.id}
                  className={styles.photoFrame}
                  onClick={() => onPreviewPhoto(photo.url)}
                >
                  <img src={photo.url} alt={photo.caption || 'Editorial Photo'} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Testimonials Quotes */}
        {profile.testimonials && profile.testimonials.length > 0 && (
          <>
            <section className={styles.editorialSectionHeader}>
              <span className={styles.sectionRomanNum}>SECTION VI</span>
              <h2 className={styles.sectionMainHeading}>Client Endorsements</h2>
              <p className={styles.sectionSubHeading}>
                Words from high-profile couples, event producers, and corporate organizers.
              </p>
            </section>

            <div className={styles.quotesGrid}>
              {profile.testimonials.map((test) => (
                <div key={test.id} className={styles.quoteCard}>
                  <div>
                    <div className={styles.quoteMark}>“</div>
                    <p className={styles.quoteText}>{test.text}</p>
                  </div>
                  <div className={styles.quoteAuthor}>
                    <div>
                      <div className={styles.authorName}>{test.client_name}</div>
                      <div className={styles.authorRole}>
                        {test.client_designation || test.event_type || 'Private Client'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------------- Platform Branding Footer ---------------- */}
        {shouldShowBranding(planTier, 'footer') && (
          <footer className={styles.editorialFooter}>
            <a href="https://stagehost.in" target="_blank" rel="noopener noreferrer">
              <Sparkles size={14} color="#d4af37" />
              <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
            </a>
            <div className={styles.editorialFooterNotice}>
              StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
            </div>
          </footer>
        )}
      </div>

      {/* Floating VIP Concierge Dock */}
      <aside className={styles.conciergeDock}>
        <div className={styles.dockLabel}>
          <span className={styles.dockDot} />
          <span>Concierge Desk</span>
        </div>

        <button type="button" onClick={handleWhatsAppInquiry} className={styles.dockBtnGold}>
          <MessageCircle size={15} />
          <span>WhatsApp VIP</span>
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
          className={styles.dockBtnGhost}
        >
          <Calendar size={14} />
          <span>Check Dates</span>
        </button>

        <button type="button" onClick={onSaveContact} className={styles.dockBtnGhost}>
          <UserPlus size={14} />
          <span>Save Contact</span>
        </button>
      </aside>
    </div>
  );
}
