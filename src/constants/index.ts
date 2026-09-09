/* ============================================
   StageHost — App Constants
   ============================================ */

// ---- Plan Configuration ----
export const PLAN_TIERS = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  PREMIUM: 3,
} as const;

export const DEFAULT_PLAN_LIMITS = {
  [PLAN_TIERS.FREE]: {
    max_videos: 5,
    max_photos: 10,
    max_service_packages: 3,
    custom_domain: false,
    remove_branding_footer: false,
    remove_branding_badge: false,
    remove_branding_email: false,
    remove_branding_full: false,
    google_drive_integration: false,
    travel_buffer_scheduling: false,
    analytics_dashboard: false,
    lead_management: false,
    priority_directory_listing: false,
    featured_directory_listing: false,
    custom_theme_colors: false,
    seo_tools: false,
    invoice_generation: false,
    google_calendar_sync: false,
  },
  [PLAN_TIERS.STARTER]: {
    max_videos: 15,
    max_photos: 30,
    max_service_packages: 5,
    custom_domain: false,
    remove_branding_footer: true,
    remove_branding_badge: false,
    remove_branding_email: false,
    remove_branding_full: false,
    google_drive_integration: false,
    travel_buffer_scheduling: false,
    analytics_dashboard: true,
    lead_management: true,
    priority_directory_listing: false,
    featured_directory_listing: false,
    custom_theme_colors: false,
    seo_tools: false,
    invoice_generation: false,
    google_calendar_sync: false,
  },
  [PLAN_TIERS.PRO]: {
    max_videos: -1, // unlimited
    max_photos: -1,
    max_service_packages: -1,
    custom_domain: false,
    remove_branding_footer: true,
    remove_branding_badge: true,
    remove_branding_email: true,
    remove_branding_full: false,
    google_drive_integration: true,
    travel_buffer_scheduling: true,
    analytics_dashboard: true,
    lead_management: true,
    priority_directory_listing: true,
    featured_directory_listing: false,
    custom_theme_colors: false,
    seo_tools: true,
    invoice_generation: false,
    google_calendar_sync: false,
  },
  [PLAN_TIERS.PREMIUM]: {
    max_videos: -1,
    max_photos: -1,
    max_service_packages: -1,
    custom_domain: true,
    remove_branding_footer: true,
    remove_branding_badge: true,
    remove_branding_email: true,
    remove_branding_full: true,
    google_drive_integration: true,
    travel_buffer_scheduling: true,
    analytics_dashboard: true,
    lead_management: true,
    priority_directory_listing: true,
    featured_directory_listing: true,
    custom_theme_colors: true,
    seo_tools: true,
    invoice_generation: true,
    google_calendar_sync: true,
  },
} as const;

// ---- Branding Removal Map ----
// Which plan tier removes which branding placement
export const BRANDING_REMOVAL_MAP = {
  footer: PLAN_TIERS.STARTER,    // Removed at Starter+
  badge: PLAN_TIERS.PRO,         // Removed at Pro+
  email: PLAN_TIERS.PRO,         // Removed at Pro+
  qr: PLAN_TIERS.PREMIUM,       // Removed at Premium only
  og_tags: PLAN_TIERS.PREMIUM,
  favicon: PLAN_TIERS.PREMIUM,
  loading: PLAN_TIERS.PREMIUM,
} as const;

// ---- Event Types ----
export const EVENT_TYPES = [
  'Wedding',
  'Sangeet',
  'Reception',
  'Engagement',
  'Corporate Event',
  'Product Launch',
  'Award Ceremony',
  'Conference',
  'Birthday Party',
  'Anniversary',
  'Cocktail Party',
  'College Festival',
  'Fashion Show',
  'Concert',
  'Live Show',
  'Private Party',
  'Religious Event',
  'Other',
] as const;

// ---- Languages ----
export const LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Urdu',
  'Rajasthani',
  'Bhojpuri',
  'Odia',
  'Assamese',
] as const;

// ---- Indian States ----
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
  'Puducherry',
  'Jammu and Kashmir',
  'Ladakh',
] as const;

