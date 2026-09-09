'use client';

import { useState, useTransition, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import {
  Save,
  Camera,
  MapPin,
  Languages,
  Mic,
  Phone,
  Globe,
  Loader2,
  Video as VideoIcon,
  Play,
  Trash2,
  Plus,
  X,
  ExternalLink,
  Film,
  AlertCircle,
  CheckCircle2,
  QrCode,
  FileText,
  Sparkles,
  Crown,
  Zap,
  LayoutGrid,
  Radio,
  Award,
  Building,
  Upload,
} from 'lucide-react';
import { InstagramIcon as Instagram, YoutubeIcon as Youtube, FacebookIcon as Facebook } from '@/components/ui/SocialIcons';
import { EVENT_TYPES, LANGUAGES, MAJOR_CITIES, ARTIST_CATEGORIES } from '@/constants';
import { updateProfile, uploadProfilePhoto } from '@/lib/actions/profile';
import { addVideo, deleteVideo } from '@/lib/actions/videos';
import { detectVideoPlatform, getGoogleDriveId, getYouTubeId, getVideoEmbedInfo, normalizeExternalUrl } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ShareModal } from '@/components/common/ShareModal';
import { MediaKitModal } from '@/components/portfolio/MediaKitModal';
import { TestimonialsManager } from '@/components/portfolio/TestimonialsManager';
import { PackagesManager } from '@/components/portfolio/PackagesManager';
import { PhotosManager } from '@/components/portfolio/PhotosManager';
import type { AnchorProfile, Video, Photo, ServicePackage, Testimonial } from '@/types';
import styles from './portfolio.module.css';

interface PortfolioFormProps {
  initialProfile: (Partial<AnchorProfile> & {
    videos?: Video[];
    photos?: Photo[];
    service_packages?: ServicePackage[];
    testimonials?: Testimonial[];
  }) | null;
}

