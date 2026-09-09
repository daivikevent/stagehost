'use client';

import React, { useState, useMemo } from 'react';
import {
  Film,
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  MessageCircle,
  Phone,
  Share2,
  Play,
  ArrowUpRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  Radio,
  Star,
  Award,
  Clock,
  UserPlus,
  Send,
  Eye,
  CheckCircle2,
  Clapperboard,
  Flame,
  Ticket,
} from 'lucide-react';
import {
  InstagramIcon as Instagram,
  YoutubeIcon as Youtube,
  FacebookIcon as Facebook,
} from '@/components/ui/SocialIcons';
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
import styles from './CinemaProfile.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DEFAULT_CINEMA_BRANDS = [
  'Filmfare Red Carpet Awards',
  'Netflix Originals Showcase',
  'GQ Men of The Year Gala',
  'Amazon Prime Video Summit',
  'IIFA Global Awards Night',
  'Femina Miss India Finale',
  'Disney+ Hotstar Live',
  'Vogue Forces of Fashion',
  'Times of India Conclave',
  'Lakme Fashion Week Stage',
];

const DEFAULT_CINEMA_HUBS = [
  { city: 'Mumbai', tag: 'Bollywood Premieres & Red Carpet Galas' },
  { city: 'Delhi NCR', tag: 'High-Profile Corporate Megafests' },
  { city: 'Dubai, UAE', tag: 'Global Film & Music Awards' },
  { city: 'Bangalore', tag: 'Tech Unicorn Conclaves & Arena Shows' },
  { city: 'Goa', tag: 'International Festival Headline Host' },
  { city: 'London / Singapore', tag: 'Global Diaspora Arena Tours' },
];