// ---- Major Indian Cities ----
export const MAJOR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Varanasi',
  'Srinagar',
  'Aurangabad',
  'Dhanbad',
  'Amritsar',
  'Noida',
  'Gurgaon',
  'Chandigarh',
  'Surat',
  'Coimbatore',
  'Jodhpur',
  'Udaipur',
  'Goa',
  'Dehradun',
  'Raipur',
] as const;

// ---- Slot Types ----
export const SLOT_TYPES = {
  MORNING: 'morning',
  EVENING: 'evening',
  FULL_DAY: 'full_day',
} as const;

export const SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
  TRAVEL: 'travel',
  TENTATIVE: 'tentative',
} as const;

export const SLOT_STATUS_COLORS = {
  available: 'var(--color-success)',
  booked: 'var(--color-primary)',
  blocked: 'var(--color-text-tertiary)',
  travel: 'var(--color-warning)',
  tentative: '#F59E0B',
} as const;

export const SLOT_STATUS_LABELS = {
  available: 'Available',
  booked: 'Booked',
  blocked: 'Blocked',
  travel: 'Travel Day',
  tentative: 'Pencil Hold (Tentative)',
} as const;

// ---- Inquiry Status ----
export const INQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const;

export const INQUIRY_STATUS_COLORS = {
  new: 'primary',
  contacted: 'warning',
  converted: 'success',
  lost: 'error',
} as const;

// ---- Video Platforms ----
export const VIDEO_PLATFORMS = {
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  GOOGLE_DRIVE: 'google_drive',
  OTHER: 'other',
} as const;

export const VIDEO_PLATFORM_LABELS = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google_drive: 'Google Drive',
  other: 'Other',
} as const;

// ---- Budget Ranges (INR) ----
export const BUDGET_RANGES = [
  'Under ₹10,000',
  '₹10,000 - ₹25,000',
  '₹25,000 - ₹50,000',
  '₹50,000 - ₹1,00,000',
  '₹1,00,000 - ₹2,50,000',
  'Above ₹2,50,000',
  'Flexible / Not Sure',
] as const;

// ---- Onboarding Steps ----
export const ONBOARDING_STEPS = [
  { step: 1, label: 'Basic Info', description: 'Name, bio, and tagline' },
  { step: 2, label: 'Profile Photo', description: 'Upload your best photo' },
  { step: 3, label: 'Details', description: 'Languages, city, event types' },
  { step: 4, label: 'Social Links', description: 'Connect your social media' },
  { step: 5, label: 'First Video', description: 'Add your best performance' },
] as const;

// ---- Portfolio Themes ----
export const PORTFOLIO_THEMES = [
  {
    id: 'obsidian-night',
    name: 'Obsidian Night',
    primary: '#6C5CE7',
    primaryLight: 'rgba(108, 92, 231, 0.15)',
    bg: '#0A0A14',
    bgSecondary: '#12121A',
    text: '#FFFFFF',
    textSecondary: '#A0A0B0',
    border: 'rgba(255, 255, 255, 0.08)',
    availableFrom: 'free',
  },
  {
    id: 'pearl-white',
    name: 'Pearl White',
    primary: '#4F46E5',
    primaryLight: 'rgba(79, 70, 229, 0.1)',
    bg: '#F8FAFC',
    bgSecondary: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    availableFrom: 'free',
  },
  {
    id: 'crimson-stage',
    name: 'Crimson Stage',
    primary: '#EF4444',
    primaryLight: 'rgba(239, 68, 68, 0.15)',
    bg: '#0C0A09',
    bgSecondary: '#1C1917',
    text: '#FAFAF9',
    textSecondary: '#A8A29E',
    border: 'rgba(255, 255, 255, 0.08)',
    availableFrom: 'free',
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    primary: '#8B5CF6',
    primaryLight: 'rgba(139, 92, 246, 0.15)',
    bg: '#0F0B1E',
    bgSecondary: '#18122B',
    text: '#FAF5FF',
    textSecondary: '#C4B5FD',
    border: 'rgba(139, 92, 246, 0.2)',
    availableFrom: 'free',
  },
  {
    id: 'emerald-glow',
    name: 'Emerald Glow',
    primary: '#10B981',
    primaryLight: 'rgba(16, 185, 129, 0.15)',
    bg: '#052E16',
    bgSecondary: '#064E3B',
    text: '#ECFDF5',
    textSecondary: '#A7F3D0',
    border: 'rgba(16, 185, 129, 0.2)',
    availableFrom: 'free',
  },
] as const;

