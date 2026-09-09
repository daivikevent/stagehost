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
import styles from './VipProfile.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DEFAULT_VIP_BRANDS = [
  'Taj Hotels & Palaces',
  'Forbes Global Gala',
  'Rolls-Royce Motor Cars',
  'Bulgari High Jewellery',
  'BMW Excellence Club',
  'Marriott Bonvoy Luxury',
  'Cartier Privé',
  'Filmfare Red Carpet',
  'The Oberoi Group',
  'TEDx Conferences',
  'Vogue Weddings International',
];

const DEFAULT_VIP_HUBS = [
  { city: 'Mumbai', tag: 'Celebrity Galas' },
  { city: 'Delhi NCR', tag: 'State Banquets & Sangeets' },
  { city: 'Udaipur / Jaipur', tag: 'Royal Palace Destination' },
  { city: 'Dubai, UAE', tag: 'International Conventions' },
  { city: 'Monaco / Lake Como', tag: 'Global Elite Celebrations' },
  { city: 'Goa', tag: 'Luxury Coastal Summits' },
];

interface VipProfileProps {
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

export function VipProfile({
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
}: VipProfileProps) {
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
    : DEFAULT_VIP_BRANDS;

  const activeTourHubs = (profile.tour_cities && profile.tour_cities.length > 0)
    ? profile.tour_cities
    : DEFAULT_VIP_HUBS;

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
        `Hello ${profile.name}! 👋 I am inquiring about your VIP availability for ${MONTHS[calMonth]} ${day}, ${calYear}. Could you please confirm engagement terms?`
      );
    } else {
      onOpenInquiry();
    }
  };

  return (
    <div className={styles.vipRoot}>
      {/* Top Atelier Status Bar */}
      <header className={styles.atelierBar}>
        <div className={styles.atelierBadge}>
          <Crown size={15} color="#d4af37" />
          <span>SOVEREIGN ATELIER · PRIVATE ENGAGEMENTS</span>
          <span className={styles.crestDot} />
        </div>

        <div className={styles.atelierActions}>
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className={styles.ghostActionBtn}>
              <Phone size={13} /> Call Concierge
            </a>
          )}
          <button type="button" onClick={onOpenShare} className={styles.ghostActionBtn}>
            <Share2 size={13} /> Share Dossier
          </button>
          <button type="button" onClick={onSaveContact} className={styles.ghostActionBtn}>
            <UserPlus size={13} /> Save vCard
          </button>
          {profile.whatsapp_number ? (
            <a
              href={getWhatsAppLink(profile.whatsapp_number, `Hello ${profile.name}, I am reaching out to discuss a private high-profile event booking.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.conciergeBtn}
            >
              <MessageCircle size={13} /> VIP WhatsApp
            </a>
          ) : (
            <button type="button" onClick={onOpenInquiry} className={styles.conciergeBtn}>
              <Send size={13} /> Inquire Booking
            </button>
          )}
        </div>
      </header>

      <div className={styles.container}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.royalSeal}>
              <Award size={14} color="#d4af37" />
              <span>
                {profile.artist_type ? profile.artist_type.toUpperCase() : 'MASTER OF CEREMONIES'} · BLACK LABEL ARTIST
              </span>
            </div>

            <h1 className={styles.heroTitle}>{profile.name}</h1>

            <p className={styles.heroTagline}>
              {profile.tagline || 'Exquisite Stage Command & High-Octane Curation for Royal Weddings and International Summits.'}
            </p>

            <div className={styles.heroLocationRow}>
              <span className={styles.locationPin}>
                <MapPin size={16} />
                {profile.city || 'Pan-India'}{profile.state ? `, ${profile.state}` : ''}
              </span>
              <span>✦</span>
              <span>Global Destination Touring</span>
              {profile.languages && profile.languages.length > 0 && (
                <>
                  <span>✦</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {profile.languages.slice(0, 4).map((lang) => (
                      <span key={lang} className={styles.langChip}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Portrait Frame with Gilded Bevel */}
          <div className={styles.heroPortraitFrame}>
            <div className={styles.heroPortraitInner}>
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.name}
                  className={styles.heroPortraitImg}
                  onClick={() => onPreviewPhoto(profile.profile_photo_url!)}
                />
              ) : profile.photos && profile.photos.length > 0 ? (
                <img
                  src={profile.photos[0].url}
                  alt={profile.name}
                  className={styles.heroPortraitImg}
                  onClick={() => onPreviewPhoto(profile.photos![0].url)}
                />
              ) : (
                <div className={styles.heroPortraitFallback}>
                  <span>{profile.name.charAt(0)}</span>
                </div>
              )}

              <div className={styles.vipInsigniaBadge}>
                <div className={styles.insigniaLeft}>
                  <span className={styles.insigniaLabel}>STAGE PRESENCE</span>
                  <span className={styles.insigniaVal}>
                    {profile.gigs_completed ? `${profile.gigs_completed}+ Curated Gigs` : 'Verified Headliner'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={styles.insigniaLabel}>HONORARIUM</span>
                  <span className={styles.insigniaVal}>
                    {profile.starting_price ? formatINR(profile.starting_price) : 'On Application'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS ROW */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {profile.gigs_completed || '650'}+
            </div>
            <div className={styles.metricLabel}>Curated Galas & Keynotes</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {profile.experience_years || '10'}+
            </div>
            <div className={styles.metricLabel}>Years Elite Stage Tenure</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {profile.starting_price ? formatINR(profile.starting_price) : 'Bespoke'}
            </div>
            <div className={styles.metricLabel}>Starting Honorarium</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricValue}>100%</div>
            <div className={styles.metricLabel}>Audience Calibration</div>
          </div>
        </section>
      </div>

      {/* LUXURY BRANDS MARQUEE TICKER */}
      <section className={styles.marqueeSection}>
        <div className={styles.marqueeTrack}>
          {activeBrands.concat(activeBrands).map((brand, i) => (
            <div key={i} className={styles.marqueeItem}>
              <span>{brand}</span>
              <span className={styles.marqueeDot}>✦</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.container}>
        {/* MONOGRAPH / BIO */}
        <section className={styles.monographWrap}>
          <div>
            <span className={styles.sectionRoman}>MONOGRAPH I · CRAFT & REPUTE</span>
            <h2 className={styles.sectionTitle}>The Art of Unrivaled Stagecraft</h2>
            <div className={styles.bioLead}>
              <span className={styles.dropCap}>
                {profile.bio ? profile.bio.charAt(0).toUpperCase() : 'R'}
              </span>
              {profile.bio ? (
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{profile.bio}</p>
              ) : (
                <p style={{ margin: 0 }}>
                  A luminary in contemporary hosting, {profile.name} marries regal composure with electric, spontaneous audience mastery.
                  Trusted by royal families, international corporate titans, and celebrated patrons, every production is executed with
                  unflinching precision and artistic flair.
                </p>
              )}
            </div>

            {/* Social Channels */}
            <div style={{ display: 'flex', gap: '18px', marginTop: '30px', flexWrap: 'wrap' }}>
              {profile.instagram_url && (
                <a
                  href={normalizeExternalUrl(profile.instagram_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Instagram size={16} /> Official Instagram
                </a>
              )}
              {profile.youtube_url && (
                <a
                  href={normalizeExternalUrl(profile.youtube_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Youtube size={16} /> Cinema Showcase
                </a>
              )}
              {profile.website_url && (
                <a
                  href={normalizeExternalUrl(profile.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Globe size={16} /> Official Website
                </a>
              )}
            </div>
          </div>

          <div className={styles.specialtiesGrid}>
            <div style={{ fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c5a059', fontWeight: 700 }}>
              SIGNATURE SPECIALIZATIONS
            </div>
            {(profile.artist_specialties && profile.artist_specialties.length > 0
              ? profile.artist_specialties
              : [
                  'High-Profile Sangeet & Royal Wedding Direction',
                  'Fortune 500 Corporate Summits & Protocol',
                  'Spontaneous Audience Calibration & Quick Wit',
                  'Bilingual & Multilingual Fluency',
                  'Keynote Speaker Moderation & Award Galas',
                ]
            ).map((spec, i) => (
              <div key={i} className={styles.specialtyCard}>
                <Crown size={15} color="#d4af37" />
                <span>{spec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TOUR ROUTING HUBS */}
        <section style={{ marginBottom: '80px', padding: '30px', background: 'rgba(12, 12, 18, 0.6)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Radio size={18} color="#d4af37" />
            <h3 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '1.25rem', margin: 0, color: '#f3e5ab' }}>
              Tour Routing & Active Destination Hubs
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Direct flight logistics coordinated with premier private aviation and luxury hospitality circuits.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {activeTourHubs.map((hub, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(212, 175, 55, 0.22)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <MapPin size={13} color="#d4af37" />
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{hub.city}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>· {hub.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PRIVATE ENGAGEMENT PACKAGES */}
        {profile.service_packages && profile.service_packages.length > 0 && (
          <section style={{ marginBottom: '80px' }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionRoman}>REPERTOIRE II · PRIVATE ENGAGEMENTS</span>
              <h2 className={styles.sectionTitle}>Curated Performance Riders</h2>
              <p className={styles.sectionSubtitle}>
                Bespoke hosting packages tailored for luxury celebrations, private summits, and royal sangeets.
              </p>
            </div>

            <div className={styles.packagesGrid}>
              {profile.service_packages.map((pkg) => {
                const priceDisplay = (pkg.price_range_min || pkg.price_range_max)
                  ? (pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                        ? `From ${formatINR(pkg.price_range_min)}`
                        : `Up to ${formatINR(pkg.price_range_max!)}`)
                  : 'Bespoke Honorarium';

                const inclusions: string[] = Array.isArray((pkg as any).inclusions) && (pkg as any).inclusions.length > 0
                  ? (pkg as any).inclusions
                  : [
                      pkg.event_type ? `${pkg.event_type} Curation & Stage Direction` : 'Complete Stage Presence',
                      'Pre-Event Briefing & Run-of-Show Protocol',
                      'Spontaneous Audience Calibration',
                      'Direct Concierge Coordination',
                    ];

                return (
                  <div key={pkg.id} className={styles.packageCard}>
                    <div>
                      <Crown size={22} className={styles.pkgCrown} />
                      <h3 className={styles.pkgName}>{pkg.name}</h3>
                      {pkg.event_type && (
                        <div className={styles.pkgType}>{pkg.event_type}</div>
                      )}
                      <div className={styles.pkgPrice}>{priceDisplay}</div>

                      {pkg.description && (
                        <p className={styles.pkgDesc}>{pkg.description}</p>
                      )}

                      <ul className={styles.inclusionsList}>
                        {inclusions.map((inc, idx) => (
                          <li key={idx} className={styles.inclusionItem}>
                            <Crown size={13} color="#d4af37" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (profile.whatsapp_number) {
                          const msg = `Hello ${profile.name}! 👋 I am requesting private booking information for your "${pkg.name}" rider (${priceDisplay}).`;
                          window.open(getWhatsAppLink(profile.whatsapp_number, msg), '_blank');
                        } else {
                          onOpenInquiry();
                        }
                      }}
                      className={styles.reserveBtn}
                    >
                      Reserve Rider <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4K CINEMA SHOWREELS */}
        {profile.videos && profile.videos.length > 0 && (
          <section style={{ marginBottom: '80px' }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionRoman}>CINEMA III · LIVE CAPTURE</span>
              <h2 className={styles.sectionTitle}>The Sovereign Showreels</h2>
              <p className={styles.sectionSubtitle}>
                Cinematic video excerpts showcasing electric stage command, crowd calibration, and ballroom energy.
              </p>
            </div>

            <div className={styles.videoGrid}>
              {profile.videos.map((vid) => {
                const embedInfo = getVideoEmbedInfo(vid.url);
                return (
                  <div
                    key={vid.id}
                    className={styles.videoCard}
                    onClick={() => onPlayVideo(vid)}
                  >
                    <div className={styles.videoThumbWrap}>
                      {embedInfo?.thumbnailUrl ? (
                        <img
                          src={embedInfo.thumbnailUrl}
                          alt={vid.title}
                          className={styles.videoThumbImg}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090f' }}>
                          <Play size={40} color="#d4af37" />
                        </div>
                      )}
                      <div className={styles.playOverlay}>
                        <div className={styles.playCircle}>
                          <Play size={22} fill="#050507" color="#050507" style={{ marginLeft: '3px' }} />
                        </div>
                      </div>
                    </div>
                    <div className={styles.videoDetails}>
                      <h4 className={styles.videoTitle}>{vid.title}</h4>
                      <div className={styles.videoSubtitle}>
                        <Crown size={12} color="#d4af37" />
                        <span>HD PERFORMANCE CAPTURE</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* STAGE PRESENCE PHOTO GALLERY */}
        {profile.photos && profile.photos.length > 0 && (
          <section style={{ marginBottom: '80px' }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionRoman}>ARCHIVE IV · STAGE PRESENCE</span>
              <h2 className={styles.sectionTitle}>Photographic Portfolio</h2>
              <p className={styles.sectionSubtitle}>
                Glimpses of magnetic poise and stage grandeur across high-profile engagements.
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
                  {photo.caption && (
                    <div className={styles.photoCaptionOverlay}>
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LIVE PRIVATE AVAILABILITY RADAR (CALENDAR) */}
        <section className={styles.calendarSectionWrap}>
          <div className={styles.sectionHeader} style={{ marginBottom: '30px' }}>
            <span className={styles.sectionRoman}>TELEMETRY V · EXCLUSIVE RADAR</span>
            <h2 className={styles.sectionTitle}>Private Availability Radar</h2>
            <p className={styles.sectionSubtitle}>
              Select your desired engagement date to instantly confirm slot availability with our concierge desk.
            </p>
          </div>

          <div className={styles.calNavRow}>
            <button type="button" onClick={prevCalMonth} className={styles.calNavBtn}>
              <ChevronLeft size={16} /> Previous
            </button>
            <h3 className={styles.calMonthHeading}>
              {MONTHS[calMonth]} {calYear}
            </h3>
            <button type="button" onClick={nextCalMonth} className={styles.calNavBtn}>
              Next <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.weekdaysGrid}>
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className={styles.datesGrid}>
            {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
              <div key={`pad-${i}`} style={{ opacity: 0.2 }} />
            ))}

            {Array.from({ length: daysInCalMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateString(new Date(calYear, calMonth, day));
              const booking = scheduleData?.bookings.find((b) => b.date === dateStr);
              const slotData = scheduleData?.slotsMap?.[dateStr];

              const isBooked = booking?.slot_type === 'full_day' || slotData?.status === 'blocked';
              const isMorning = slotData?.status === 'morning' || booking?.slot_type === 'morning';
              const isEvening = slotData?.status === 'evening' || booking?.slot_type === 'evening';

              return (
                <div
                  key={day}
                  className={styles.dateCell}
                  onClick={() => handleDateClick(day)}
                  style={{
                    opacity: isBooked ? 0.45 : 1,
                    cursor: isBooked ? 'not-allowed' : 'pointer',
                  }}
                  title={isBooked ? 'Booked' : isMorning ? 'Evening Available' : isEvening ? 'Morning Available' : 'Available for Booking'}
                >
                  <span className={styles.dateNumber}>{day}</span>
                  <span
                    className={cn(
                      styles.dateStatusDot,
                      isBooked ? styles.dotBooked : (isMorning || isEvening) ? styles.dotTentative : styles.dotAvailable
                    )}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={cn(styles.dateStatusDot, styles.dotAvailable)} /> Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={cn(styles.dateStatusDot, styles.dotTentative)} /> Partial / Tentative
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={cn(styles.dateStatusDot, styles.dotBooked)} /> Reserved
            </span>
          </div>
        </section>

        {/* ARISTOCRATIC ENDORSEMENTS / TESTIMONIALS */}
        {profile.testimonials && profile.testimonials.filter(t => t.is_visible !== false).length > 0 && (
          <section style={{ marginBottom: '100px' }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionRoman}>TESTIMONY VI · ENDORSEMENTS</span>
              <h2 className={styles.sectionTitle}>Client Transmittals</h2>
              <p className={styles.sectionSubtitle}>
                First-hand reflections from dignitaries, event producers, and families.
              </p>
            </div>

            <div className={styles.testimonialsGrid}>
              {profile.testimonials.filter(t => t.is_visible !== false).map((review) => (
                <div key={review.id} className={styles.endorsementCard}>
                  <div>
                    <div className={styles.endorsementStars}>
                      {Array.from({ length: review.rating || 5 }).map((_, i) => (
                        <Star key={i} size={15} fill="#d4af37" color="#d4af37" />
                      ))}
                    </div>
                    <blockquote className={styles.endorsementText}>
                      "{review.text}"
                    </blockquote>
                  </div>

                  <div className={styles.clientMeta}>
                    <span className={styles.clientName}>{review.client_name}</span>
                    <span className={styles.clientDesignation}>
                      {review.client_designation || review.event_type || 'Private Patron'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Platform Branding Footer ---------------- */}
        <footer className={styles.vipFooter}>
          <a href="https://stagehost.in/" target="_blank" rel="noopener noreferrer">
            <Sparkles size={14} color="#d4af37" />
            <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
          </a>
          <div className={styles.vipFooterNotice}>
            StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
          </div>
        </footer>
      </div>

      {/* FLOATING VIP CONCIERGE DOCK */}
      <aside className={styles.conciergeDock}>
        <div className={styles.dockLabel}>
          <Crown size={15} color="#d4af37" />
          <span>VIP Concierge Active</span>
        </div>

        <button
          type="button"
          onClick={onOpenInquiry}
          className={styles.dockInquireBtn}
        >
          <Send size={13} /> Check Dates
        </button>

        {profile.whatsapp_number && (
          <a
            href={getWhatsAppLink(profile.whatsapp_number, `Hello ${profile.name}! 👋 I am inquiring about your VIP availability and honorarium.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dockWhatsAppBtn}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
      </aside>
    </div>
  );
}