interface CinemaProfileProps {
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

export function CinemaProfile({
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
}: CinemaProfileProps) {
  // Calendar State
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

  const activeBrands = (profile.client_brands && profile.client_brands.length > 0)
    ? profile.client_brands
    : DEFAULT_CINEMA_BRANDS;

  const activeTourHubs = (profile.tour_cities && profile.tour_cities.length > 0)
    ? profile.tour_cities
    : DEFAULT_CINEMA_HUBS;

  const handleDateClick = (day: number) => {
    const dateStr = toDateString(new Date(calYear, calMonth, day));
    const booking = scheduleData?.bookings.find((b) => b.date === dateStr);
    const slotData = scheduleData?.slotsMap?.[dateStr];

    if (slotData?.status === 'blocked' || (booking && booking.slot_type === 'full_day')) {
      return;
    }

    if (onSelectDateForBooking) {
      const preferred = slotData?.status === 'morning' ? 'evening' : slotData?.status === 'evening' ? 'morning' : undefined;
      onSelectDateForBooking(
        dateStr,
        preferred,
        `Hey ${profile.name}! 🎬 Inquiring about locking your Red Carpet / StageHost availability for ${MONTHS[calMonth]} ${day}, ${calYear}. Please share your rider & premiere availability!`
      );
    } else {
      onOpenInquiry();
    }
  };

  const startingPriceDisplay = profile.starting_price
    ? formatINR(profile.starting_price)
    : 'On Rider Request';

  const defaultAvatar = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop`;
  const avatarUrl = profile.profile_photo_url || defaultAvatar;

  const waMessage = `Hey ${profile.name}! 🎬 Saw your CineStar Red Carpet profile on StageHost and would love to discuss booking you for our upcoming headline event.`;
  const waLink = getWhatsAppLink(profile.whatsapp_number || profile.phone, waMessage);
  const packagesList = getEffectiveServicePackages(profile);

  return (
    <div className={styles.cinemaRoot}>
      {/* ---------------- World Premiere Exclusive Marquee Ticker ---------------- */}
      <div className={styles.premiereTicker}>
        <div className={styles.tickerTrack}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`ticker-${idx}`} className={styles.tickerItem}>
              <Flame size={14} color="#ffd700" />
              <span>OFFICIAL RED CARPET PREMIERE • CELEBRITY STAGE HOST • HIGH-OCTANE ARENA PERFORMANCES</span>
              <Clapperboard size={14} color="#ffd700" />
              <span>LIVE TOUR BOOKINGS OPEN • STAGEHOST VIP VERIFIED</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Top Premiere Header ---------------- */}
      <header className={styles.premiereHeader}>
        <div className={styles.cinemaContainer}>
          <div className={styles.headerNav}>
            <div className={styles.headerBrand}>
              <div className={styles.filmReelIcon}>
                <Film size={18} />
              </div>
              <div className={styles.brandTextGroup}>
                <div className={styles.brandName}>
                  <span>{profile.name}</span>
                  <ShieldCheck size={15} color="#ff2a4b" className={styles.verifiedShield} />
                </div>
                <div className={styles.brandBadge}>
                  Celebrity Emcee & Red Carpet Anchor
                </div>
              </div>
            </div>

            <div className={styles.headerButtons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onOpenShare}
                title="Share Star Press Kit"
                aria-label="Share Press Kit"
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
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnRedGlow}
                >
                  <MessageCircle size={14} />
                  <span className={styles.backstageFullText}>VIP Backstage</span>
                  <span className={styles.backstageShortText}>Backstage</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.cinemaContainer}>
        {/* ---------------- Premiere Billboard Hero ---------------- */}
        <section className={styles.heroBillboard}>
          <div className={styles.heroContent}>
            <div className={styles.liveBeaconPill}>
              <span className={styles.beaconDot} />
              <span>Live On Stage • High Energy Host</span>
            </div>

            <h1 className={styles.heroHeadline}>
              {profile.name}
            </h1>

            <p className={styles.heroTagline}>
              &ldquo;{profile.tagline || 'Electrifying red carpets, arena stages, and iconic galas worldwide.'}&rdquo;
            </p>

            <p className={styles.heroSynopsis}>
              {profile.bio ||
                'High-caliber celebrity anchor and arena host known for razor-sharp stage presence, unscripted wit, star-studded award shows, and high-production luxury celebrations.'}
            </p>

            <div className={styles.heroMetaRow}>
              <div className={styles.cinemaBadge}>
                <MapPin size={15} color="#ff2a4b" />
                <span>Hub: <strong>{profile.city}{profile.state ? `, ${profile.state}` : ''}</strong></span>
              </div>
              {profile.languages && profile.languages.length > 0 && (
                <div className={styles.cinemaBadge}>
                  <Globe size={15} color="#ff2a4b" />
                  <span>Languages: <strong>{profile.languages.join(' • ')}</strong></span>
                </div>
              )}
              {profile.starting_price && (
                <div className={styles.cinemaBadge}>
                  <Sparkles size={15} color="#ffd700" />
                  <span>Stage Fee: <strong>{startingPriceDisplay}</strong></span>
                </div>
              )}
            </div>

            {/* Event Types / Focus Categories */}
            {profile.event_types && profile.event_types.length > 0 && (
              <div className={styles.eventTypesRow}>
                {profile.event_types.map((type, tIdx) => (
                  <span key={tIdx} className={styles.eventTypeBadge}>
                    <Sparkles size={12} color="#ff2a4b" />
                    {type}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className={styles.heroStatsGrid}>
              <div className={styles.cinemaStatBox}>
                <span className={styles.cinemaStatVal}>{profile.experience_years ? `${profile.experience_years}+` : '8+'}</span>
                <span className={styles.cinemaStatLbl}>Years Spotlight</span>
              </div>
              <div className={styles.cinemaStatBox}>
                <span className={styles.cinemaStatVal}>{profile.gigs_completed ? `${profile.gigs_completed}+` : '400+'}</span>
                <span className={styles.cinemaStatLbl}>Arena Shows</span>
              </div>
              <div className={styles.cinemaStatBox}>
                <span className={styles.cinemaStatVal}>{activeTourHubs.length}</span>
                <span className={styles.cinemaStatLbl}>Tour Cities</span>
              </div>
              <div className={styles.cinemaStatBox}>
                <span className={styles.cinemaStatVal}>5.0 ★</span>
                <span className={styles.cinemaStatLbl}>Star Rating</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.heroActionRow}>
              <button
                type="button"
                className={styles.ctaPremiereTicket}
                onClick={onOpenInquiry}
              >
                <Ticket size={18} />
                <span>Book Premiere Ticket</span>
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaBackstageWa}
                >
                  <MessageCircle size={18} />
                  <span>VIP Backstage Chat</span>
                </a>
              )}
            </div>

            {/* Press, Social & Direct Rider Channels Strip */}
            <div className={styles.socialLinksStrip}>
              {profile.instagram_url && (
                <a
                  href={normalizeExternalUrl(profile.instagram_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialChip}
                >
                  <Instagram size={14} />
                  <span>Instagram</span>
                </a>
              )}
              {profile.youtube_url && (
                <a
                  href={normalizeExternalUrl(profile.youtube_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialChip}
                >
                  <Youtube size={14} />
                  <span>YouTube Channel</span>
                </a>
              )}
              {profile.facebook_url && (
                <a
                  href={normalizeExternalUrl(profile.facebook_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialChip}
                >
                  <Facebook size={14} />
                  <span>Facebook</span>
                </a>
              )}
              {profile.website_url && (
                <a
                  href={normalizeExternalUrl(profile.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialChip}
                >
                  <Globe size={14} />
                  <span>Official Domain</span>
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className={styles.socialChip}
                >
                  <Phone size={14} />
                  <span>{profile.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Billboard Poster Frame */}
          <div className={styles.posterWrapper}>
            <div className={styles.posterGlowAura} />
            <div className={styles.posterFrame}>
              <div className={styles.posterInner}>
                <img
                  src={avatarUrl}
                  alt={profile.name}
                  className={styles.posterImg}
                />
                <div className={styles.posterTagOverlay}>
                  <Clapperboard size={14} color="#ffd700" />
                  <span>Headlining Artist</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- Step-and-Repeat Brand Wall ---------------- */}
      <section className={styles.stepAndRepeatSection}>
        <div className={styles.stepAndRepeatLabel}>
          Featured Across Major Award Nights, Streaming Networks & Luxury Brands
        </div>
        <div className={styles.brandWallTrack}>
          {activeBrands.concat(activeBrands).map((brand, idx) => (
            <div key={`${brand}-${idx}`} className={styles.brandWallItem}>
              <Star size={14} fill="#ffd700" color="#ffd700" />
              <span>{brand}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.cinemaContainer}>
        {/* ---------------- Red Carpet Premiere Live Calendar (USP) ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.sectionPill}>
              <CalendarIcon size={13} />
              <span>Tour Diary</span>
            </div>
            <h2 className={styles.sectionMainTitle}>Live Tour & Premiere Calendar</h2>
            <p className={styles.sectionSubText}>
              Live synchronization of stage dates. Click any open date to submit an inquiry and lock in your event rider.
            </p>
          </div>

          <div className={styles.cinemaCalCard}>
            <div className={styles.calHeaderNav}>
              <div className={styles.calMonthHeading}>
                <Film size={22} color="#ff2a4b" />
                <span>{MONTHS[calMonth]} {calYear}</span>
              </div>
              <div className={styles.calNavControls}>
                <button
                  type="button"
                  className={styles.calArrowBtn}
                  onClick={prevCalMonth}
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={styles.calArrowBtn}
                  onClick={nextCalMonth}
                  aria-label="Next Month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className={styles.calWeekdayGrid}>
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className={styles.calDaysGrid}>
              {/* Empty offset days */}
              {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
                <div key={`empty-c-${i}`} className={styles.emptyCell} />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInCalMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = toDateString(new Date(calYear, calMonth, dayNum));
                const booking = scheduleData?.bookings?.find((b) => b.date === dateStr);
                const slotData = scheduleData?.slotsMap?.[dateStr];

                let cellClass = styles.dayOpen;
                let statusLabel = 'Open';

                if (slotData?.status === 'blocked' || (booking && booking.slot_type === 'full_day')) {
                  cellClass = styles.daySoldOut;
                  statusLabel = 'Sold Out';
                } else if (slotData?.status === 'morning' || slotData?.status === 'evening') {
                  cellClass = styles.dayLimited;
                  statusLabel = slotData.status === 'morning' ? 'Eve Avail' : 'Morn Avail';
                }

                return (
                  <div
                    key={`cin-day-${dayNum}`}
                    className={cn(styles.ticketDayCell, cellClass)}
                    onClick={() => handleDateClick(dayNum)}
                    title={`${MONTHS[calMonth]} ${dayNum}, ${calYear}: ${statusLabel}`}
                  >
                    <span className={styles.ticketNum}>{dayNum}</span>
                    <span className={styles.ticketStatus}>{statusLabel}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.calLegendRow}>
              <div className={styles.legendPill}>
                <span className={styles.legendDotRed} />
                <span>Open for Booking (Click Date)</span>
              </div>
              <div className={styles.legendPill}>
                <span className={styles.legendDotGold} />
                <span>Partial Slot Available</span>
              </div>
              <div className={styles.legendPill}>
                <span className={styles.legendDotMuted} />
                <span>Sold Out / Headlining Other City</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Tour Schedule & Global Premiere Cities ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.sectionPill}>
              <MapPin size={13} />
              <span>Tour Circuit</span>
            </div>
            <h2 className={styles.sectionMainTitle}>Premiere Tour Routing</h2>
            <p className={styles.sectionSubText}>
              Direct flight connectivity and active routing hubs across global event capitals.
            </p>
          </div>

          <div className={styles.tourGrid}>
            {activeTourHubs.map((hub, idx) => (
              <div key={`${hub.city}-${idx}`} className={styles.tourCardCinema}>
                <div className={styles.tourIconRed}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className={styles.tourCityTitle}>{hub.city}</h3>
                  <p className={styles.tourCityTag}>{hub.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- IMAX Showreel Vault ---------------- */}
        {profile.videos && profile.videos.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeaderCenter}>
              <div className={styles.sectionPill}>
                <Play size={13} />
                <span>Theatrical Trailers</span>
              </div>
              <h2 className={styles.sectionMainTitle}>IMAX Performance Reels</h2>
              <p className={styles.sectionSubText}>
                Experience the raw crowd electricity, punchy comic timing, and high-energy stage hosting live in action.
              </p>
            </div>

            <div className={styles.imaxGrid}>
              {profile.videos.map((vid) => {
                const embed = getVideoEmbedInfo(vid.url || '');
                const thumbUrl = vid.thumbnail_url || embed?.thumbnailUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop';
                return (
                  <div
                    key={vid.id}
                    className={styles.imaxCard}
                    onClick={() => onPlayVideo({
                      url: vid.url,
                      title: vid.title,
                      platform: vid.platform || 'youtube',
                    })}
                  >
                    <div className={styles.imaxThumbBox}>
                      <img src={thumbUrl} alt={vid.title} className={styles.imaxImg} />
                      <div className={styles.imaxOverlay}>
                        <div className={styles.imaxPlayIcon}>
                          <Play size={24} fill="#ffffff" />
                        </div>
                      </div>
                    </div>
                    <div className={styles.imaxInfo}>
                      <h3 className={styles.imaxTitle}>{vid.title}</h3>
                      <p className={styles.imaxCategory}>
                        {(vid as any).category || 'High-Octane Arena Footage'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------------- Premiere Star Rider & Performance Packages ---------------- */}
        {packagesList.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeaderCenter}>
              <div className={styles.sectionPill}>
                <Award size={13} />
                <span>Rider Tiers</span>
              </div>
              <h2 className={styles.sectionMainTitle}>Star Rider Performance Packages</h2>
              <p className={styles.sectionSubText}>
                Production-ready performance packages tailored for arena galas, celebrity sangeets, and corporate conclaves.
              </p>
            </div>

            <div className={styles.riderGrid}>
              {packagesList.map((pkg, idx) => {
                const priceDisplay = (pkg.price_range_min || pkg.price_range_max)
                  ? (pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                        ? `From ${formatINR(pkg.price_range_min)}`
                        : `Up to ${formatINR(pkg.price_range_max!)}`)
                  : 'Custom Rider Fee';

                const inclusions: string[] = (Array.isArray((pkg as any).inclusions) && (pkg as any).inclusions.length > 0)
                  ? (pkg as any).inclusions
                  : [
                      pkg.event_type ? `${pkg.event_type} Headlining Curation` : 'Complete Red Carpet Stage Direction',
                      'Celebrity Run-of-Show Protocol Briefing',
                      'High-Energy Arena Crowd Hype',
                      'Backstage Technical Coordination',
                    ];

                return (
                  <div
                    key={pkg.id || idx}
                    className={cn(
                      styles.riderCard,
                      idx === 1 && styles.riderCardFeatured
                    )}
                  >
                    <div className={styles.riderHeader}>
                      <h3 className={styles.riderTitle}>{pkg.name}</h3>
                      {idx === 1 && (
                        <span className={styles.riderPill}>Headliner Choice</span>
                      )}
                    </div>

                    <div className={styles.riderPriceBox}>
                      <span className={styles.riderPrice}>{priceDisplay}</span>
                      <span className={styles.riderPriceLbl}>/ performance</span>
                    </div>

                    <p className={styles.riderDesc}>
                      {pkg.description || 'Complete stage hosting, crowd hype orchestration, script co-creation, and technical rehearsal coordination.'}
                    </p>

                    <ul className={styles.riderFeatureList}>
                      {inclusions.map((feat, fIdx) => (
                        <li key={fIdx} className={styles.riderFeatureItem}>
                          <CheckCircle2 size={16} className={styles.riderCheck} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={styles.riderBtn}
                      onClick={onOpenInquiry}
                    >
                      <span>Request Star Rider</span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------------- Red Carpet Photo Reel ---------------- */}
        {profile.photos && profile.photos.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeaderCenter}>
              <div className={styles.sectionPill}>
                <Sparkles size={13} />
                <span>Paparazzi Snapshots</span>
              </div>
              <h2 className={styles.sectionMainTitle}>The Red Carpet Reel</h2>
              <p className={styles.sectionSubText}>
                Moments on the grand red carpet, backstage excitement, and high-energy stage moments.
              </p>
            </div>

            <div className={styles.galleryGrid}>
              {profile.photos.map((photo) => (
                <div
                  key={photo.id}
                  className={styles.galleryCard}
                  onClick={() => onPreviewPhoto(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || profile.name}
                    className={styles.galleryImg}
                  />
                  <div className={styles.galleryCaptionBox}>
                    <span className={styles.galleryCaption}>
                      {photo.caption || 'Red Carpet Premiere'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Critics & Celebrity Reviews ---------------- */}
        {profile.testimonials && profile.testimonials.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeaderCenter}>
              <div className={styles.sectionPill}>
                <Star size={13} />
                <span>Industry Critics</span>
              </div>
              <h2 className={styles.sectionMainTitle}>Producer & Client Reviews</h2>
              <p className={styles.sectionSubText}>
                What producers, show directors, and high-profile clients say about the stage electricity.
              </p>
            </div>

            <div className={styles.criticsGrid}>
              {profile.testimonials.map((review) => (
                <div key={review.id} className={styles.criticCard}>
                  <div className={styles.criticStars}>
                    {Array.from({ length: review.rating || 5 }).map((_, rIdx) => (
                      <Star key={rIdx} size={16} fill="#ffd700" color="#ffd700" />
                    ))}
                  </div>
                  <p className={styles.criticQuote}>
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className={styles.criticMeta}>
                    <div>
                      <h4 className={styles.criticName}>{review.client_name}</h4>
                      <p className={styles.criticRole}>
                        {review.client_designation || review.event_type || 'Premiere Host'}
                      </p>
                    </div>
                    <Flame size={18} color="#ff2a4b" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Signature Headline Stagecraft Specialties ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.sectionPill}>
              <Flame size={13} />
              <span>Stage Specializations</span>
            </div>
            <h2 className={styles.sectionMainTitle}>Headline Craft & Stage Mastery</h2>
            <p className={styles.sectionSubText}>
              High-octane crowd ignition, celebrity moderation, and unscripted broadcast dexterity.
            </p>
          </div>

          <div className={styles.specialtiesGrid}>
            {(profile.artist_specialties && profile.artist_specialties.length > 0
              ? profile.artist_specialties
              : [
                  'Red Carpet Film Premieres & Star Cast Moderation',
                  'Arena Concert Headline Emcee & Electric Crowd Hype',
                  'High-Profile Celebrity Award Galas & Live Broadcasts',
                  'Fast-Paced Spontaneous Wit & Instant Rebuttal',
                  'Global Tech Conclaves & Stadium Product Launches',
                ]
            ).map((spec, sIdx) => (
              <div key={sIdx} className={styles.specialtyCard}>
                <div className={styles.specialtyIconWrap}>
                  <Flame size={18} color="#ff2a4b" />
                </div>
                <span className={styles.specialtyText}>{spec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Platform Branding Footer ---------------- */}
        {shouldShowBranding(planTier, 'footer') && (
          <footer className={styles.cinemaFooter}>
            <a href="https://stagehost.in" target="_blank" rel="noopener noreferrer">
              <Sparkles size={14} color="#ff2a4b" />
              <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
            </a>
            <div className={styles.cinemaFooterNotice}>
              StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
            </div>
          </footer>
        )}
      </div>

      {/* ---------------- Floating VIP Premiere Concierge Dock ---------------- */}
      <div className={styles.cinemaDock}>
        <button
          type="button"
          className={styles.dockTicketBtn}
          onClick={onOpenInquiry}
        >
          <Ticket size={16} />
          <span>Book Premiere Ticket</span>
        </button>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dockWaBtn}
          >
            <MessageCircle size={16} />
            <span>VIP WhatsApp</span>
          </a>
        )}

        <button
          type="button"
          className={styles.dockCircleBtn}
          onClick={onOpenShare}
          title="Share Press Kit"
        >
          <Share2 size={16} />
        </button>

        <button
          type="button"
          className={styles.dockCircleBtn}
          onClick={onSaveContact}
          title="Save Contact"
        >
          <UserPlus size={16} />
        </button>
      </div>
    </div>
  );
}