export function PortfolioForm({ initialProfile }: PortfolioFormProps) {
  const { success, error: showError } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: initialProfile?.name || '',
    tagline: initialProfile?.tagline || '',
    artist_type: initialProfile?.artist_type || 'emcee',
    profile_layout: (initialProfile?.profile_layout as 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema') || 'classic',
    profile_photo_url: initialProfile?.profile_photo_url || '',
    bio: initialProfile?.bio || '',
    city: initialProfile?.city || '',
    state: initialProfile?.state || '',
    phone: initialProfile?.phone || '',
    whatsapp_number: initialProfile?.whatsapp_number || '',
    starting_price: initialProfile?.starting_price?.toString() || '',
    experience_years: initialProfile?.experience_years?.toString() || '',
    gigs_completed: initialProfile?.gigs_completed !== undefined && initialProfile?.gigs_completed !== null
      ? initialProfile.gigs_completed.toString()
      : '',
    languages: initialProfile?.languages || ([] as string[]),
    event_types: initialProfile?.event_types || ([] as string[]),
    client_brands: initialProfile?.client_brands || ([] as string[]),
    tour_cities: initialProfile?.tour_cities || ([] as Array<{ city: string; tag: string }>),
    artist_specialties: initialProfile?.artist_specialties || ([] as string[]),
    instagram_url: initialProfile?.instagram_url || '',
    youtube_url: initialProfile?.youtube_url || '',
    facebook_url: initialProfile?.facebook_url || '',
    website_url: initialProfile?.website_url || '',
  });

  const [newBrandInput, setNewBrandInput] = useState('');
  const [newTourCity, setNewTourCity] = useState('');
  const [newTourTag, setNewTourTag] = useState('');
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Photo size must be under 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const publicUrl = await uploadProfilePhoto(formData);
      if (publicUrl) {
        updateField('profile_photo_url', publicUrl);
        success('Profile photo updated and saved!');
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to upload photo file. You can also paste an image URL directly.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddBrand = (brand: string) => {
    const val = brand.trim();
    if (!val) return;
    if (!form.client_brands.some(b => b.toLowerCase() === val.toLowerCase())) {
      const updated = [...form.client_brands, val];
      setForm(prev => ({ ...prev, client_brands: updated }));
    }
    setNewBrandInput('');
  };

  const handleRemoveBrand = (brandToRemove: string) => {
    setForm(prev => ({
      ...prev,
      client_brands: prev.client_brands.filter(b => b !== brandToRemove),
    }));
  };

  const handleAddTourCity = (city: string, tag: string) => {
    const c = city.trim();
    const t = tag.trim();
    if (!c) return;
    if (!form.tour_cities.some(item => item.city.toLowerCase() === c.toLowerCase())) {
      const updated = [...form.tour_cities, { city: c, tag: t || 'Event Circuit' }];
      setForm(prev => ({ ...prev, tour_cities: updated }));
    }
    setNewTourCity('');
    setNewTourTag('');
  };

  const handleRemoveTourCity = (index: number) => {
    setForm(prev => ({
      ...prev,
      tour_cities: prev.tour_cities.filter((_, i) => i !== index),
    }));
  };

  const handleAddSpecialty = (spec: string) => {
    const val = spec.trim();
    if (!val) return;
    if (!form.artist_specialties.some(s => s.toLowerCase() === val.toLowerCase())) {
      const updated = [...form.artist_specialties, val];
      setForm(prev => ({ ...prev, artist_specialties: updated }));
    }
    setNewSpecialtyInput('');
  };

  const handleRemoveSpecialty = (specToRemove: string) => {
    setForm(prev => ({
      ...prev,
      artist_specialties: prev.artist_specialties.filter(s => s !== specToRemove),
    }));
  };

  // Video Management State
  const [videos, setVideos] = useState<Video[]>(initialProfile?.videos || []);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMediaKitOpen, setIsMediaKitOpen] = useState(false);

  const detectedPlatform = newVideoUrl ? detectVideoPlatform(newVideoUrl) : null;
  const isGoogleDrive = newVideoUrl.includes('drive.google.com');

  const updateField = (field: string, value: string | string[]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field: 'languages' | 'event_types', item: string) =>
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));

  // Custom Language & Event Type state
  const [showCustomLangInput, setShowCustomLangInput] = useState(false);
  const [customLangInput, setCustomLangInput] = useState('');
  const [showCustomEventInput, setShowCustomEventInput] = useState(
    initialProfile?.event_types?.includes('Other') || false
  );
  const [customEventInput, setCustomEventInput] = useState('');

  // Identify custom entries not in standard constants
  const customLanguages = form.languages.filter(
    l => !LANGUAGES.includes(l as any) && l !== 'Other'
  );
  const customEventTypes = form.event_types.filter(
    t => !EVENT_TYPES.includes(t as any) && t !== 'Other'
  );

  const handleAddCustomLanguage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customLangInput.trim();
    if (!val) return;
    if (!form.languages.some(l => l.toLowerCase() === val.toLowerCase())) {
      const updated = [...form.languages, val];
      updateField('languages', updated);
      // Auto-save to database immediately so it syncs live to public profile
      startTransition(async () => {
        try {
          await updateProfile({
            ...form,
            languages: updated,
            starting_price: form.starting_price ? parseInt(form.starting_price) : undefined,
            experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
            gigs_completed: form.gigs_completed ? parseInt(form.gigs_completed) : undefined,
          });
          success(`Language "${val}" added and live on your public profile!`);
        } catch {
          showError('Failed to sync language');
        }
      });
    }
    setCustomLangInput('');
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    const updated = form.languages.filter(l => l !== langToRemove);
    updateField('languages', updated);
    startTransition(async () => {
      try {
        await updateProfile({
          ...form,
          languages: updated,
          starting_price: form.starting_price ? parseInt(form.starting_price) : undefined,
          experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
          gigs_completed: form.gigs_completed ? parseInt(form.gigs_completed) : undefined,
        });
        success(`Language "${langToRemove}" removed.`);
      } catch {}
    });
  };

  const handleAddCustomEventType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customEventInput.trim();
    if (!val) return;
    if (!form.event_types.some(t => t.toLowerCase() === val.toLowerCase())) {
      const updated = [...form.event_types, val];
      updateField('event_types', updated);
      // Auto-save to database immediately so it syncs live to public profile
      startTransition(async () => {
        try {
          await updateProfile({
            ...form,
            event_types: updated,
            starting_price: form.starting_price ? parseInt(form.starting_price) : undefined,
            experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
            gigs_completed: form.gigs_completed ? parseInt(form.gigs_completed) : undefined,
          });
          success(`Event type "${val}" added and live on your public profile!`);
        } catch {
          showError('Failed to sync event type');
        }
      });
    }
    setCustomEventInput('');
  };

  const handleRemoveEventType = (typeToRemove: string) => {
    const updated = form.event_types.filter(t => t !== typeToRemove);
    updateField('event_types', updated);
    startTransition(async () => {
      try {
        await updateProfile({
          ...form,
          event_types: updated,
          starting_price: form.starting_price ? parseInt(form.starting_price) : undefined,
          experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
          gigs_completed: form.gigs_completed ? parseInt(form.gigs_completed) : undefined,
        });
        success(`Event type "${typeToRemove}" removed.`);
      } catch {}
    });
  };

  const handleSave = () => {
    // Collect any unsubmitted text sitting in custom inputs
    let effectiveLanguages = [...form.languages];
    const pendingLang = customLangInput.trim();
    if (pendingLang && !effectiveLanguages.some(l => l.toLowerCase() === pendingLang.toLowerCase())) {
      effectiveLanguages.push(pendingLang);
      setCustomLangInput('');
    }

    let effectiveEventTypes = [...form.event_types];
    const pendingEvent = customEventInput.trim();
    if (pendingEvent && !effectiveEventTypes.some(t => t.toLowerCase() === pendingEvent.toLowerCase())) {
      effectiveEventTypes.push(pendingEvent);
      setCustomEventInput('');
    }

    setForm(prev => ({
      ...prev,
      languages: effectiveLanguages,
      event_types: effectiveEventTypes,
    }));

    startTransition(async () => {
      try {
        await updateProfile({
          ...form,
          profile_layout: form.profile_layout,
          languages: effectiveLanguages,
          event_types: effectiveEventTypes,
          client_brands: form.client_brands,
          tour_cities: form.tour_cities,
          artist_specialties: form.artist_specialties,
          state: form.state,
          starting_price: form.starting_price ? parseInt(form.starting_price) : undefined,
          experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
          gigs_completed: form.gigs_completed ? parseInt(form.gigs_completed) : undefined,
        });
        success('Profile changes saved successfully! Updated live on your public profile.');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save profile');
      }
    });
  };

  const handleSelectLayout = (layout: 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema') => {
    setForm(prev => ({ ...prev, profile_layout: layout }));
    startTransition(async () => {
      try {
        await updateProfile({ profile_layout: layout });
        const layoutLabels: Record<string, string> = {
          vip: 'VIP Sovereign Black Label',
          editorial: 'Editorial Vogue & Billboard',
          spotlight: 'Neo-Stage Cyber Festival',
          classic: 'Classic Stage Bento',
          palace: 'Palace Royale Heritage',
          cinema: 'CineStar Red Carpet Premiere',
        };
        success(`Public layout updated to "${layoutLabels[layout]}"!`);
      } catch (err) {
        showError('Failed to switch layout');
      }
    });
  };

  // Add Video
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    startTransition(async () => {
      try {
        setIsAddingVideo(true);
        const added = await addVideo(newVideoUrl, newVideoTitle);
        setVideos(prev => [...prev, added]);
        setNewVideoUrl('');
        setNewVideoTitle('');
        success('Video added to your showcase and public portfolio!');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to add video');
      } finally {
        setIsAddingVideo(false);
      }
    });
  };

  // Delete Video
  const confirmDeleteVideo = () => {
    if (!deletingVideo) return;
    const { id, title } = deletingVideo;

    startTransition(async () => {
      try {
        await deleteVideo(id);
        setVideos(prev => prev.filter(v => v.id !== id));
        success(`Video "${title}" removed`);
        setDeletingVideo(null);
      } catch (err) {
        showError('Failed to remove video');
      }
    });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Edit Portfolio & Showcase</h1>
          <p className={styles.pageSubtitle}>Update your details, bio, and showreel videos</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {initialProfile && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsMediaKitOpen(true)}
              style={{ gap: '8px' }}
            >
              <FileText size={16} />
              PDF Media Kit
            </button>
          )}
          {initialProfile?.slug && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsShareOpen(true)}
              style={{ gap: '8px' }}
            >
              <QrCode size={16} />
              Share & QR Code
            </button>
          )}
          <button
            className={`btn btn-primary ${isPending ? 'btn-loading' : ''}`}
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {initialProfile?.slug && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          slug={initialProfile.slug}
          name={form.name || 'Anchor'}
          tagline={form.tagline || ''}
        />
      )}

      {initialProfile && (
        <MediaKitModal
          isOpen={isMediaKitOpen}
          onClose={() => setIsMediaKitOpen(false)}
          profile={{
            ...initialProfile,
            name: form.name || initialProfile.name || '',
            tagline: form.tagline || initialProfile.tagline || '',
            bio: form.bio || initialProfile.bio || '',
            city: form.city || initialProfile.city || '',
            languages: form.languages || initialProfile.languages || [],
            event_types: form.event_types || initialProfile.event_types || [],
            starting_price: form.starting_price ? Number(form.starting_price) : (initialProfile.starting_price ?? null),
            experience_years: form.experience_years ? Number(form.experience_years) : (initialProfile.experience_years ?? null),
          } as AnchorProfile}
        />
      )}

      <div className={styles.formGrid}>
        {/* Public Profile Layout Architecture Selector */}
        <div className={styles.layoutSection}>
          <div className={styles.layoutHeader}>
            <div className={styles.layoutTitleGroup}>
              <h3>
                <Sparkles size={20} style={{ color: '#ec4899' }} />
                Public Profile Layout Architecture
              </h3>
              <p>Choose the visual identity & layout experience your clients see when they visit your public link.</p>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600, background: 'rgba(139, 92, 246, 0.15)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              ⚡ 6 High-Conversion Themed Layouts
            </span>
          </div>

          <div className={styles.layoutGrid}>
            {/* 1. Editorial Vogue */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'editorial' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('editorial')}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#f472b6', borderColor: 'rgba(244, 114, 182, 0.3)' }}>
                    👑 Vogue Luxury
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'editorial' && <div className={styles.layoutRadioInner} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <Crown size={18} style={{ color: '#f472b6' }} />
                  Editorial Vogue & Billboard
                </div>
                <p className={styles.layoutCardDesc}>
                  Curated for celebrity hosts & luxury weddings. Billboard-scale widescreen 16:9 showreel, luxury brand marquee (*Taj, BMW, Forbes*), and magazine-spread quote cards.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Widescreen Reel</span>
                  <span className={styles.layoutCardPill}>Brand Marquee</span>
                  <span className={styles.layoutCardPill}>Vogue Typography</span>
                  <span className={styles.layoutCardPill}>VIP Concierge Dock</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('editorial');
                  }}
                >
                  {form.profile_layout === 'editorial' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=editorial`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 2. Neo-Stage Cyber */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'spotlight' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('spotlight')}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    ⚡ High-Octane
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'spotlight' && <div className={styles.layoutRadioInner} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <Zap size={18} style={{ color: '#38bdf8' }} />
                  Neo-Stage Cyber Festival
                </div>
                <p className={styles.layoutCardDesc}>
                  Electric festival & arena show aesthetic. Neon aura glows, fast-pass date check terminal with morning/evening slot chips, and live shows counter.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Fast-Pass Date Check</span>
                  <span className={styles.layoutCardPill}>Neon Ambient Aura</span>
                  <span className={styles.layoutCardPill}>Live Shows Counter</span>
                  <span className={styles.layoutCardPill}>Stage Terminal</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('spotlight');
                  }}
                >
                  {form.profile_layout === 'spotlight' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=spotlight`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 3. Classic Stage Bento */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'classic' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('classic')}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.3)' }}>
                    🎙️ Versatile Bento
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'classic' && <div className={styles.layoutRadioInner} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <LayoutGrid size={18} style={{ color: '#a78bfa' }} />
                  Classic Stage Bento
                </div>
                <p className={styles.layoutCardDesc}>
                  Our original, high-conversion bento grid with quick-access contact actions, structured packages, and social proof showcase.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Bento Grid</span>
                  <span className={styles.layoutCardPill}>Video Reels</span>
                  <span className={styles.layoutCardPill}>Packages Matrix</span>
                  <span className={styles.layoutCardPill}>Instant Booking</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('classic');
                  }}
                >
                  {form.profile_layout === 'classic' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=classic`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 4. VIP Sovereign Black Label */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'vip' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('vip')}
              style={form.profile_layout === 'vip' ? { borderColor: '#d4af37', boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)' } : {}}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#f3e5ab', borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.1)' }}>
                    ⚜️ Sovereign VIP
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'vip' && <div className={styles.layoutRadioInner} style={{ background: '#d4af37' }} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <Crown size={18} style={{ color: '#d4af37' }} />
                  VIP Sovereign Black Label
                </div>
                <p className={styles.layoutCardDesc}>
                  Ultra-luxurious, black-tie aesthetic with brushed champagne gold, royal crests, luxury brand clientele ticker, private concierge booking, and aristocratic provenance.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Champagne Gold</span>
                  <span className={styles.layoutCardPill}>Private Atelier</span>
                  <span className={styles.layoutCardPill}>Concierge Radar</span>
                  <span className={styles.layoutCardPill}>High-End Riders</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  style={form.profile_layout === 'vip' ? { background: 'linear-gradient(135deg, #d4af37, #aa771c)', color: '#050507' } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('vip');
                  }}
                >
                  {form.profile_layout === 'vip' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=vip`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 5. Palace Royale Heritage */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'palace' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('palace')}
              style={form.profile_layout === 'palace' ? { borderColor: '#d4af37', boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)', background: 'linear-gradient(180deg, rgba(6, 32, 25, 0.95), rgba(3, 20, 15, 0.9))' } : {}}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#f5deb3', borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.12)' }}>
                    🏰 Royal Heritage
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'palace' && <div className={styles.layoutRadioInner} style={{ background: '#d4af37' }} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <Crown size={18} style={{ color: '#d4af37' }} />
                  Palace Royale Heritage
                </div>
                <p className={styles.layoutCardDesc}>
                  Majestic royal emerald & burnished brass gold theme tailored for grand Indian palace destination weddings (Udaipur, Jaipur, Lake Como), Shahi Darbar Monograph, and Shubh Muhurat Live Availability Calendar.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Royal Emerald</span>
                  <span className={styles.layoutCardPill}>Archway Portal</span>
                  <span className={styles.layoutCardPill}>Shubh Muhurat Calendar</span>
                  <span className={styles.layoutCardPill}>Roving Caravan Hubs</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  style={form.profile_layout === 'palace' ? { background: 'linear-gradient(135deg, #d4af37, #aa820a)', color: '#120901', fontWeight: 700 } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('palace');
                  }}
                >
                  {form.profile_layout === 'palace' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=palace`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 6. CineStar Red Carpet Premiere */}
            <div
              className={`${styles.layoutOptionCard} ${form.profile_layout === 'cinema' ? styles.layoutOptionCardActive : ''}`}
              onClick={() => handleSelectLayout('cinema')}
              style={form.profile_layout === 'cinema' ? { borderColor: '#ff2a4b', boxShadow: '0 0 25px rgba(229, 9, 20, 0.3)', background: 'linear-gradient(180deg, rgba(38, 7, 16, 0.95), rgba(18, 3, 7, 0.9))' } : {}}
            >
              <div>
                <div className={styles.layoutCardTop}>
                  <span className={styles.layoutBadge} style={{ color: '#ff8095', borderColor: 'rgba(229, 9, 20, 0.45)', background: 'rgba(229, 9, 20, 0.15)' }}>
                    🎬 Red Carpet Premiere
                  </span>
                  <div className={styles.layoutRadio}>
                    {form.profile_layout === 'cinema' && <div className={styles.layoutRadioInner} style={{ background: '#ff2a4b' }} />}
                  </div>
                </div>
                <div className={styles.layoutCardTitle}>
                  <Film size={18} style={{ color: '#ff2a4b' }} />
                  CineStar Red Carpet Premiere
                </div>
                <p className={styles.layoutCardDesc}>
                  High-energy awards night & celebrity arena aesthetic with velvet midnight crimson, theatrical spotlight glows, step-and-repeat celebrity brand wall, and Red Carpet Premiere Live Calendar.
                </p>
                <div className={styles.layoutCardPills}>
                  <span className={styles.layoutCardPill}>Midnight Crimson</span>
                  <span className={styles.layoutCardPill}>Premiere Billboard</span>
                  <span className={styles.layoutCardPill}>IMAX Showreels</span>
                  <span className={styles.layoutCardPill}>Red Carpet Calendar</span>
                </div>
              </div>

              <div className={styles.layoutCardFooter}>
                <button
                  type="button"
                  className={styles.layoutSelectBtn}
                  style={form.profile_layout === 'cinema' ? { background: 'linear-gradient(135deg, #ff2a4b, #990011)', color: '#ffffff', fontWeight: 700 } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLayout('cinema');
                  }}
                >
                  {form.profile_layout === 'cinema' ? '✓ Active Layout' : 'Select Layout'}
                </button>
                <a
                  href={`/${initialProfile?.slug || 'admin-user'}?layout=cinema`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.layoutPreviewLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Live Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photo */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Profile Photo</h3>
          <div className={styles.photoUpload}>
            <div className="avatar avatar-2xl">
              {form.profile_photo_url ? (
                <img
                  src={form.profile_photo_url}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : form.name ? (
                form.name.charAt(0).toUpperCase()
              ) : (
                'A'
              )}
            </div>
            <div style={{ flex: 1, maxWidth: '520px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoFileChange}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isUploadingPhoto ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                  {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {form.profile_photo_url && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => updateField('profile_photo_url', '')}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="input-group mt-2">
                <input
                  type="text"
                  className="input"
                  placeholder="Or paste direct image URL (https://images.unsplash.com/...)"
                  value={form.profile_photo_url}
                  onChange={e => updateField('profile_photo_url', e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <p className="text-xs text-tertiary mt-1">JPG, PNG, WebP. Square portrait recommended. Saves with your profile.</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>
          <div className={styles.fieldGrid}>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="profile-name"
                className="input"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-tagline">
                Tagline
              </label>
              <input
                id="profile-tagline"
                className="input"
                placeholder="Premium Wedding & Corporate Anchor"
                value={form.tagline}
                onChange={e => updateField('tagline', e.target.value)}
              />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label" htmlFor="profile-artist-type">
                Artist Category & Profession
              </label>
              <select
                id="profile-artist-type"
                className="input"
                value={form.artist_type}
                onChange={e => updateField('artist_type', e.target.value)}
              >
                {ARTIST_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label} ({cat.hindiName}) — {cat.badge}
                  </option>
                ))}
              </select>
              <p className="text-xs text-tertiary mt-1">
                Select your primary craft. This personalizes your verified badge, talent directory listing, and booking inquiry specs.
              </p>
            </div>
          </div>
          <div className="input-group mt-4">
            <label className="input-label" htmlFor="profile-bio">
              Bio
            </label>
            <textarea
              id="profile-bio"
              className="input textarea"
              placeholder="Tell clients about your experience, style, and what makes you unique..."
              value={form.bio}
              onChange={e => updateField('bio', e.target.value)}
              rows={5}
            />
            <p className="text-xs text-tertiary">{form.bio.length}/500 characters</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIDEOS & SHOWREELS SECTION (YouTube + Google Drive + Reels) */}
        {/* ========================================================= */}
        <div className={styles.formSection} style={{ border: '1px solid rgba(108, 92, 231, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Film size={20} color="var(--color-primary)" /> Video Showcase & Showreels
              </h3>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Upload links for your YouTube videos, Google Drive performance clips, or Instagram reels. Visitors will watch them directly on your portfolio!
              </p>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '12px' }}>
              {videos.length} {videos.length === 1 ? 'Video' : 'Videos'} Active
            </span>
          </div>

          {/* Add Video Form */}
          <form
            onSubmit={handleAddVideo}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Video Title / Caption *</label>
                  <input
                    required
                    className="input"
                    placeholder="e.g. Grand Wedding Sangeet in Jaipur"
                    value={newVideoTitle}
                    onChange={e => setNewVideoTitle(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Video Link (YouTube, Instagram Reel, or Google Drive) *</label>
                  <input
                    required
                    className="input"
                    placeholder="https://instagram.com/reel/... or https://youtube.com/watch?v=... or Google Drive"
                    value={newVideoUrl}
                    onChange={e => setNewVideoUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Platform Detection Notice */}
              {newVideoUrl && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isGoogleDrive
                      ? 'rgba(59, 130, 246, 0.12)'
                      : detectedPlatform === 'youtube'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : detectedPlatform === 'instagram'
                      ? 'rgba(225, 48, 108, 0.14)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isGoogleDrive
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : detectedPlatform === 'youtube'
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : detectedPlatform === 'instagram'
                      ? '1px solid rgba(225, 48, 108, 0.35)'
                      : '1px solid var(--color-border)',
                    color: isGoogleDrive ? '#93C5FD' : detectedPlatform === 'youtube' ? '#FCA5A5' : detectedPlatform === 'instagram' ? '#F472B6' : 'inherit',
                  }}
                >
                  {isGoogleDrive ? (
                    <>
                      <CheckCircle2 size={16} color="#60A5FA" />
                      <span>
                        <strong>Google Drive Video detected!</strong> Make sure your file&apos;s link sharing is set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong> in Google Drive so clients can play it.
                      </span>
                    </>
                  ) : detectedPlatform === 'youtube' ? (
                    <>
                      <CheckCircle2 size={16} color="#F87171" />
                      <span>
                        <strong>YouTube Video / Short detected!</strong> Will stream directly in HD inside the modal.
                      </span>
                    </>
                  ) : detectedPlatform === 'instagram' ? (
                    <>
                      <CheckCircle2 size={16} color="#E1306C" />
                      <span>
                        <strong>Instagram Reel / Video detected!</strong> Visitors will be able to play and view your reel directly on your portfolio.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      <span>Video link ready to be saved.</span>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isAddingVideo || !newVideoUrl.trim()}
                >
                  {isAddingVideo ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Add to Portfolio
                </button>
              </div>
            </div>
          </form>

          {/* Videos Grid */}
          {videos.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 16px', background: 'transparent' }}>
              <VideoIcon size={32} color="var(--color-text-tertiary)" />
              <div className="empty-state-title" style={{ fontSize: '15px', marginTop: '8px' }}>
                No Showreel Videos Added Yet
              </div>
              <p className="text-xs text-tertiary" style={{ maxWidth: '360px', margin: '4px auto 0' }}>
                Paste your YouTube or Google Drive video links above so event organizers can watch your anchoring performances!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {videos.map(video => {
                const isDrive = video.platform === 'google_drive' || video.url.includes('drive.google.com');
                const isYt = video.platform === 'youtube' || video.url.includes('youtu');
                const isInsta = video.platform === 'instagram' || video.url.includes('instagram.com');
                const driveId = getGoogleDriveId(video.url);
                const ytId = getYouTubeId(video.url);

                return (
                  <div
                    key={video.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Thumbnail / Video Banner */}
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '16/9',
                        width: '100%',
                        background: '#0a0a14',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPlayingVideo(video)}
                    >
                      {isYt && ytId ? (
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                          alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : isDrive && driveId ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <VideoIcon size={32} color="#60A5FA" />
                          <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 600 }}>Google Drive Video</span>
                        </div>
                      ) : isInsta ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #405DE6 0%, #833AB4 30%, #C13584 60%, #E1306C 80%, #FD1D1D 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <Instagram size={32} color="#ffffff" />
                          <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700, letterSpacing: '0.03em' }}>Instagram Reel</span>
                        </div>
                      ) : (
                        <VideoIcon size={32} color="var(--color-text-tertiary)" />
                      )}

                      {/* Play Button Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 200ms ease',
                        }}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          <Play size={20} fill="#0F0E17" color="#0F0E17" style={{ marginLeft: '2px' }} />
                        </div>
                      </div>

                      {/* Platform Badge */}
                      <span
                        className="badge"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          background: isInsta
                            ? 'linear-gradient(135deg, #833AB4, #FD1D1D)'
                            : isDrive
                            ? '#2563EB'
                            : isYt
                            ? '#DC2626'
                            : 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                        }}
                      >
                        {isInsta ? 'Instagram Reel' : isDrive ? 'Google Drive' : isYt ? 'YouTube' : 'Video'}
                      </span>
                    </div>

                    {/* Details & Actions */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                          {video.title}
                        </div>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-tertiary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          <ExternalLink size={10} /> {video.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32)}...
                        </a>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setPlayingVideo(video)}
                          title="Preview Video Player"
                        >
                          <Play size={12} /> Test Play
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => setDeletingVideo(video)}
                          title="Delete Video"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stage Photo Gallery Manager ("Captured On Stage") */}
        <PhotosManager initialPhotos={initialProfile?.photos || []} />

        {/* Event Packages & Pricing Manager */}
        <PackagesManager initialPackages={initialProfile?.service_packages || []} />

        {/* Client Reviews & Testimonials Section */}
        <TestimonialsManager initialTestimonials={initialProfile?.testimonials || []} />

        {/* Location & Contact */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            <MapPin size={18} /> Location & Contact
          </h3>
          <div className={styles.fieldGrid}>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-city">
                City / Base Location
              </label>
              <input
                id="profile-city"
                list="profile-city-suggestions"
                className="input"
                placeholder="Type city or select (e.g. Udaipur, Mumbai, Goa...)"
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
              />
              <datalist id="profile-city-suggestions">
                {MAJOR_CITIES.map(city => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-state">
                State / Region
              </label>
              <input
                id="profile-state"
                className="input"
                placeholder="e.g. Maharashtra, Rajasthan, Delhi, Karnataka..."
                value={form.state}
                onChange={e => updateField('state', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-phone">
                <Phone size={14} /> Phone
              </label>
              <input
                id="profile-phone"
                className="input"
                placeholder="9876543210"
                value={form.phone}
                onChange={e => updateField('phone', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-whatsapp">
                WhatsApp Number
              </label>
              <input
                id="profile-whatsapp"
                className="input"
                placeholder="9876543210"
                value={form.whatsapp_number}
                onChange={e => updateField('whatsapp_number', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-price">
                Starting Price (₹)
              </label>
              <input
                id="profile-price"
                className="input"
                type="number"
                placeholder="15000"
                value={form.starting_price}
                onChange={e => updateField('starting_price', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-experience">
                Experience (Years)
              </label>
              <input
                id="profile-experience"
                className="input"
                type="number"
                placeholder="5"
                value={form.experience_years}
                onChange={e => updateField('experience_years', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-gigs" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--color-primary)" /> Stage Gigs Done (Total Shows)
              </label>
              <input
                id="profile-gigs"
                className="input"
                type="number"
                placeholder="e.g. 650"
                value={form.gigs_completed}
                onChange={e => updateField('gigs_completed', e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                Displays on your public profile Bento highlight (e.g. <strong>{form.gigs_completed || '650'}+ Stage Gigs Done</strong>)
              </span>
            </div>
          </div>
        </div>

        {/* Tour Routing & Destination Hubs */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Radio size={18} color="var(--color-primary)" /> Tour Routing & Active Destination Hubs
              </h3>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Key circuits & cities you frequently tour (displayed on your Spotlight & VIP public profile).
              </p>
            </div>
            <span className="badge badge-secondary" style={{ fontSize: '12px' }}>
              {form.tour_cities.length} Active Hubs
            </span>
          </div>

          {/* Active Hub Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {form.tour_cities.map((hub, idx) => (
              <span
                key={idx}
                className={styles.chip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', borderColor: 'var(--color-primary)' }}
              >
                <MapPin size={12} color="var(--color-primary)" />
                <strong>{hub.city}</strong>
                <span style={{ opacity: 0.7, fontSize: '11px' }}>· {hub.tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTourCity(idx)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: '2px', display: 'flex' }}
                  title="Remove Hub"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Custom Hub Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <input
              type="text"
              className="input"
              placeholder="City (e.g. Udaipur, Dubai, Goa, London...)"
              value={newTourCity}
              onChange={e => setNewTourCity(e.target.value)}
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="text"
              className="input"
              placeholder="Circuit Tag (e.g. Royal Weddings, Corporate Galas...)"
              value={newTourTag}
              onChange={e => setNewTourTag(e.target.value)}
              style={{ flex: '1 1 240px' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTourCity(newTourCity, newTourTag);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAddTourCity(newTourCity, newTourTag)}
              disabled={!newTourCity.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} /> Add Hub
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Quick add:</span>
            {[
              { city: 'Mumbai', tag: 'Celebrity Galas' },
              { city: 'Delhi NCR', tag: 'Mega Arenas & Sangeets' },
              { city: 'Goa', tag: 'Destination Beach Weddings' },
              { city: 'Udaipur / Jaipur', tag: 'Royal Palace Weddings' },
              { city: 'Dubai, UAE', tag: 'International Conventions' },
              { city: 'Bengaluru', tag: 'Tech Summits & Concerts' },
            ].map(preset => (
              <button
                key={preset.city}
                type="button"
                className="btn btn-ghost btn-xs"
                style={{ fontSize: '11px', padding: '2px 8px', border: '1px dashed var(--color-border)' }}
                onClick={() => handleAddTourCity(preset.city, preset.tag)}
              >
                + {preset.city}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              <Languages size={18} /> Languages You Host In
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Select from presets or add custom languages via <strong>Other</strong>
            </span>
          </div>

          <div className={styles.chipGrid}>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                className={`${styles.chip} ${form.languages.includes(lang) ? styles.chipActive : ''}`}
                onClick={() => toggleArrayItem('languages', lang)}
                type="button"
              >
                {lang}
              </button>
            ))}

            {/* Custom languages added by user */}
            {customLanguages.map(customLang => (
              <button
                key={customLang}
                className={`${styles.chip} ${styles.chipActive}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleRemoveLanguage(customLang)}
                type="button"
                title="Click to remove"
              >
                <span>{customLang}</span>
                <X size={13} />
              </button>
            ))}

            {/* Other / Custom chip */}
            <button
              className={`${styles.chip} ${(showCustomLangInput || form.languages.includes('Other') || customLanguages.length > 0) ? styles.chipActive : ''}`}
              onClick={() => {
                setShowCustomLangInput(prev => !prev);
              }}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <span>Other</span>
              {showCustomLangInput ? (
                <span style={{ fontSize: '11px', opacity: 0.8 }}>▾</span>
              ) : (
                <Plus size={13} />
              )}
            </button>
          </div>

          {/* Expandable Custom Language Input Box */}
          {showCustomLangInput && (
            <div
              style={{
                marginTop: '12px',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Languages size={15} color="var(--color-primary)" />
                <span>Add Your Custom Language</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Marwari, Sindhi, French, German, Haryanvi, Konkani, Spanish..."
                  value={customLangInput}
                  onChange={e => setCustomLangInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomLanguage();
                    }
                  }}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddCustomLanguage()}
                  disabled={!customLangInput.trim()}
                  style={{ gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Plus size={15} /> Add Language
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                Type your language and press <strong>Enter</strong> or click <strong>Add Language</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Event Types */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              <Mic size={18} /> Event Types You Cover
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Click <strong>Other</strong> to write your custom event types & ceremonies
            </span>
          </div>

          <div className={styles.chipGrid}>
            {EVENT_TYPES.filter(type => type !== 'Other').map(type => (
              <button
                key={type}
                className={`${styles.chip} ${form.event_types.includes(type) ? styles.chipActive : ''}`}
                onClick={() => toggleArrayItem('event_types', type)}
                type="button"
              >
                {type}
              </button>
            ))}

            {/* Custom event types added by user */}
            {customEventTypes.map(customType => (
              <button
                key={customType}
                className={`${styles.chip} ${styles.chipActive}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleRemoveEventType(customType)}
                type="button"
                title="Click to remove"
              >
                <span>{customType}</span>
                <X size={13} />
              </button>
            ))}

            {/* Other Chip */}
            <button
              className={`${styles.chip} ${(form.event_types.includes('Other') || showCustomEventInput || customEventTypes.length > 0) ? styles.chipActive : ''}`}
              onClick={() => {
                toggleArrayItem('event_types', 'Other');
                setShowCustomEventInput(prev => !prev);
              }}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <span>Other</span>
              {(form.event_types.includes('Other') || showCustomEventInput) ? (
                <span style={{ fontSize: '11px', opacity: 0.8 }}>▾</span>
              ) : (
                <Plus size={13} />
              )}
            </button>
          </div>

          {/* Expandable Custom Event Type Input Box */}
          {(showCustomEventInput || form.event_types.includes('Other') || customEventTypes.length > 0) && (
            <div
              style={{
                marginTop: '12px',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic size={15} color="var(--color-primary)" />
                <span>Add Custom Event Type / Ceremony</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Haldi-Mehendi, Pool Party, Baby Shower, Convocation, Standup Comedy, Sports Day..."
                  value={customEventInput}
                  onChange={e => setCustomEventInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEventType();
                    }
                  }}
                  style={{ flex: 1 }}
                  autoFocus={showCustomEventInput}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddCustomEventType()}
                  disabled={!customEventInput.trim()}
                  style={{ gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Plus size={15} /> Add Event Type
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                Type custom ceremony or special occasion and press <strong>Enter</strong> or click <strong>Add Event Type</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Prestigious Clients & Luxury Brands Marquee */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Building size={18} color="#d4af37" /> Prestigious Clients & Luxury Brands
              </h3>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Brands & institutions you have hosted for. These glide across your public profile's luxury marquee ticker!
              </p>
            </div>
            <span className="badge badge-secondary" style={{ fontSize: '12px' }}>
              {form.client_brands.length} Brands Listed
            </span>
          </div>

          {/* Active Brands Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {form.client_brands.map((brand, idx) => (
              <span
                key={idx}
                className={styles.chip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(212, 175, 55, 0.4)', color: '#f3e5ab' }}
              >
                <Award size={12} color="#d4af37" />
                <span>{brand}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBrand(brand)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}
                  title="Remove Brand"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Custom Brand Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Taj Hotels, Forbes India, BMW, Marriott Bonvoy, Cartier..."
              value={newBrandInput}
              onChange={e => setNewBrandInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBrand(newBrandInput);
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAddBrand(newBrandInput)}
              disabled={!newBrandInput.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} /> Add Brand
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Add preset:</span>
            {[
              'Taj Hotels & Palaces',
              'Forbes India Gala',
              'BMW Excellence Club',
              'Marriott Bonvoy',
              'Filmfare Red Carpet',
              'The Oberoi Group',
              'Rolls-Royce',
              'TEDx Conferences',
              'Vogue Weddings',
              'Cartier Privé',
              'ICICI Bank',
              'Tata Motors',
            ].map(preset => (
              <button
                key={preset}
                type="button"
                className="btn btn-ghost btn-xs"
                style={{ fontSize: '11px', padding: '2px 8px', border: '1px dashed rgba(212, 175, 55, 0.3)', color: '#f3e5ab' }}
                onClick={() => handleAddBrand(preset)}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Signature Skills & Specializations */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Sparkles size={18} color="var(--color-primary)" /> Signature Skills & Specialties
              </h3>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Your signature stage superpowers and craft specializations.
              </p>
            </div>
            <span className="badge badge-secondary" style={{ fontSize: '12px' }}>
              {form.artist_specialties.length} Specialties
            </span>
          </div>

          {/* Active Specialties */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {form.artist_specialties.map((spec, idx) => (
              <span
                key={idx}
                className={styles.chip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.1)', borderColor: 'var(--color-primary)' }}
              >
                <Crown size={12} color="var(--color-primary)" />
                <span>{spec}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(spec)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}
                  title="Remove Specialty"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Custom Specialty Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Sangeet Direction, Corporate Diplomacy, Royal Wedding Protocol..."
              value={newSpecialtyInput}
              onChange={e => setNewSpecialtyInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSpecialty(newSpecialtyInput);
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAddSpecialty(newSpecialtyInput)}
              disabled={!newSpecialtyInput.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} /> Add Skill
            </button>
          </div>

          {/* Presets */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Presets:</span>
            {[
              'Bilingual / Multilingual Emcee',
              'High-Energy Crowd Work & Roasts',
              'Royal Wedding Protocol & Sangeet Direction',
              'Fortune 500 Corporate Diplomacy',
              'Standup Comedy & Quick Wit',
              'Live Auctioneering',
              'Keynote Moderation & Fireside Chats',
            ].map(preset => (
              <button
                key={preset}
                type="button"
                className="btn btn-ghost btn-xs"
                style={{ fontSize: '11px', padding: '2px 8px', border: '1px dashed var(--color-border)' }}
                onClick={() => handleAddSpecialty(preset)}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            <Globe size={18} /> Social & Web Links
          </h3>
          <div className={styles.fieldGrid}>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-insta">
                <Instagram size={14} /> Instagram
              </label>
              <input
                id="profile-insta"
                className="input"
                placeholder="https://instagram.com/yourhandle or @yourhandle"
                value={form.instagram_url}
                onChange={e => updateField('instagram_url', e.target.value)}
                onBlur={e => {
                  if (e.target.value) updateField('instagram_url', normalizeExternalUrl(e.target.value, 'instagram'));
                }}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-yt">
                <Youtube size={14} /> YouTube
              </label>
              <input
                id="profile-yt"
                className="input"
                placeholder="https://youtube.com/@yourchannel or channel handle"
                value={form.youtube_url}
                onChange={e => updateField('youtube_url', e.target.value)}
                onBlur={e => {
                  if (e.target.value) updateField('youtube_url', normalizeExternalUrl(e.target.value, 'youtube'));
                }}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-fb">
                <Facebook size={14} /> Facebook
              </label>
              <input
                id="profile-fb"
                className="input"
                placeholder="https://facebook.com/yourpage"
                value={form.facebook_url}
                onChange={e => updateField('facebook_url', e.target.value)}
                onBlur={e => {
                  if (e.target.value) updateField('facebook_url', normalizeExternalUrl(e.target.value, 'facebook'));
                }}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="profile-web">
                <Globe size={14} /> Website
              </label>
              <input
                id="profile-web"
                className="input"
                placeholder="https://yourwebsite.com"
                value={form.website_url}
                onChange={e => updateField('website_url', e.target.value)}
                onBlur={e => {
                  if (e.target.value) updateField('website_url', normalizeExternalUrl(e.target.value, 'generic'));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Quick Save Bar */}
      <div className={styles.stickyBottomBar}>
        <div className={styles.stickyBarInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {customLanguages.length > 0 || customEventTypes.length > 0
                ? `${customLanguages.length + customEventTypes.length} custom entries active`
                : 'Profile changes ready'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {initialProfile?.slug && (
              <a
                href={`/${initialProfile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <ExternalLink size={14} /> View Public Profile
              </a>
            )}
            <button
              type="button"
              className={`btn btn-primary btn-sm ${isPending ? 'btn-loading' : ''}`}
              onClick={handleSave}
              disabled={isPending}
              style={{ gap: '6px', fontWeight: 600 }}
            >
              {isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="modal-backdrop" onClick={() => setPlayingVideo(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '820px',
              width: '95%',
              background: '#090812',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="badge"
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    background: playingVideo.platform === 'instagram' || playingVideo.url.includes('instagram.com')
                      ? 'linear-gradient(135deg, #833AB4, #FD1D1D)'
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
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: playingVideo.platform === 'instagram' || playingVideo.url.includes('instagram.com') ? '9/11' : '16/9', maxHeight: '75vh', background: '#000' }}>
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
                      This video is hosted on an external platform ({playingVideo.platform}). Click below to watch the full video.
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
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingVideo}
        onClose={() => setDeletingVideo(null)}
        onConfirm={confirmDeleteVideo}
        title={`Delete "${deletingVideo?.title}"?`}
        description="Are you sure you want to remove this video from your showcase? It will no longer appear on your public portfolio."
        confirmText="Delete Video"
        cancelText="Cancel"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
