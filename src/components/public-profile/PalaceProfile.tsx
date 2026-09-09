'use client';

import React, { useState, useMemo } from 'react';
import {
  Crown,
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
  Compass,
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
import styles from './PalaceProfile.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DEFAULT_PALACE_BRANDS = [
  'Taj Lake Palace Udaipur',
  'The Oberoi Udaivilas',
  'Umaid Bhawan Palace Jodhpur',
  'The Leela Palace Jaipur',
  'ITC Grand Bharat',
  'Sabyasachi Heritage Galas',
  'Rambagh Palace Jaipur',
  'Forbes Royal Conclave',
  'Vogue Destination Weddings',
  'Samode Palace Heritage',
];

const DEFAULT_PALACE_HUBS = [
  { city: 'Udaipur', tag: 'Lake Palace Galas & Royal Sangeets' },
  { city: 'Jaipur', tag: 'Heritage Forts & Grand Varmala' },
  { city: 'Jodhpur', tag: 'Umaid Bhawan Destination Celebrations' },
  { city: 'Lake Como, Italy', tag: 'Royal Destination Nuptials' },
  { city: 'Delhi NCR & Samode', tag: 'State Banquets & Royal Receptions' },
  { city: 'Muscat / Dubai', tag: 'International Shahi Weddings' },
];

