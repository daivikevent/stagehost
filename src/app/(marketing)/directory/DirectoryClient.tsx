'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  X,
  MessageCircle,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  EVENT_TYPES,
  MAJOR_CITIES,
  LANGUAGES,
  ARTIST_CATEGORIES,
  getArtistCategory,
  getArtistPluralTitle,
} from '@/constants';
import { formatINR, cn, getWhatsAppLink } from '@/lib/utils';
import { useScrollRevealContainer } from '@/hooks/useScrollReveal';
import styles from './directory.module.css';

export interface DirectoryAnchor {
  id: string;
  name: string;
  slug: string;
  artist_type?: string | null;
  tagline?: string | null;
  city?: string | null;
  state?: string | null;
  languages?: string[] | null;
  event_types?: string[] | null;
  experience_years?: number | null;
  starting_price?: number | null;
  profile_photo_url?: string | null;
  whatsapp_number?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
}

const DEMO_FALLBACK_ANCHORS: DirectoryAnchor[] = [
  { id: 'd1', name: 'Rahul Sharma', slug: 'rahul-sharma', artist_type: 'emcee', tagline: 'Premium Wedding & Corporate Anchor', city: 'Mumbai', state: 'Maharashtra', languages: ['Hindi', 'English', 'Marathi'], event_types: ['Wedding', 'Sangeet', 'Corporate Event'], experience_years: 8, starting_price: 25000, profile_photo_url: null, whatsapp_number: '9876543210', is_featured: true, is_verified: true },
  { id: 'd2', name: 'DJ Aaryan Roy', slug: 'dj-aaryan', artist_type: 'dj', tagline: 'Celebrity Wedding & Club DJ | EDM & Bollywood', city: 'Delhi', state: 'Delhi', languages: ['Hindi', 'English', 'Punjabi'], event_types: ['Sangeet', 'Cocktail Party', 'Concert'], experience_years: 9, starting_price: 35000, profile_photo_url: null, whatsapp_number: '9988776655', is_featured: true, is_verified: true },
  { id: 'd3', name: 'Priya Kapoor', slug: 'priya-kapoor', artist_type: 'singer', tagline: 'Live Sufi & Bollywood Acoustic Vocalist', city: 'Bangalore', state: 'Karnataka', languages: ['Hindi', 'English', 'Punjabi'], event_types: ['Wedding', 'Reception', 'Concert'], experience_years: 6, starting_price: 28000, profile_photo_url: null, whatsapp_number: '9955443322', is_featured: true, is_verified: true },
  { id: 'd4', name: 'Amit Joshi', slug: 'amit-joshi', artist_type: 'emcee', tagline: 'Corporate Emcee | Conferences & Award Nights', city: 'Pune', state: 'Maharashtra', languages: ['Hindi', 'English', 'Marathi'], event_types: ['Corporate Event', 'Conference', 'Award Ceremony'], experience_years: 10, starting_price: 30000, profile_photo_url: null, whatsapp_number: '9955443322', is_featured: false, is_verified: true },
  { id: 'd5', name: 'Rohan Saxena', slug: 'rohan-saxena', artist_type: 'standup', tagline: 'Clean Corporate Comedy & Crowd Work Humorist', city: 'Mumbai', state: 'Maharashtra', languages: ['Hindi', 'English'], event_types: ['Corporate Event', 'College Festival', 'Award Ceremony'], experience_years: 5, starting_price: 20000, profile_photo_url: null, whatsapp_number: '9871234567', is_featured: false, is_verified: true },
  { id: 'd6', name: 'The Sonic Rhythms', slug: 'sonic-rhythms', artist_type: 'musician', tagline: '5-Piece Fusion Band | Retro Bollywood & Pop', city: 'Goa', state: 'Goa', languages: ['Hindi', 'English'], event_types: ['Concert', 'Wedding', 'Cocktail Party'], experience_years: 7, starting_price: 55000, profile_photo_url: null, whatsapp_number: '9900112233', is_featured: false, is_verified: false },
  { id: 'd7', name: 'Sneha Verma', slug: 'sneha-verma', artist_type: 'emcee', tagline: 'Vibrant Host for Weddings & Cultural Shows', city: 'Jaipur', state: 'Rajasthan', languages: ['Hindi', 'Rajasthani', 'English'], event_types: ['Wedding', 'Sangeet', 'College Festival'], experience_years: 4, starting_price: 12000, profile_photo_url: null, whatsapp_number: '9871234567', is_featured: false, is_verified: false },
  { id: 'd8', name: 'Ananya Patel', slug: 'ananya-patel', artist_type: 'dancer', tagline: 'Celebrity Wedding Choreographer & Dance Troupe', city: 'Ahmedabad', state: 'Gujarat', languages: ['Hindi', 'Gujarati', 'English'], event_types: ['Wedding', 'Reception', 'Engagement'], experience_years: 6, starting_price: 25000, profile_photo_url: null, whatsapp_number: '9876001122', is_featured: false, is_verified: false },
];

