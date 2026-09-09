'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Globe,
  Share2,
  Check,
  Send,
  Star,
  Play,
  Heart,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Plane,
  X,
  Film,
  Video as VideoIcon,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { InstagramIcon as Instagram, YoutubeIcon as Youtube, FacebookIcon as Facebook } from '@/components/ui/SocialIcons';
import type { AnchorProfile, InquiryFormData, PlanTier } from '@/types';
import { PORTFOLIO_THEMES, EVENT_TYPES, BUDGET_RANGES, getArtistCategory } from '@/constants';
import {
  formatINR,
  shouldShowBranding,
  getYouTubeId,
  getYouTubeThumbnail,
  getGoogleDriveId,
  getVideoEmbedInfo,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
  cn,
  getWhatsAppLink,
  formatEventDate,
  normalizeExternalUrl,
} from '@/lib/utils';
import { submitInquiry } from '@/lib/actions/inquiries';
import { submitClientReview } from '@/lib/actions/profile';
import { useScrollRevealContainer } from '@/hooks/useScrollReveal';
import { useToast } from '@/hooks/useToast';
import { ShareModal } from '@/components/common/ShareModal';
import { EventFunctionsPicker } from '@/components/common/EventFunctionsPicker';
import { trackEvent } from '@/lib/analytics';
import { EditorialProfile } from './EditorialProfile';
import { NeoStageProfile } from './NeoStageProfile';
import { VipProfile } from './VipProfile';
import { PalaceProfile } from './PalaceProfile';
import { CinemaProfile } from './CinemaProfile';
import styles from './PublicProfile.module.css';

interface PublicProfileProps {
  profile: AnchorProfile;
  planTier: PlanTier;
  scheduleData?: {
    showCalendar: boolean;
    slotsMap: Record<string, any>;
    bookings: Array<{ date: string; slot_type: string; event_type?: string; event_name?: string; city?: string }>;
  };
  layoutOverride?: 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema' | 'neostage';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_FUNCTION_OPTIONS = [
  { id: 'full_wedding', label: '💍 Full Wedding (All Functions)', isSpecial: true },
  { id: 'sangeet', label: '🎵 Sangeet Night' },
  { id: 'haldi_mehendi', label: '🟡 Haldi & Mehendi' },
  { id: 'wedding_ceremony', label: '👰 Wedding Ceremony' },
  { id: 'reception', label: '🍸 Cocktail & Reception' },
  { id: 'corporate', label: '🏢 Corporate Summit / Gala' },
  { id: 'private_party', label: '🎂 Private Party / Anniversary' },
  { id: 'concert_fest', label: '🎤 Concert / College Fest' },
];