interface PalaceProfileProps {
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

export function PalaceProfile({
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
}: PalaceProfileProps) {
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
    : DEFAULT_PALACE_BRANDS;

  const activeTourHubs = (profile.tour_cities && profile.tour_cities.length > 0)
    ? profile.tour_cities
    : DEFAULT_PALACE_HUBS;

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
        `Namaste ${profile.name}! 🙏 I am inquiring about your Shubh Muhurat availability for a royal wedding celebration on ${MONTHS[calMonth]} ${day}, ${calYear}. Could you please confirm your itinerary?`
      );
    } else {
      onOpenInquiry();
    }
  };

  const startingPriceDisplay = profile.starting_price
    ? formatINR(profile.starting_price)
    : 'On Royal Request';

  const defaultAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop`;
  const avatarUrl = profile.profile_photo_url || defaultAvatar;

  const waMessage = `Namaste ${profile.name}! 🙏 I saw your Palace Royale profile on StageHost and would like to reserve your dates for an upcoming grand celebration.`;
  const waLink = getWhatsAppLink(profile.whatsapp_number || profile.phone, waMessage);
  const packagesList = getEffectiveServicePackages(profile);

  return (
    <div className={styles.palaceRoot}>
      {/* ---------------- Top Darbar Header ---------------- */}
      <header className={styles.darbarHeader}>
        <div className={styles.palaceContainer}>
          <div className={styles.darbarNav}>
            <div className={styles.darbarBrand}>
              <div className={styles.crestEmblem}>
                <Crown size={18} />
              </div>
              <div className={styles.brandTextGroup}>
                <div className={styles.crestTitle}>
                  <span>{profile.name}</span>
                  <ShieldCheck size={15} color="#d4af37" className={styles.verifiedShield} />
                </div>
                <div className={styles.crestSubtitle}>
                  Royal Heritage Master of Ceremonies
                </div>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onOpenShare}
                title="Share Royal Profile"
                aria-label="Share"
              >
                <Share2 size={15} />
                <span className={styles.btnLabel}>Share</span>
              </button>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={onSaveContact}
                title="Save Royal Contact"
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
                  className={styles.goldSolidBtn}
                >
                  <MessageCircle size={14} />
                  <span className={styles.conciergeFullText}>Royal Concierge</span>
                  <span className={styles.conciergeShortText}>Concierge</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.palaceContainer}>
        {/* ---------------- Hero Section (Archway Portal) ---------------- */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.royalBadge}>
              <Crown size={14} />
              <span>Royal Palace Destination Host</span>
            </div>

            <h1 className={styles.heroTitle}>
              {profile.name}
            </h1>

            <p className={styles.heroTagline}>
              &ldquo;{profile.tagline || 'Orchestrating majestic celebrations with timeless regal poise.'}&rdquo;
            </p>

            <p className={styles.heroBioExcerpt}>
              {profile.bio ||
                'Celebrated sovereign host curating unparalleled royal wedding experiences across heritage palaces of Rajasthan, royal darbars, and international luxury estates.'}
            </p>

            <div className={styles.heroMetaPills}>
              <div className={styles.metaPill}>
                <MapPin size={15} color="#d4af37" />
                <span>Based in <strong>{profile.city}{profile.state ? `, ${profile.state}` : ''}</strong></span>
              </div>
              {profile.languages && profile.languages.length > 0 && (
                <div className={styles.metaPill}>
                  <Globe size={15} color="#d4af37" />
                  <span>Languages: <strong>{profile.languages.join(' • ')}</strong></span>
                </div>
              )}
              {profile.starting_price && (
                <div className={styles.metaPill}>
                  <Sparkles size={15} color="#d4af37" />
                  <span>Honorarium from <strong>{startingPriceDisplay}</strong></span>
                </div>
              )}
            </div>

            {/* Event Types / Focus Categories */}
            {profile.event_types && profile.event_types.length > 0 && (
              <div className={styles.eventTypesRow}>
                {profile.event_types.map((type, tIdx) => (
                  <span key={tIdx} className={styles.eventTypeBadge}>
                    <Sparkles size={12} color="#d4af37" />
                    {type}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Stats Medallion */}
            <div className={styles.heroStatsGrid}>
              <div className={styles.statMedallion}>
                <span className={styles.statVal}>{profile.experience_years ? `${profile.experience_years}+` : '10+'}</span>
                <span className={styles.statLbl}>Years Royalty</span>
              </div>
              <div className={styles.statMedallion}>
                <span className={styles.statVal}>{profile.gigs_completed ? `${profile.gigs_completed}+` : '350+'}</span>
                <span className={styles.statLbl}>Palace Galas</span>
              </div>
              <div className={styles.statMedallion}>
                <span className={styles.statVal}>{activeTourHubs.length}</span>
                <span className={styles.statLbl}>Caravan Hubs</span>
              </div>
              <div className={styles.statMedallion}>
                <span className={styles.statVal}>5.0 ★</span>
                <span className={styles.statLbl}>Patron Rating</span>
              </div>
            </div>

            {/* Hero CTA Row */}
            <div className={styles.heroCtaRow}>
              <button
                type="button"
                className={styles.ctaLargeGold}
                onClick={onOpenInquiry}
              >
                <CalendarIcon size={18} />
                <span>Reserve Royal Date</span>
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaLargeEmerald}
                >
                  <MessageCircle size={18} />
                  <span>Direct WhatsApp Protocol</span>
                </a>
              )}
            </div>

            {/* Social Channels & Direct Contact Strip */}
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
                  <span>Showreel Vault</span>
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
                  <span>Official Portal</span>
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

          {/* Archway Hero Frame */}
          <div className={styles.archwayPortalWrapper}>
            <div className={styles.archwayAura} />
            <div className={styles.archwayFrame}>
              <div className={styles.archwayInner}>
                <img
                  src={avatarUrl}
                  alt={profile.name}
                  className={styles.archwayImg}
                />
                <div className={styles.archwayFloatingSeal}>
                  <Award size={14} color="#ffd700" />
                  <span>Sovereign Certified Anchor</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- Royal Brands Marquee ---------------- */}
      <section className={styles.marqueeSection}>
        <div className={styles.marqueeLabel}>
          Trusted by Royal Palaces, Luxury Estates & Connoisseurs of Grandeur
        </div>
        <div className={styles.marqueeTrack}>
          {activeBrands.concat(activeBrands).map((brand, idx) => (
            <div key={`${brand}-${idx}`} className={styles.marqueeItem}>
              <Crown size={14} color="#d4af37" />
              <span>{brand}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.palaceContainer}>
        {/* ---------------- Shubh Muhurat & Live Availability Calendar (USP) ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <CalendarIcon size={13} />
              <span>Real-Time Itinerary</span>
            </div>
            <h2 className={styles.sectionTitle}>Shubh Muhurat & Availability Diary</h2>
            <p className={styles.sectionSubtitle}>
              Check real-time destination dates. Click any open Shubh Muhurat date to dispatch an instant royal engagement inquiry.
            </p>
          </div>

          <div className={styles.calendarCard}>
            <div className={styles.calendarTopNav}>
              <div className={styles.calendarMonthTitle}>
                <Crown size={20} color="#d4af37" />
                <span>{MONTHS[calMonth]} {calYear}</span>
              </div>
              <div className={styles.calendarNavBtns}>
                <button
                  type="button"
                  className={styles.calNavBtn}
                  onClick={prevCalMonth}
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={styles.calNavBtn}
                  onClick={nextCalMonth}
                  aria-label="Next Month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className={styles.weekdaysHeader}>
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {/* Empty offset days */}
              {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyDayCell} />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInCalMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = toDateString(new Date(calYear, calMonth, dayNum));
                const booking = scheduleData?.bookings?.find((b) => b.date === dateStr);
                const slotData = scheduleData?.slotsMap?.[dateStr];

                let cellClass = styles.dayAvailable;
                let statusLabel = 'Available';

                if (slotData?.status === 'blocked' || (booking && booking.slot_type === 'full_day')) {
                  cellClass = styles.dayBooked;
                  statusLabel = 'Booked';
                } else if (slotData?.status === 'morning' || slotData?.status === 'evening') {
                  cellClass = styles.dayPartial;
                  statusLabel = slotData.status === 'morning' ? 'Eve Avail' : 'Morn Avail';
                }

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={cn(styles.dayCell, cellClass)}
                    onClick={() => handleDateClick(dayNum)}
                    title={`${MONTHS[calMonth]} ${dayNum}, ${calYear}: ${statusLabel}`}
                  >
                    <span className={styles.dayNum}>{dayNum}</span>
                    <span className={styles.dayStatusPill}>
                      <span className={styles.pillDesktopText}>{statusLabel}</span>
                      <span className={styles.pillMobileText}>
                        {statusLabel === 'Available' ? 'Open' : statusLabel === 'Booked' ? 'Full' : 'Part'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.calendarLegend}>
              <div className={styles.legendItem}>
                <span className={cn(styles.legendDot, styles.legendDotAvail)} />
                <span>Open Shubh Muhurat (Click to Book)</span>
              </div>
              <div className={styles.legendItem}>
                <span className={cn(styles.legendDot, styles.legendDotPartial)} />
                <span>Partial / Half-Day Open</span>
              </div>
              <div className={styles.legendItem}>
                <span className={cn(styles.legendDot, styles.legendDotBooked)} />
                <span>Engaged / Royal Hold</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Roving Caravan & Tour Hubs ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <Compass size={13} />
              <span>Destination Circuit</span>
            </div>
            <h2 className={styles.sectionTitle}>Roving Caravan & Royal Tour Hubs</h2>
            <p className={styles.sectionSubtitle}>
              Frequently stationed across the world’s most prestigious heritage palaces, forts, and destination venues.
            </p>
          </div>

          <div className={styles.tourGrid}>
            {activeTourHubs.map((hub, idx) => (
              <div key={`${hub.city}-${idx}`} className={styles.tourCard}>
                <div className={styles.tourIconBox}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className={styles.tourCityName}>{hub.city}</h3>
                  <p className={styles.tourTag}>{hub.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Royal Sangeet & Celebration Packages ---------------- */}
        {packagesList.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionBadge}>
                <Crown size={13} />
                <span>Curated Offerings</span>
              </div>
              <h2 className={styles.sectionTitle}>Royal Celebration Protocols</h2>
              <p className={styles.sectionSubtitle}>
                Bespoke master of ceremonies engagements designed for multi-day royal wedding itineraries.
              </p>
            </div>

            <div className={styles.packagesGrid}>
              {packagesList.map((pkg, idx) => {
                const priceDisplay = (pkg.price_range_min || pkg.price_range_max)
                  ? (pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                        ? `From ${formatINR(pkg.price_range_min)}`
                        : `Up to ${formatINR(pkg.price_range_max!)}`)
                  : 'On Royal Request';

                const inclusions: string[] = (Array.isArray((pkg as any).inclusions) && (pkg as any).inclusions.length > 0)
                  ? (pkg as any).inclusions
                  : [
                      pkg.event_type ? `${pkg.event_type} Royal Stage Direction` : 'Full Stage Presence & Etiquette',
                      'Pre-Event Royal Run-of-Show Briefing',
                      'High-Poise Audience Calibration',
                      'Direct Concierge Protocol Coordination',
                    ];

                return (
                  <div
                    key={pkg.id || idx}
                    className={cn(
                      styles.packageCard,
                      idx === 1 && styles.packageCardFeatured
                    )}
                  >
                    <div className={styles.packageHeader}>
                      <h3 className={styles.packageName}>{pkg.name}</h3>
                      {idx === 1 && (
                        <span className={styles.packageBadge}>Most Reserved</span>
                      )}
                    </div>

                    <div className={styles.packagePrice}>
                      <span className={styles.priceNum}>{priceDisplay}</span>
                      <span className={styles.priceLabel}>/ engagement</span>
                    </div>

                    <p className={styles.packageDesc}>
                      {pkg.description || 'Full event orchestration, custom couple storytelling, interactive guest engagement, and complete royal etiquette.'}
                    </p>

                    <ul className={styles.featuresList}>
                      {inclusions.map((feat, fIdx) => (
                        <li key={fIdx} className={styles.featureItem}>
                          <CheckCircle2 size={16} className={styles.featureCheck} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={styles.packageBtn}
                      onClick={onOpenInquiry}
                    >
                      <span>Reserve Celebration Package</span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------------- Showreels & Performance Vault ---------------- */}
        {profile.videos && profile.videos.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionBadge}>
                <Play size={13} />
                <span>Royal Visuals</span>
              </div>
              <h2 className={styles.sectionTitle}>The Performance Showreel Vault</h2>
              <p className={styles.sectionSubtitle}>
                Watch live stage command, grandeur, and spontaneous crowd magnetism from iconic destination weddings.
              </p>
            </div>

            <div className={styles.videosGrid}>
              {profile.videos.map((vid) => {
                const embed = getVideoEmbedInfo(vid.url || '');
                const thumbUrl = vid.thumbnail_url || embed?.thumbnailUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop';
                return (
                  <div
                    key={vid.id}
                    className={styles.videoVaultCard}
                    onClick={() => onPlayVideo({
                      url: vid.url,
                      title: vid.title,
                      platform: vid.platform || 'youtube',
                    })}
                  >
                    <div className={styles.videoThumbWrapper}>
                      <img src={thumbUrl} alt={vid.title} className={styles.videoThumbImg} />
                      <div className={styles.videoPlayOverlay}>
                        <div className={styles.playCircle}>
                          <Play size={24} fill="#120901" />
                        </div>
                      </div>
                    </div>
                    <div className={styles.videoCardInfo}>
                      <h3 className={styles.videoCardTitle}>{vid.title}</h3>
                      <p className={styles.videoCardCategory}>
                        {(vid as any).category || 'Palace Destination Showcase'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------------- Royal Photo Gallery ---------------- */}
        {profile.photos && profile.photos.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionBadge}>
                <Sparkles size={13} />
                <span>Gala Portraits</span>
              </div>
              <h2 className={styles.sectionTitle}>The Heritage Gallery</h2>
              <p className={styles.sectionSubtitle}>
                Portraits of grandeur, majestic varmala moments, and unforgettable high-octane sangeet nights.
              </p>
            </div>

            <div className={styles.photoGrid}>
              {profile.photos.map((photo) => (
                <div
                  key={photo.id}
                  className={styles.photoCard}
                  onClick={() => onPreviewPhoto(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || profile.name}
                    className={styles.photoImg}
                  />
                  <div className={styles.photoHoverOverlay}>
                    <span className={styles.photoCaption}>
                      {photo.caption || 'Royal Destination Gala'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Royal Patronage & Reviews ---------------- */}
        {profile.testimonials && profile.testimonials.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionBadge}>
                <Star size={13} />
                <span>Patron Endorsements</span>
              </div>
              <h2 className={styles.sectionTitle}>Words from Families & Royalty</h2>
              <p className={styles.sectionSubtitle}>
                Reflections of delight from distinguished couples, royal families, and celebrated wedding planners.
              </p>
            </div>

            <div className={styles.reviewsGrid}>
              {profile.testimonials.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewStars}>
                    {Array.from({ length: review.rating || 5 }).map((_, rIdx) => (
                      <Star key={rIdx} size={16} fill="#ffd700" color="#ffd700" />
                    ))}
                  </div>
                  <p className={styles.reviewQuote}>
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className={styles.reviewAuthorMeta}>
                    <div>
                      <h4 className={styles.authorName}>{review.client_name}</h4>
                      <p className={styles.authorRole}>
                        {review.client_designation || review.event_type || 'Palace Destination Celebration'}
                      </p>
                    </div>
                    <Crown size={18} color="#d4af37" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Royal Darbar Signature Specializations ---------------- */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <Crown size={13} />
              <span>Royal Mastery</span>
            </div>
            <h2 className={styles.sectionTitle}>Signature Masteries & Protocol</h2>
            <p className={styles.sectionSubtitle}>
              Bespoke stagecraft, royal etiquette, and distinguished audience engagement techniques.
            </p>
          </div>

          <div className={styles.specialtiesGrid}>
            {(profile.artist_specialties && profile.artist_specialties.length > 0
              ? profile.artist_specialties
              : [
                  'Royal Destination Wedding Direction & Run-of-Show Protocol',
                  'Shahi Sangeet High-Energy Interactive Crowd Mastery',
                  'Spontaneous Couple Storytelling & Grand Varmala Ceremonies',
                  'Multilingual Cultural Fluency & Aristocratic Dignity',
                  'State Banquets & High-Net-Worth Sovereign Galas',
                ]
            ).map((spec, sIdx) => (
              <div key={sIdx} className={styles.specialtyCard}>
                <div className={styles.specialtyIconWrap}>
                  <Crown size={18} color="#d4af37" />
                </div>
                <span className={styles.specialtyText}>{spec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Branding Footer ---------------- */}
        <footer className={styles.palaceFooter}>
          <a href="https://stagehost.in/" target="_blank" rel="noopener noreferrer">
            <Sparkles size={14} color="#d4af37" />
            <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
          </a>
          <div className={styles.palaceFooterNotice}>
            StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
          </div>
        </footer>
      </div>

      {/* ---------------- Floating Royal Concierge Dock ---------------- */}
      <div className={styles.conciergeDock}>
        <button
          type="button"
          className={styles.dockBtnPrimary}
          onClick={onOpenInquiry}
        >
          <CalendarIcon size={16} />
          <span>Reserve Shahi Date</span>
        </button>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dockBtnEmerald}
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
        )}

        <button
          type="button"
          className={styles.dockIconBtn}
          onClick={onOpenShare}
          title="Share Royal Monograph"
        >
          <Share2 size={16} />
        </button>

        <button
          type="button"
          className={styles.dockIconBtn}
          onClick={onSaveContact}
          title="Save Royal Contact"
        >
          <UserPlus size={16} />
        </button>
      </div>
    </div>
  );
}