export function DirectoryClient({ initialAnchors }: { initialAnchors: DirectoryAnchor[] }) {
  const containerRef = useScrollRevealContainer<HTMLDivElement>();
  const [search, setSearch] = useState('');
  const [selectedArtistType, setSelectedArtistType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'experience' | 'price_low' | 'price_high'>('featured');

  // Combine real DB anchors with demo fallbacks if DB has few anchors
  const allAnchors = useMemo(() => {
    if (!initialAnchors || initialAnchors.length === 0) {
      return DEMO_FALLBACK_ANCHORS;
    }
    const realSlugs = new Set(initialAnchors.map(a => a.slug));
    const extraDemos = DEMO_FALLBACK_ANCHORS.filter(d => !realSlugs.has(d.slug));
    return [...initialAnchors, ...extraDemos];
  }, [initialAnchors]);

  const filtered = useMemo(() => {
    let result = [...allAnchors];

    // Artist Category Filter
    if (selectedArtistType !== 'all') {
      result = result.filter(a => (a.artist_type || 'emcee').toLowerCase() === selectedArtistType.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.city && a.city.toLowerCase().includes(q)) ||
        (a.tagline && a.tagline.toLowerCase().includes(q))
      );
    }
    if (selectedCity) result = result.filter(a => a.city === selectedCity);
    if (selectedEventType) result = result.filter(a => a.event_types && a.event_types.includes(selectedEventType));
    if (selectedLanguage) result = result.filter(a => a.languages && a.languages.includes(selectedLanguage));

    result.sort((a, b) => {
      if (sortBy === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      if (sortBy === 'experience') return (b.experience_years || 0) - (a.experience_years || 0);
      if (sortBy === 'price_low') return (a.starting_price || 0) - (b.starting_price || 0);
      if (sortBy === 'price_high') return (b.starting_price || 0) - (a.starting_price || 0);
      return 0;
    });

    return result;
  }, [allAnchors, search, selectedArtistType, selectedCity, selectedEventType, selectedLanguage, sortBy]);

  const hasFilters = selectedCity || selectedEventType || selectedLanguage || selectedArtistType !== 'all' || search;
  const clearFilters = () => {
    setSelectedArtistType('all');
    setSearch('');
    setSelectedCity('');
    setSelectedEventType('');
    setSelectedLanguage('');
  };

  return (
    <div ref={containerRef}>
      {/* Page Header */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}><Sparkles size={14} /> Anchor Directory</div>
        <h1 className={styles.heroTitle}>Find Your Perfect Event Anchor</h1>
        <p className={styles.heroSubtitle}>
          Browse verified professional anchors across India. Filter by city, event type, and language.
        </p>

        {/* Search Bar */}
        <div className={styles.searchWrap}>
          <div className={styles.searchBox}>
            <Search size={20} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by name, city, or specialty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className={cn(styles.filterToggle, showFilters && styles.filterToggleActive)}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} />
            Filters
            {hasFilters && <span className={styles.filterCount}>!</span>}
          </button>
        </div>

        {/* Multi-Artist Category Pills */}
        <div className={styles.categoryPills}>
          <button
            type="button"
            className={cn(styles.categoryPill, selectedArtistType === 'all' && styles.categoryPillActive)}
            onClick={() => setSelectedArtistType('all')}
          >
            ✨ All Artists
          </button>
          {ARTIST_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={cn(styles.categoryPill, selectedArtistType === cat.id && styles.categoryPillActive)}
              onClick={() => setSelectedArtistType(cat.id)}
            >
              <span>{cat.emoji}</span> {cat.shortLabel}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <select className={styles.filterSelect} value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              <option value="">All Cities</option>
              {MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={styles.filterSelect} value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)}>
              <option value="">All Event Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={styles.filterSelect} value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>
              <option value="">All Languages</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {hasFilters && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Results */}
      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <p className={styles.resultsCount}>
            Showing <strong>{filtered.length}</strong> {selectedArtistType === 'all' ? 'artist' : getArtistCategory(selectedArtistType).shortLabel.toLowerCase()}{filtered.length !== 1 ? 's' : ''}
          </p>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="featured">Featured First</option>
            <option value="experience">Most Experienced</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyResult}>
            <Search size={40} />
            <h3>No artists found</h3>
            <p>Try adjusting your category, search, or filters</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { clearFilters(); setSelectedArtistType('all'); }}>Clear All Filters</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((anchor) => (
              <div key={anchor.id} className={cn(styles.card, anchor.is_featured && styles.cardFeatured, 'reveal')}>
                {anchor.is_featured && (
                  <div className={styles.featuredBadge}>
                    <Star size={12} fill="currentColor" /> Spotlight
                  </div>
                )}

                <div className={styles.cardTop}>
                  {/* Avatar */}
                  <div className={styles.avatar}>
                    {anchor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>

                  <div className={styles.cardInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h3 className={styles.cardName}>{anchor.name}</h3>
                      <span className={styles.artistBadge}>
                        {getArtistCategory(anchor.artist_type).emoji} {getArtistCategory(anchor.artist_type).shortLabel}
                      </span>
                      {anchor.is_verified && (
                        <span
                          title="Verified Artist: Identity & Subscription verified via online payment KYC. Direct independent booking; not a performance guarantee."
                          style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
                        >
                          <CheckCircle2 size={15} color="#38bdf8" fill="rgba(56, 189, 248, 0.2)" />
                        </span>
                      )}
                    </div>
                    <p className={styles.cardTagline}>{anchor.tagline || 'Professional Event Anchor & Emcee'}</p>
                    <div className={styles.cardMeta}>
                      <span><MapPin size={12} /> {anchor.city || 'India'}</span>
                      {anchor.experience_years ? (
                        <span><Star size={12} /> {anchor.experience_years}+ yrs</span>
                      ) : null}
                      {anchor.starting_price && (
                        <span>From {formatINR(anchor.starting_price)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className={styles.tags}>
                  {(anchor.languages || ['Hindi', 'English']).slice(0, 3).map(l => (
                    <span key={l} className={styles.tag}>{l}</span>
                  ))}
                  {(anchor.event_types || ['Corporate Event', 'Wedding']).slice(0, 2).map(t => (
                    <span key={t} className={cn(styles.tag, styles.tagEvent)}>{t}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <Link href={`/${anchor.slug}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    View Portfolio <ChevronRight size={14} />
                  </Link>
                  {anchor.whatsapp_number && (
                    <a
                      href={getWhatsAppLink(anchor.whatsapp_number, `Hi ${anchor.name}! Found you on StageHost. Interested in booking you.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('btn btn-sm', styles.waBtn)}
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA for anchors */}
      <section className={styles.anchorCta}>
        <Sparkles size={28} color="var(--color-accent)" />
        <h2>Are you an anchor?</h2>
        <p>Create your free professional portfolio and get discovered by clients across India.</p>
        <Link href="/register" className="btn btn-accent btn-lg">
          Build Your Portfolio Free
        </Link>
      </section>

      {/* Intermediary Safe Harbor & Direct Booking Trust Footnote */}
      <div className={styles.intermediaryNotice}>
        <div className={styles.noticeIconWrap}>
          <ShieldCheck size={16} color="#818cf8" />
        </div>
        <div className={styles.noticeText}>
          <strong>Independent Artist Discovery:</strong> StageHost is an open discovery and SaaS portfolio platform. All artists listed are independent professionals. Event contracts, schedule coordination, and payments are conducted directly between client and artist without platform intermediary liability.
        </div>
      </div>
    </div>
  );
}