export type PortfolioThemeId = typeof PORTFOLIO_THEMES[number]['id'];

// ---- Canonical Service Packages (Synchronized Across All Themes & Profiles) ----
export interface CanonicalServicePackage {
  id: string;
  profile_id?: string;
  name: string;
  description: string;
  event_type: string;
  price_range_min: number | null;
  price_range_max: number | null;
  is_active: boolean;
  sort_order: number;
  inclusions: string[];
}

export const CANONICAL_SERVICE_PACKAGES: CanonicalServicePackage[] = [
  {
    id: 'canon-pkg-1',
    name: 'The Sangeet & After-Party Experience',
    description: '4 hours of non-stop energy, personalized couple roasts, dance troupe cues, interactive family games, and seamless DJ handoff.',
    event_type: 'Sangeet',
    price_range_min: 55000,
    price_range_max: 75000,
    is_active: true,
    sort_order: 1,
    inclusions: [
      'Pre-Event Couple Briefing & Chemistry Games',
      'High-Energy Interactive Sangeet Mic Direction',
      'Dance Troupe & Family Cues Synchronization',
      'DJ & Sound Tech Handoff Protocols',
    ],
  },
  {
    id: 'canon-pkg-2',
    name: 'Royal Destination Wedding (Full 2 Days)',
    description: 'Complete coverage for Mehendi, Sangeet Night, Royal Varmala, and Grand Reception. Includes pre-wedding scripting & coordination.',
    event_type: 'Wedding',
    price_range_min: 125000,
    price_range_max: 180000,
    is_active: true,
    sort_order: 2,
    inclusions: [
      'Full 2-Day Coverage (Mehendi, Sangeet & Reception)',
      'Customized Royal Varmala Narrative',
      'VIP Dignitary & Guest Calibration',
      'Dedicated Stage Manager Coordination',
    ],
  },
  {
    id: 'canon-pkg-3',
    name: 'Corporate Summit & Annual Gala Emcee',
    description: 'Executive stage presence, CXO panel moderation, formal awards presentation, and bilingual protocol management.',
    event_type: 'Corporate Gala',
    price_range_min: 50000,
    price_range_max: 70000,
    is_active: true,
    sort_order: 3,
    inclusions: [
      'Executive CXO & Keynote Speaker Introductions',
      'Bilingual Fluency (Hindi & English)',
      'Strict Run-of-Show Protocol & Timekeeping',
      'Gala Awards Distribution Moderation',
    ],
  },
];

/**
 * Returns active service packages from profile if configured,
 * otherwise returns canonical synchronized packages so all themes render consistently.
 */
export function getEffectiveServicePackages(profile?: { service_packages?: any[] | null }): CanonicalServicePackage[] {
  if (profile?.service_packages && Array.isArray(profile.service_packages)) {
    const active = profile.service_packages.filter((pkg) => pkg && pkg.is_active !== false);
    if (active.length > 0) {
      return active.map((pkg, idx) => ({
        id: pkg.id || `pkg-${idx}`,
        profile_id: pkg.profile_id,
        name: pkg.name,
        description: pkg.description || '',
        event_type: pkg.event_type || 'Special Event',
        price_range_min: pkg.price_range_min ?? null,
        price_range_max: pkg.price_range_max ?? null,
        is_active: pkg.is_active !== false,
        sort_order: pkg.sort_order ?? idx + 1,
        inclusions: Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0
          ? pkg.inclusions
          : [
              pkg.event_type ? `${pkg.event_type} Host & Crowd Engagement` : 'Master Stage Presence & Mic Control',
              'Pre-Event Briefing & Run-of-Show Protocol',
              'Audience Interaction & Crowd Dynamics',
              'Production & Sound Check Coordination',
            ],
      }));
    }
  }
  return CANONICAL_SERVICE_PACKAGES;
}

// ---- Multi-Artist & Performer Taxonomy ----
export * from './artists';