export function PublicProfile({ profile, planTier, scheduleData, layoutOverride }: PublicProfileProps) {
  const { success, error: showError } = useToast();
  const containerRef = useScrollRevealContainer<HTMLDivElement>();
  const initialLayout = layoutOverride === 'neostage' ? 'spotlight' : (layoutOverride || profile.profile_layout || 'classic');
  const [activeLayout, setActiveLayout] = useState<'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema'>(
    initialLayout as any
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('layout');
      if (p === 'neostage' || p === 'spotlight') {
        setActiveLayout('spotlight');
      } else if (p === 'editorial' || p === 'classic' || p === 'vip' || p === 'palace' || p === 'cinema') {
        setActiveLayout(p as any);
      } else if (layoutOverride) {
        setActiveLayout(layoutOverride === 'neostage' ? 'spotlight' : layoutOverride);
      } else if (profile.profile_layout) {
        setActiveLayout(profile.profile_layout === 'neostage' ? 'spotlight' : profile.profile_layout);
      }
    }
  }, [layoutOverride, profile.profile_layout]);

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string; platform: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [lastSubmittedInquiry, setLastSubmittedInquiry] = useState<InquiryFormData | null>(null);
  const [inquiryForm, setInquiryForm] = useState<InquiryFormData>({
    name: '', email: '', phone: '', message: '', event_date: '', event_type: '', event_city: '', budget_range: '',
  });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Quick Date & Availability State
  const [quickDate, setQuickDate] = useState('');
  const [quickEventType, setQuickEventType] = useState(profile.event_types?.[0] || 'Wedding');

  // Multi-Artist Category & Featured Media
  const artistCat = getArtistCategory(profile.artist_type || 'emcee');
  const featuredVideo = profile.videos && profile.videos.length > 0 ? profile.videos[0] : null;

  const handleQuickDateCheck = () => {
    if (!quickDate) {
      setShowInquiryForm(true);
      return;
    }
    if (profile.whatsapp_number) {
      const formattedDate = formatEventDate(quickDate) || quickDate;
      const msg = `Hi ${profile.name}! 👋 I was viewing your official StageHost profile and wanted to check your availability for a ${quickEventType} on ${formattedDate}. Could you please share your availability and package quote?`;
      window.open(getWhatsAppLink(profile.whatsapp_number, msg), '_blank');
    } else {
      setInquiryForm((prev) => ({
        ...prev,
        event_date: quickDate,
        event_type: quickEventType,
      }));
      setShowInquiryForm(true);
    }
  };

  // Client Reviews State
  const [reviewsList, setReviewsList] = useState(profile.testimonials || []);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    client_name: '',
    client_designation: '',
    event_type: 'Wedding',
    event_date: '',
    text: '',
  });

  // Auto-Open Review Modal if client visited via WhatsApp Review Request Link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'review') {
        setShowReviewModal(true);
      }
    }
  }, []);

  // Track Live Profile View on First Mount (Session-Deduplicated)
  useEffect(() => {
    if (profile?.id) {
      trackEvent(profile.id, 'profile_view', { slug: profile.slug, name: profile.name });
    }
  }, [profile?.id, profile?.slug, profile?.name]);

  // Track Video Plays
  const handlePlayVideo = (video: { id?: string; url: string; title: string; platform: string }) => {
    setPlayingVideo(video);
    if (profile?.id) {
      trackEvent(profile.id, 'video_click', {
        video_id: video.id || video.url,
        title: video.title,
        platform: video.platform,
      });
    }
  };

  // 1-Tap Save Contact (.vcf) for iPhone and Android Phonebook
  const handleSaveContact = () => {
    const cleanPhone = (profile.whatsapp_number || profile.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? `+${cleanPhone}` : cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.name}`,
      `N:${profile.name};;;;`,
      `TITLE:${profile.tagline || 'Live Event Anchor & Emcee'}`,
      `ORG:StageHost Verified Artist`,
      phoneWithCountry ? `TEL;TYPE=CELL:${phoneWithCountry}` : '',
      profile.email ? `EMAIL:${profile.email}` : '',
      `URL:https://stagehost.in/${profile.slug}`,
      `NOTE:Bookings & Tour Schedule: https://stagehost.in/${profile.slug}`,
      'END:VCARD',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.slug || 'anchor'}-contact.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Contact card downloaded! Open to save in your phonebook.');
  };

  // Calendar State for Public Profile
  const today = new Date();

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

  const handleSelectDateForBooking = (dateStr: string, preferredSlot?: 'morning' | 'evening', customMessage?: string) => {
    setInquiryForm(prev => ({
      ...prev,
      event_date: dateStr,
      message: customMessage || (preferredSlot
        ? `Inquiring for ${preferredSlot === 'morning' ? 'Morning Function (10 AM - 3 PM)' : 'Evening Function (6 PM - 11 PM)'} on ${dateStr}.`
        : prev.message),
    }));
    setShowInquiryForm(true);
  };

  const activeTheme = PORTFOLIO_THEMES.find(t =>
    t.id === profile.theme_id ||
    (profile.theme_id && (
      t.id.includes(profile.theme_id.toLowerCase()) ||
      t.name.toLowerCase().includes(profile.theme_id.toLowerCase())
    ))
  ) || PORTFOLIO_THEMES[0];

  const formatIndianPhoneForWa = (phoneStr?: string | null): string => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  const formatIndianPhoneForTel = (phoneStr?: string | null): string => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    return `+${digits}`;
  };

  const isValidIndianPhone = (phoneStr: string): boolean => {
    const digits = phoneStr.replace(/\D/g, '');
    return /^(?:91)?[6-9]\d{9}$/.test(digits);
  };

  const getClientWhatsAppUrl = (formData: InquiryFormData) => {
    const cleanPhone = formatIndianPhoneForWa(profile.whatsapp_number || profile.phone);
    const text = `Hi ${profile.name}! I would like to check your availability for an event.\n\n👤 *Client Name:* ${formData.name}\n📞 *Phone:* ${formData.phone}${formData.event_type ? `\n🎉 *Event Functions:* ${formData.event_type}` : ''}${formData.event_date ? `\n📅 *Date:* ${formData.event_date}` : ''}${formData.event_city ? `\n📍 *City:* ${formData.event_city}` : ''}${formData.message ? `\n💬 *Note:* ${formData.message}` : ''}\n\nCan we discuss availability and commercials?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getDirectChatWhatsAppUrl = () => {
    const cleanPhone = formatIndianPhoneForWa(profile.whatsapp_number || profile.phone);
    const text = `Hi ${profile.name}! I saw your StageHost portfolio (stagehost.in/${profile.slug}) and would love to check your availability for an upcoming event.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.client_name.trim()) {
      showError('Please enter your name');
      return;
    }
    if (!reviewForm.text.trim()) {
      showError('Please write your review feedback');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await submitClientReview({
        profile_id: profile.id,
        slug: profile.slug,
        client_name: reviewForm.client_name,
        client_designation: reviewForm.client_designation,
        rating: reviewRating,
        event_type: reviewForm.event_type,
        event_date: reviewForm.event_date || null,
        text: reviewForm.text,
      });

      if (res.success && res.review) {
        setReviewsList((prev) => [res.review as any, ...prev]);
        success('🎉 Thank you! Your review has been submitted.');
        setShowReviewModal(false);
        setReviewForm({
          client_name: '',
          client_designation: '',
          event_type: 'Wedding',
          event_date: '',
          text: '',
        });
      }
    } catch {
      showError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };


  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidIndianPhone(inquiryForm.phone)) {
      showError('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
      return;
    }

    setIsSubmitting(true);
    const resolvedEventType = inquiryForm.event_type || 'Full Wedding';
    const payload = {
      ...inquiryForm,
      event_type: resolvedEventType,
    };
    try {
      await submitInquiry(profile.slug || 'demo', payload);
      if (profile?.id) {
        trackEvent(profile.id, 'inquiry_submit', {
          event_type: payload.event_type,
          city: payload.event_city,
        });
      }
      setLastSubmittedInquiry({ ...payload });
      setInquirySubmitted(true);
      success('Inquiry sent! You can also connect directly on WhatsApp.');
      setInquiryForm({ name: '', email: '', phone: '', message: '', event_date: '', event_type: '', event_city: '', budget_range: '', honeypot: '' });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = `Hi ${profile.name}! I found your profile on StageHost and I'm interested in booking you for an event. Can we discuss?`;

  return (
    <>
      {activeLayout === 'editorial' ? (
        <EditorialProfile
          profile={profile}
          planTier={planTier}
          scheduleData={scheduleData}
          onOpenInquiry={() => setShowInquiryForm(true)}
          onSelectDateForBooking={handleSelectDateForBooking}
          onOpenShare={() => setIsShareOpen(true)}
          onPlayVideo={handlePlayVideo}
          onPreviewPhoto={(url) => setPreviewPhoto(url)}
          onSaveContact={handleSaveContact}
          onOpenReview={() => setShowReviewModal(true)}
        />
      ) : activeLayout === 'spotlight' ? (
        <NeoStageProfile
          profile={profile}
          planTier={planTier}
          scheduleData={scheduleData}
          onOpenInquiry={() => setShowInquiryForm(true)}
          onSelectDateForBooking={handleSelectDateForBooking}
          onOpenShare={() => setIsShareOpen(true)}
          onPlayVideo={handlePlayVideo}
          onPreviewPhoto={(url) => setPreviewPhoto(url)}
          onSaveContact={handleSaveContact}
          onOpenReview={() => setShowReviewModal(true)}
        />
      ) : activeLayout === 'vip' ? (
        <VipProfile
          profile={profile}
          planTier={planTier}
          scheduleData={scheduleData}
          onOpenInquiry={() => setShowInquiryForm(true)}
          onSelectDateForBooking={handleSelectDateForBooking}
          onOpenShare={() => setIsShareOpen(true)}
          onPlayVideo={handlePlayVideo}
          onPreviewPhoto={(url) => setPreviewPhoto(url)}
          onSaveContact={handleSaveContact}
          onOpenReview={() => setShowReviewModal(true)}
        />
      ) : activeLayout === 'palace' ? (
        <PalaceProfile
          profile={profile}
          planTier={planTier}
          scheduleData={scheduleData}
          onOpenInquiry={() => setShowInquiryForm(true)}
          onSelectDateForBooking={handleSelectDateForBooking}
          onOpenShare={() => setIsShareOpen(true)}
          onPlayVideo={handlePlayVideo}
          onPreviewPhoto={(url) => setPreviewPhoto(url)}
          onSaveContact={handleSaveContact}
          onOpenReview={() => setShowReviewModal(true)}
        />
      ) : activeLayout === 'cinema' ? (
        <CinemaProfile
          profile={profile}
          planTier={planTier}
          scheduleData={scheduleData}
          onOpenInquiry={() => setShowInquiryForm(true)}
          onSelectDateForBooking={handleSelectDateForBooking}
          onOpenShare={() => setIsShareOpen(true)}
          onPlayVideo={handlePlayVideo}
          onPreviewPhoto={(url) => setPreviewPhoto(url)}
          onSaveContact={handleSaveContact}
          onOpenReview={() => setShowReviewModal(true)}
        />
      ) : (
        <div
          className={styles.profilePage}
          ref={containerRef}
          style={{
            '--color-primary': activeTheme.primary,
            '--color-primary-light': activeTheme.primaryLight,
            '--color-bg-primary': activeTheme.bg,
            '--color-bg-secondary': activeTheme.bgSecondary,
            '--color-text-primary': activeTheme.text,
            '--color-text-secondary': activeTheme.textSecondary,
            '--color-border': activeTheme.border,
          } as React.CSSProperties}
        >
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroSplit}>
            {/* Left Column: Portrait Stage Card */}
            <div className={styles.heroPortraitCol}>
              <div className={styles.heroPortraitCard}>
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.name}
                    className={styles.heroPortraitImg}
                  />
                ) : (
                  <div className={styles.heroPortraitFallback}>
                    {profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                )}

                <div className={styles.heroPortraitOverlay}>
                  <div className={styles.heroTopBadges}>
                    {profile.is_verified || planTier > 0 ? (
                      <span
                        className={styles.proBadge}
                        title="Verified Artist: Identity & Subscription verified via online payment KYC. Direct independent booking; not a performance guarantee."
                        style={{ cursor: 'help' }}
                      >
                        <CheckCircle2 size={12} color="#38bdf8" fill="rgba(56, 189, 248, 0.2)" /> Verified Artist
                      </span>
                    ) : (
                      <span className={styles.proBadge}>
                        <Sparkles size={12} color="#F59E0B" /> Emcee
                      </span>
                    )}
                    <span className={styles.liveBadge}>
                      <span className={styles.livePulseDot} /> Available
                    </span>
                  </div>

                  {featuredVideo && (
                    <button
                      type="button"
                      className={styles.watchShowreelBtn}
                      onClick={() => handlePlayVideo(featuredVideo)}
                    >
                      <Play size={14} fill="currentColor" /> Watch Showreel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Typography & Credibility */}
            <div className={styles.heroInfoCol}>
              <span className={styles.vipPill}>
                <Sparkles size={13} /> {artistCat.emoji} {artistCat.badge} · Official Media Kit
              </span>

              <h1 className={styles.profileName}>{profile.name}</h1>
              <p className={styles.profileTagline}>
                {profile.tagline || 'Celebrity Wedding & High-Octane Event Emcee'}
              </p>

              {/* Single Clean Credibility Bar (No Duplication) */}
              <div className={styles.credibilityBar}>
                <span className={styles.credItem}>
                  ⭐ <strong>{reviewsList.filter((t) => t.is_visible !== false).length > 0
                    ? (reviewsList.filter((t) => t.is_visible !== false).reduce((sum, r) => sum + (r.rating || 5), 0) / reviewsList.filter((t) => t.is_visible !== false).length).toFixed(1)
                    : '5.0'}</strong>
                  ({reviewsList.filter((t) => t.is_visible !== false).length} Reviews)
                </span>
                {profile.city && (
                  <span className={styles.credItem}>
                    📍 <strong>{profile.city}</strong>
                  </span>
                )}
                {profile.experience_years && (
                  <span className={styles.credItem}>
                    🏆 <strong>{profile.experience_years}+ Years</strong> Exp.
                  </span>
                )}
                <span className={styles.credItem}>
                  🎤 <strong>{profile.gigs_completed ? `${profile.gigs_completed}+` : `${Math.max((profile.experience_years || 5) * 50, 250)}+`}</strong> Shows
                </span>
                {profile.starting_price && (
                  <span className={styles.credItem}>
                    💼 From <strong>{formatINR(profile.starting_price)}</strong>
                  </span>
                )}
              </div>

              {/* Languages Row */}
              {profile.languages && profile.languages.filter((l) => l && l !== 'Other').length > 0 && (
                <div className={styles.miniPillsGroup}>
                  <span className={styles.miniPillLabel}>🗣️ Languages:</span>
                  {profile.languages.filter((l) => l && l !== 'Other').map((lang) => (
                    <span key={lang} className={styles.miniPill}>
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* Event Types / Functions Row */}
              {profile.event_types && profile.event_types.filter((t) => t && t !== 'Other').length > 0 && (
                <div className={styles.miniPillsGroup}>
                  <span className={styles.miniPillLabel}>🎤 Niches:</span>
                  {profile.event_types.filter((t) => t && t !== 'Other').map((type) => (
                    <span key={type} className={`${styles.miniPill} ${styles.miniPillPrimary}`}>
                      {type}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className={styles.ctaRow}>
                <button
                  className="btn btn-accent btn-lg"
                  onClick={() => setShowInquiryForm(true)}
                  style={{ gap: 8, boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)' }}
                >
                  <Send size={18} /> Book Now & Check Date
                </button>
                {profile.whatsapp_number && (
                  <a
                    href={getWhatsAppLink(profile.whatsapp_number, whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-lg ${styles.whatsappBtn}`}
                    style={{ gap: 8 }}
                    onClick={() => profile.id && trackEvent(profile.id, 'whatsapp_click', { location: 'hero' })}
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={formatIndianPhoneForTel(profile.phone)}
                    className="btn btn-ghost btn-lg"
                    style={{ gap: 8 }}
                    onClick={() => profile.id && trackEvent(profile.id, 'phone_click', { location: 'hero' })}
                  >
                    <Phone size={18} /> Call
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={handleSaveContact}
                  style={{ gap: 8, borderColor: 'rgba(212, 175, 55, 0.35)', color: '#d4af37' }}
                  title="Save Anchor to Phone Contacts"
                >
                  <UserPlus size={18} /> Save Contact
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() => setIsShareOpen(true)}
                  style={{ gap: 8 }}
                >
                  <Share2 size={18} /> Share
                </button>
              </div>

              {/* Social Links */}
              <div className={styles.socialRow}>
                {profile.instagram_url && (
                  <a
                    href={normalizeExternalUrl(profile.instagram_url, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    title="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {profile.youtube_url && (
                  <a
                    href={normalizeExternalUrl(profile.youtube_url, 'youtube')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    title="YouTube"
                  >
                    <Youtube size={18} />
                  </a>
                )}
                {profile.facebook_url && (
                  <a
                    href={normalizeExternalUrl(profile.facebook_url, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    title="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={normalizeExternalUrl(profile.website_url, 'generic')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    title="Website"
                  >
                    <Globe size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section (Directly below Hero for maximum stage impact) */}
      <section className={`${styles.section} reveal`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: 8, display: 'inline-flex', gap: 4 }}>
              <Film size={12} /> Live Stage Footage
            </span>
            <h2 className={styles.sectionTitle}>
              <Play size={22} color="var(--color-primary)" /> Stage Moments & Live Performances
            </h2>
          </div>
          <p className={styles.sectionSubtitle}>
            Watch full performance showreels, royal sangeet nights, and corporate keynotes.
          </p>
        </div>

        {(!profile.videos || profile.videos.length === 0) ? (
          <div
            className="card"
            style={{
              padding: 'var(--space-8) var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--color-primary)',
              }}
            >
              <Film size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)' }}>
              Stage Showreels & Performance Clips Updating Soon
            </div>
            <p className="text-secondary text-xs" style={{ margin: '6px auto 16px', maxWidth: 440, lineHeight: 1.6 }}>
              Looking for sample wedding showreels or corporate hosting clips for {profile.name}? Request verified performance clips directly on WhatsApp.
            </p>
            {profile.whatsapp_number && (
              <a
                href={getWhatsAppLink(profile.whatsapp_number, `Hi ${profile.name}, I am reviewing your StageHost portfolio and would like to see your latest stage performance video clips.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <MessageCircle size={14} /> Request Video Clips on WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className={styles.videoGrid}>
            {profile.videos.map((video) => {
              const isDrive = video.platform === 'google_drive' || video.url.includes('drive.google.com');
              const isYt = video.platform === 'youtube' || video.url.includes('youtu');
              const isInsta = video.platform === 'instagram' || video.url.includes('instagram.com');
              const ytId = getYouTubeId(video.url);
              const driveId = getGoogleDriveId(video.url);

              return (
                <div
                  key={video.id}
                  className={styles.videoCard}
                  onClick={() => handlePlayVideo(video)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlayVideo(video);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.videoThumb}>
                    {isYt && ytId ? (
                      <img
                        src={getYouTubeThumbnail(ytId)}
                        alt={video.title}
                        loading="lazy"
                      />
                    ) : isDrive && driveId ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
                          position: 'relative',
                        }}
                      >
                        <Film size={36} color="#818cf8" style={{ marginBottom: 6, opacity: 0.9 }} />
                        <span style={{ fontSize: '11px', color: '#c7d2fe', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Google Drive Performance
                        </span>
                      </div>
                    ) : isInsta ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
                          }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <Instagram size={36} color="#fff" />
                        </div>
                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Instagram Reel
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                          position: 'relative',
                        }}
                      >
                        <Play size={36} color="var(--color-primary)" style={{ marginBottom: 4 }} />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Watch Showreel
                        </span>
                      </div>
                    )}
                    <div className={styles.playOverlay}>
                      <div className={styles.playButton}>
                        <Play size={20} fill="#fff" color="#fff" />
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: isInsta
                          ? 'linear-gradient(45deg, #833ab4, #fd1d1d)'
                          : isDrive
                          ? 'rgba(59, 130, 246, 0.85)'
                          : 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        fontSize: '10px',
                        border: 'none',
                      }}
                    >
                      {isInsta ? 'Instagram Reel' : isDrive ? 'Google Drive' : isYt ? 'YouTube' : 'Video'}
                    </span>
                  </div>
                  <div className={styles.videoInfo}>
                    <span className={styles.videoTitle}>{video.title}</span>
                    <span className={styles.videoPlatform} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Play size={12} /> Watch Video
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* About Me / Bio Section with Bento Stats */}
      {profile.bio && (
        <section className={`${styles.section} reveal`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 8, display: 'inline-flex', gap: 4 }}>
                <Sparkles size={12} /> The Anchor Behind The Mic
              </span>
              <h2 className={styles.sectionTitle}>About {profile.name}</h2>
            </div>
          </div>

          <div className={styles.aboutGrid}>
            <div className={styles.bioText}>
              {profile.bio}
            </div>
            <div className={styles.bentoStatsGrid} style={{ margin: 0 }}>
              <div className={styles.bentoStatCard}>
                <span className={styles.bentoStatValue}>
                  {profile.gigs_completed
                    ? `${profile.gigs_completed}+`
                    : `${Math.max((profile.experience_years || 5) * 50, 250)}+`}
                </span>
                <span className={styles.bentoStatLabel}>Stage Gigs Done</span>
              </div>
              <div className={styles.bentoStatCard}>
                <span className={styles.bentoStatValue}>
                  ⭐ {reviewsList.filter((t) => t.is_visible !== false).length > 0
                    ? (reviewsList.filter((t) => t.is_visible !== false).reduce((sum, r) => sum + (r.rating || 5), 0) / reviewsList.filter((t) => t.is_visible !== false).length).toFixed(1)
                    : '5.0'}
                </span>
                <span className={styles.bentoStatLabel}>
                  {reviewsList.filter((t) => t.is_visible !== false).length > 0
                    ? `${reviewsList.filter((t) => t.is_visible !== false).length} Verified Reviews`
                    : '5-Star Rating'}
                </span>
              </div>
              <div className={styles.bentoStatCard}>
                <span className={styles.bentoStatValue}>{profile.city || 'Pan-India'}</span>
                <span className={styles.bentoStatLabel}>Destination Tours ✈️</span>
              </div>
              <div className={styles.bentoStatCard}>
                <span className={styles.bentoStatValue}>{profile.starting_price ? formatINR(profile.starting_price) : 'Custom Quote'}</span>
                <span className={styles.bentoStatLabel}>Starting Price</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Service Packages */}
      <section className={`${styles.section} reveal`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: 8, display: 'inline-flex', gap: 4 }}>
              <Sparkles size={12} /> Curated Offerings
            </span>
            <h2 className={styles.sectionTitle}>
              <Heart size={22} color="var(--color-accent)" /> Event Packages & Pricing
            </h2>
          </div>
          <p className={styles.sectionSubtitle}>
            Transparent event packages for weddings, corporate summits, and grand celebrations.
          </p>
        </div>

        {(!profile.service_packages || profile.service_packages.filter(s => s.is_active).length === 0) ? (
          <div
            className="card"
            style={{
              padding: 'var(--space-8) var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--color-accent)',
              }}
            >
              <Heart size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)' }}>
              Custom Tailored Event Packages Available
            </div>
            <p className="text-secondary text-xs" style={{ margin: '6px auto 16px', maxWidth: 460, lineHeight: 1.6 }}>
              {profile.name} crafts bespoke hosting solutions for weddings, sangeet functions, and corporate summits starting at {profile.starting_price ? formatINR(profile.starting_price) : 'custom rates'}.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowInquiryForm(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Request Custom Package & Quote <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <div className={styles.servicesGrid}>
            {profile.service_packages.filter(s => s.is_active).map((pkg) => (
              <div key={pkg.id} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <h3>{pkg.name}</h3>
                  {pkg.event_type && <span className="badge badge-ghost">{pkg.event_type}</span>}
                </div>
                <p className={styles.serviceDesc}>{pkg.description}</p>
                {(pkg.price_range_min || pkg.price_range_max) && (
                  <div className={styles.servicePrice}>
                    {pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                        ? `From ${formatINR(pkg.price_range_min)}`
                        : `Up to ${formatINR(pkg.price_range_max!)}`
                    }
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm btn-block"
                  onClick={() => setShowInquiryForm(true)}
                >
                  Inquire <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className={`${styles.section} reveal`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <Star size={12} fill="#F59E0B" /> Client Love & Reviews
            </span>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              What Clients & Couples Say
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="text-xs text-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ⭐ 5.0 Verified Experience
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReviewModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Star size={13} fill="#F59E0B" /> Write a Review
            </button>
          </div>
        </div>

        {reviewsList.filter((t) => t.is_visible !== false).length === 0 ? (
          <div
            className="card"
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Star size={28} fill="#F59E0B" color="#F59E0B" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Worked with {profile.name}?</div>
            <p className="text-secondary text-xs" style={{ margin: '4px auto 14px', maxWidth: 420 }}>
              Share your event experience with other couples & corporate planners.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReviewModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Star size={13} fill="#F59E0B" /> Leave the First Review
            </button>
          </div>
        ) : (
          <div className={styles.testimonialGrid}>
            {reviewsList
              .filter((t) => t.is_visible !== false)
              .map((testimonial) => (
                <div key={testimonial.id} className={styles.testimonialCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div className={styles.testimonialStars} style={{ marginBottom: 0 }}>
                      {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                    {testimonial.event_type && (
                      <span className="badge badge-accent" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {testimonial.event_type}
                      </span>
                    )}
                  </div>

                  <p className={styles.testimonialText}>&ldquo;{testimonial.text}&rdquo;</p>

                  <div className={styles.testimonialAuthor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    <div>
                      <strong>{testimonial.client_name}</strong>
                      {testimonial.client_designation && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          {testimonial.client_designation}
                        </div>
                      )}
                    </div>
                    {testimonial.event_date && (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                        📅 {formatEventDate(testimonial.event_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Stage & Event Photo Gallery */}
      {profile.photos && profile.photos.length > 0 && (
        <section className={`${styles.section} reveal`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: 8, display: 'inline-flex', gap: 4 }}>
                <Sparkles size={12} fill="#F59E0B" /> Stage & Event Moments
              </span>
              <h2 className={styles.sectionTitle}>
                Captured On Stage
              </h2>
            </div>
            <p className={styles.sectionSubtitle}>
              High-octane crowds, royal varmala moments, and corporate gala keynotes.
            </p>
          </div>

          <div className={styles.photoGrid}>
            {profile.photos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                className={styles.photoCard}
                onClick={() => setPreviewPhoto(photo.url)}
                role="button"
                tabIndex={0}
              >
                <img src={photo.url} alt={photo.caption || `${profile.name} stage moment`} loading="lazy" />
                {photo.caption && (
                  <div className={styles.photoCaptionOverlay}>
                    <span>{photo.caption}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Live Schedule & Availability Calendar */}
      {scheduleData?.showCalendar ? (
        <section className={`${styles.section} ${styles.scheduleSection} reveal`}>
          <div className={styles.sectionHeaderCentered}>
            <div className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Live Schedule
            </div>
            <h2 className={styles.sectionTitleCentered}>Live Tour & Event Dates</h2>
            <p className={styles.sectionSubtitleCentered}>
              Planning an event? Check my confirmed dates below. Click on any available date to send a direct inquiry.
            </p>
          </div>

          <div className={styles.publicCalendarCard}>
            {/* Month Navigator */}
            <div className={styles.publicCalendarHeader}>
              <button
                type="button"
                onClick={prevCalMonth}
                className="btn btn-ghost btn-xs btn-icon"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <div className={styles.publicMonthTitle}>
                {MONTHS[calMonth]} {calYear}
              </div>
              <button
                type="button"
                onClick={nextCalMonth}
                className="btn btn-ghost btn-xs btn-icon"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Legend */}
            <div className={styles.publicLegend}>
              <div className={styles.publicLegendItem}>
                <span className={styles.publicDotAvailable} /> Available
              </div>
              <div className={styles.publicLegendItem}>
                <span className={styles.publicDotBooked} /> Booked / Reserved
              </div>
              <div className={styles.publicLegendItem}>
                <span className={styles.publicDotTravel} /> Travel Day
              </div>
            </div>

            {/* Weekdays */}
            <div className={styles.publicWeekdays}>
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className={styles.publicDaysGrid}>
              {Array.from({ length: firstDayOfCalMonth }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.publicDayEmpty} />
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
                      styles.publicDayCell,
                      isCurrentToday && styles.publicDayToday,
                      isPast && styles.publicDayPast,
                      isFullBooked && styles.publicDayBooked,
                      isFullTravel && styles.publicDayTravel
                    )}
                    onClick={() => {
                      if (isPast || isFullBooked || isFullTravel) return;
                      if (hasTentative) {
                        setInquiryForm((prev) => ({
                          ...prev,
                          event_date: dateStr,
                          message: `Hi ${profile.name}! I noticed ${dateStr} is currently marked on tentative pencil hold. I would like to check availability and lock this date with an advance token.`,
                        }));
                        setShowInquiryForm(true);
                        return;
                      }
                      if (isOnlyEveAvailable || isEveAvailableWithMornTravel) {
                        handleSelectDateForBooking(dateStr, 'evening');
                      } else if (isOnlyMornAvailable || isMornAvailableWithEveTravel) {
                        handleSelectDateForBooking(dateStr, 'morning');
                      } else if (isCompletelyAvailable) {
                        handleSelectDateForBooking(dateStr);
                      }
                    }}
                    style={{
                      cursor: (isPast || isFullBooked || isFullTravel) ? 'default' : 'pointer'
                    }}
                    title={
                      isFullTravel
                        ? 'Blocked for Travel / Transit'
                        : isFullBooked
                        ? `Booked (${morningBooking?.event_name || ''} · ${eveningBooking?.event_name || fullBooking?.event_name || ''})`
                        : hasTentative
                        ? 'Date on Tentative Pencil Hold — Click to Inquire & Challenge Date'
                        : isOnlyEveAvailable
                        ? 'Morning is booked. Evening is AVAILABLE for your event!'
                        : isOnlyMornAvailable
                        ? 'Evening is booked. Morning is AVAILABLE for your event!'
                        : isEveAvailableWithMornTravel
                        ? 'Morning transit buffer. Evening is AVAILABLE for your event!'
                        : isMornAvailableWithEveTravel
                        ? 'Evening transit buffer. Morning is AVAILABLE for your event!'
                        : 'Available for booking'
                    }
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={styles.publicDayNumber}>{day}</span>
                      {isCurrentToday && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className={styles.publicBadgeWrapper}>
                      {isFullTravel ? (
                        <>
                          <span className={cn(styles.publicDayBadge, styles.badgeTravel)}>
                            <Plane size={10} /> Travel
                          </span>
                          {travelCity && (
                            <span className={styles.publicCityText}>{travelCity}</span>
                          )}
                        </>
                      ) : isTwoSeparateShows ? (
                        <>
                          <span className={cn(styles.publicDayBadge, styles.badgeBooked)}>
                            🔴 2 Shows
                          </span>
                          {eventCity && (
                            <span className={styles.publicCityText}>{eventCity}</span>
                          )}
                        </>
                      ) : isFullBooked ? (
                        <>
                          <span className={cn(styles.publicDayBadge, styles.badgeBooked)}>
                            🔴 Booked
                          </span>
                          {eventCity && (
                            <span className={styles.publicCityText}>{eventCity}</span>
                          )}
                        </>
                      ) : hasTentative ? (
                        <>
                          <span
                            className={styles.publicDayBadge}
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontWeight: 600,
                            }}
                          >
                            ⚡ Hold
                          </span>
                          {eventCity && (
                            <span className={styles.publicCityText}>{eventCity}</span>
                          )}
                        </>
                      ) : isEveAvailableWithMornTravel ? (
                        <span
                          className={cn(styles.publicDayBadge, styles.badgeAvailable)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                          title="Morning Travel · Evening Free"
                        >
                          <Plane size={9} /> Morn · 🌙 Eve
                        </span>
                      ) : isMornAvailableWithEveTravel ? (
                        <span
                          className={cn(styles.publicDayBadge, styles.badgeAvailable)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                          title="Morning Free · Evening Travel"
                        >
                          ☀️ Morn · <Plane size={9} /> Eve
                        </span>
                      ) : isOnlyEveAvailable ? (
                        <>
                          <span
                            className={cn(styles.publicDayBadge, styles.badgeAvailable)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6EE7B7',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            🌙 Eve Free
                          </span>
                          {morningBooking?.city && (
                            <span className={styles.publicCityText}>{morningBooking.city}</span>
                          )}
                        </>
                      ) : isOnlyMornAvailable ? (
                        <>
                          <span
                            className={cn(styles.publicDayBadge, styles.badgeAvailable)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6EE7B7',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            ☀️ Morn Free
                          </span>
                          {eveningBooking?.city && (
                            <span className={styles.publicCityText}>{eveningBooking.city}</span>
                          )}
                        </>
                      ) : isPast ? (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>—</span>
                      ) : (
                        <span className={cn(styles.publicDayBadge, styles.badgeAvailable)}>
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowInquiryForm(true)}
              >
                <Calendar size={14} /> Request Another Date / Custom Inquiry
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Availability CTA (When schedule is set to hidden) */
        <section className={`${styles.section} ${styles.availabilityCta} reveal`}>
          <Calendar size={28} />
          <h2>Want to check availability?</h2>
          <p>Send an inquiry with your event date and I&apos;ll get back to you within 24 hours.</p>
          <button className="btn btn-accent btn-lg" onClick={() => setShowInquiryForm(true)}>
            <Send size={18} /> Send Inquiry
          </button>
        </section>
      )}

      {/* Branding Footer */}
      <footer className={styles.brandingFooter}>
        <a href="https://stagehost.in/" target="_blank" rel="noopener noreferrer">
          <Sparkles size={14} />
          <span>Created on <strong>StageHost</strong> · Elite Artist Infrastructure</span>
        </a>
        <div className={styles.brandingFooterNotice}>
          StageHost is an artist booking platform. Bookings & performance riders are agreed directly between client & artist.
        </div>
      </footer>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div className="modal-overlay" onClick={() => { setShowInquiryForm(false); setInquirySubmitted(false); }}>
          <div
            className="modal modal-lg"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: 'min(88dvh, calc(100% - 24px))',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto 12px',
              overscrollBehavior: 'contain',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <span className="modal-title">
                {inquirySubmitted ? 'Inquiry Sent Successfully! 🎉' : `Send Inquiry to ${profile.name}`}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowInquiryForm(false); setInquirySubmitted(false); }}>×</button>
            </div>

            {inquirySubmitted ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', overflowY: 'auto' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Inquiry Sent to {profile.name}!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                  Your event details have been recorded. For an instant response within minutes, connect with {profile.name} directly on WhatsApp:
                </p>

                {lastSubmittedInquiry && (
                  <div style={{ marginBottom: '20px' }}>
                    <a
                      href={getClientWhatsAppUrl(lastSubmittedInquiry)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{
                        background: '#25D366',
                        borderColor: '#25D366',
                        color: '#fff',
                        gap: '8px',
                        padding: '12px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                      }}
                    >
                      <MessageCircle size={18} /> Chat with {profile.name} on WhatsApp (1-Click)
                    </a>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setInquirySubmitted(false);
                      setShowInquiryForm(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
                  {/* Anti-Spam Honeypot (Invisible to users, traps automated bots) */}
                  <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                    <input
                      type="text"
                      name="website_url_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={inquiryForm.honeypot || ''}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, honeypot: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Your Name *</label>
                      <input className="input" required value={inquiryForm.name} onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})} placeholder="Your full name" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone *</label>
                      <input className="input" required value={inquiryForm.phone} onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})} placeholder="9876543210" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input className="input" type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})} placeholder="you@email.com" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Event Date</label>
                      <input className="input" type="date" value={inquiryForm.event_date} onChange={(e) => setInquiryForm({...inquiryForm, event_date: e.target.value})} />
                    </div>
                  </div>

                  {/* Multi-Select Event Functions & Custom Function Support */}
                  <div style={{ marginTop: '14px' }}>
                    <EventFunctionsPicker
                      value={inquiryForm.event_type || '💍 Full Wedding (All Functions)'}
                      onChange={(val) => setInquiryForm((prev) => ({ ...prev, event_type: val }))}
                      label="Event Functions *"
                      allowCustom={true}
                    />
                  </div>

                  <div className="input-group" style={{ marginTop: '14px' }}>
                    <label className="input-label">Message / Venue Details</label>
                    <textarea className="input textarea" rows={2} value={inquiryForm.message} onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})} placeholder="Mention venue city, timings, or any specific requirements..." />
                  </div>
                </div>
                <div className="modal-footer" style={{ flexShrink: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowInquiryForm(false)} disabled={isSubmitting}>Cancel</button>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', gap: '6px' }}
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (!inquiryForm.name.trim()) {
                          showError('Please fill your name first');
                          return;
                        }
                        if (!isValidIndianPhone(inquiryForm.phone)) {
                          showError('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
                          return;
                        }
                        const resolvedEventType = inquiryForm.event_type || 'Full Wedding';
                        const payload = {
                          ...inquiryForm,
                          event_type: resolvedEventType,
                        };
                        setIsSubmitting(true);
                        try {
                          await submitInquiry(profile.slug || 'demo', payload);
                        } catch {}
                        setIsSubmitting(false);
                        window.open(getClientWhatsAppUrl(payload), '_blank');
                        setShowInquiryForm(false);
                        success('Opening WhatsApp with artist!');
                      }}
                    >
                      <MessageCircle size={15} /> Send via WhatsApp (Instant)
                    </button>
                    <button type="submit" className="btn btn-accent btn-sm" disabled={isSubmitting} style={{ gap: '6px' }}>
                      <Send size={15} /> {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Video Player Modal (Supports Instagram Reels & YouTube Shorts in 9:16 Vertical Mode) */}
      {playingVideo && (() => {
        const isVerticalReel =
          playingVideo.platform === 'instagram' ||
          playingVideo.url.includes('instagram.com') ||
          playingVideo.url.includes('/shorts/');

        return (
          <div className="modal-backdrop" onClick={() => setPlayingVideo(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: isVerticalReel ? '440px' : '860px',
                width: '95%',
                background: '#0a0a14',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      background: playingVideo.platform === 'instagram' || playingVideo.url.includes('instagram.com')
                        ? 'linear-gradient(135deg, #833AB4, #FD1D1D)'
                        : playingVideo.url.includes('/shorts/')
                        ? 'linear-gradient(135deg, #FF0000, #CC0000)'
                        : playingVideo.platform === 'google_drive' || playingVideo.url.includes('drive.google.com')
                        ? '#2563EB'
                        : playingVideo.platform === 'youtube' || playingVideo.url.includes('youtu')
                        ? '#DC2626'
                        : 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    {playingVideo.platform === 'instagram' || playingVideo.url.includes('instagram.com')
                      ? 'Instagram Reel'
                      : playingVideo.url.includes('/shorts/')
                      ? 'YouTube Short (9:16)'
                      : playingVideo.platform === 'google_drive' || playingVideo.url.includes('drive.google.com')
                      ? 'Google Drive'
                      : playingVideo.platform === 'youtube' || playingVideo.url.includes('youtu')
                      ? 'YouTube'
                      : 'Video'}
                  </span>
                  <strong style={{ fontSize: '15px', color: '#fff' }}>{playingVideo.title}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setPlayingVideo(null)}
                  style={{ padding: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Player Screen */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: isVerticalReel ? '9/16' : '16/9',
                  maxHeight: isVerticalReel ? '78vh' : '75vh',
                  background: '#000',
                }}
              >
              {(() => {
                const info = getVideoEmbedInfo(playingVideo.url);

                if (info.platform === 'instagram' && info.embedUrl) {
                  return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
                      <iframe
                        src={info.embedUrl}
                        title={playingVideo.title}
                        allowFullScreen
                        allow="encrypted-media"
                        style={{ width: '100%', maxWidth: '440px', height: '100%', border: 'none' }}
                      />
                    </div>
                  );
                }

                if (info.platform === 'youtube' && info.embedUrl) {
                  return (
                    <iframe
                      src={info.embedUrl}
                      title={playingVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  );
                }

                if (info.platform === 'google_drive' && info.embedUrl) {
                  return (
                    <iframe
                      src={info.embedUrl}
                      title={playingVideo.title}
                      allow="autoplay"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  );
                }

                if (info.platform === 'direct' && info.embedUrl) {
                  return (
                    <video
                      src={info.embedUrl}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  );
                }

                return (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '24px',
                      textAlign: 'center',
                    }}
                  >
                    <Play size={40} color="var(--color-primary)" />
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                      This video is hosted externally. Click below to view the original video.
                    </p>
                    <a
                      href={playingVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <ExternalLink size={14} /> Open Video Link
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      );
    })()}

      {profile.slug && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          slug={profile.slug}
          name={profile.name}
          tagline={profile.tagline}
        />
      )}

      {/* Client Review Submission Modal */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => !isSubmittingReview && setShowReviewModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '95%',
              background: 'var(--color-bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Review {profile.name}</h3>
                <p className="text-secondary text-xs" style={{ margin: '4px 0 0' }}>
                  Share your genuine event experience
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmittingReview}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Star Rating Picker */}
                <div>
                  <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
                    Your Rating *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          transform: (hoverRating || reviewRating) >= star ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <Star
                          size={28}
                          fill={(hoverRating || reviewRating) >= star ? '#F59E0B' : 'transparent'}
                          color={(hoverRating || reviewRating) >= star ? '#F59E0B' : 'var(--color-text-tertiary)'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', marginLeft: '6px' }}>
                      {reviewRating === 5 ? '5.0 — Outstanding!' : `${reviewRating}.0 Stars`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Your Name *</label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Ananya Sen"
                      value={reviewForm.client_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, client_name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Event Type *</label>
                    <select
                      className="input"
                      value={reviewForm.event_type}
                      onChange={(e) => setReviewForm({ ...reviewForm, event_type: e.target.value })}
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Role / Organization</label>
                    <input
                      className="input"
                      placeholder="e.g. Bride & Groom / Event Planner"
                      value={reviewForm.client_designation}
                      onChange={(e) => setReviewForm({ ...reviewForm, client_designation: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Event Date</label>
                    <input
                      className="input"
                      type="date"
                      value={reviewForm.event_date}
                      onChange={(e) => setReviewForm({ ...reviewForm, event_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Review / Feedback *</label>
                  <textarea
                    className="input textarea"
                    required
                    rows={3}
                    placeholder={`How was your event with ${profile.name}? Mention energy, stage presence, crowd management...`}
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingReview}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Quick-Action Bar */}
      {activeLayout === 'classic' && (
        <div className={styles.mobileStickyBar}>
          <div className={styles.mobileStickyInfo}>
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt={profile.name} className={styles.mobileStickyAvatar} />
            ) : (
              <div
                className={styles.mobileStickyAvatar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {profile.name[0]}
              </div>
            )}
            <div className={styles.mobileStickyText}>
              <span className={styles.mobileStickyName}>{profile.name}</span>
              <span className={styles.mobileStickyStatus}>
                <span className={styles.livePulseDot} style={{ width: 6, height: 6 }} /> Open for Dates
              </span>
            </div>
          </div>
          <a
            href={getDirectChatWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{
              background: '#25D366',
              color: '#ffffff',
              borderColor: '#25D366',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '8px 12px',
            }}
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => setShowInquiryForm(true)}
            style={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '8px 12px',
            }}
          >
            <Calendar size={15} /> Book
          </button>
        </div>
      )}

      {/* Photo Preview Modal Lightbox */}
      {previewPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPhoto(null)}
          style={{ zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto}
              alt="Stage photo preview"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

