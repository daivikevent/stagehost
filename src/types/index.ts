/* ============================================
   StageHost — TypeScript Type Definitions
   ============================================ */

// ---- User & Auth ----
export interface User {
  id: string;
  email: string;
  role: 'anchor' | 'artist' | 'admin';
  created_at: string;
  updated_at: string;
}

// ---- Anchor / Artist Profile ----
export interface AnchorProfile {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio: string;
  tagline: string;
  artist_type?: string; // 'emcee' | 'dj' | 'singer' | 'musician' | 'standup' | etc.
  artist_category?: string;
  artist_specialties?: string[];
  client_brands?: string[];
  tour_cities?: Array<{ city: string; tag: string }>;
  city: string;
  state: string;
  languages: string[];
  event_types: string[];
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  phone: string;
  whatsapp_number: string;
  email: string;
  instagram_url: string;
  youtube_url: string;
  facebook_url: string;
  website_url: string;
  starting_price: number | null;
  experience_years: number | null;
  gigs_completed?: number | null;
  is_listed_in_directory: boolean;
  is_profile_complete: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  profile_layout?: 'classic' | 'editorial' | 'spotlight' | 'vip' | 'palace' | 'cinema' | 'neostage';
  onboarding_step: number;
  theme_id: string | null;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;

  // Relations (optional, populated when joined)
  videos?: Video[];
  photos?: Photo[];
  service_packages?: ServicePackage[];
  testimonials?: Testimonial[];
  subscription?: Subscription;
  theme?: Theme;
}

// ---- Portfolio Content ----
export type VideoPlatform = 'youtube' | 'instagram' | 'facebook' | 'google_drive' | 'other';

export interface Video {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'google_drive' | 'other';
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Photo {
  id: string;
  profile_id: string;
  url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  event_type: string;
  price_range_min: number | null;
  price_range_max: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  profile_id: string;
  client_name: string;
  client_designation: string;
  text: string;
  rating: number;
  event_type: string;
  event_date: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

// ---- Scheduling ----
export type SlotType = 'morning' | 'evening' | 'full_day';
export type SlotStatus = 'available' | 'booked' | 'blocked' | 'travel' | 'tentative';

export interface ScheduleSlot {
  id: string;
  profile_id: string;
  date: string; // YYYY-MM-DD
  slot_type: SlotType;
  status: SlotStatus;
  booking_status?: 'confirmed' | 'tentative';
  // Booking fields (denormalized for simplicity)
  event_type?: string;
  event_name?: string;
  event_city?: string;
  client_name?: string;
  client_phone?: string;
  amount?: number;
  notes?: string;
  cue_notes?: string; // Backstage VIP Run-Sheet & Cue Notes
  is_out_of_city?: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  booking?: Booking;
}

export interface Booking {
  id: string;
  slot_id: string;
  profile_id: string;
  date: string;
  slot_type: SlotType;
  booking_status?: 'confirmed' | 'tentative';
  event_type: string;
  event_name: string;
  city: string;
  venue: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  amount: number | null;
  notes: string;
  cue_notes?: string; // Backstage VIP Run-Sheet & Cue Notes
  is_out_of_city: boolean;
  travel_buffer_days: number;
  created_at: string;
  updated_at: string;
}

// ---- Inquiries / Leads ----
export type InquiryStatus = 'new' | 'contacted' | 'converted' | 'lost';
export type InquirySource = 'portfolio' | 'directory' | 'direct' | 'referral';

export interface Inquiry {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  event_date: string | null;
  event_type: string;
  event_city: string;
  budget_range: string;
  status: InquiryStatus;
  source: InquirySource;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ---- Plans & Billing ----
export type PlanTier = 0 | 1 | 2 | 3; // free, starter, pro, premium

export interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  price_monthly: number;
  price_yearly: number;
  description: string;
  features: string[];
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  max_videos: number;
  max_photos: number;
  max_service_packages: number;
  custom_domain: boolean;
  remove_branding_footer: boolean;
  remove_branding_badge: boolean;
  remove_branding_email: boolean;
  remove_branding_full: boolean;
  google_drive_integration: boolean;
  travel_buffer_scheduling: boolean;
  analytics_dashboard: boolean;
  lead_management: boolean;
  priority_directory_listing: boolean;
  featured_directory_listing: boolean;
  custom_theme_colors: boolean;
  seo_tools: boolean;
  invoice_generation: boolean;
  google_calendar_sync: boolean;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_name?: string;
  razorpay_subscription_id?: string | null;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  plan?: Plan;
}

export interface Payment {
  id: string;
  subscription_id: string;
  user_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  invoice_url: string | null;
  created_at: string;
}

// ---- Themes ----
export interface ThemeVariables {
  '--color-primary': string;
  '--color-primary-hover': string;
  '--color-accent': string;
  '--color-bg-primary': string;
  '--color-bg-secondary': string;
  '--color-bg-card': string;
  '--color-text-primary': string;
  '--color-text-secondary': string;
  '--color-border': string;
  '--font-heading': string;
  '--font-body': string;
  '--glass-bg': string;
  '--glass-border': string;
  '--shadow-card': string;
  '--border-radius': string;
  '--gradient-hero': string;
  '--gradient-accent': string;
  [key: string]: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview_url: string | null;
  category: 'dark' | 'light' | 'vibrant' | 'minimal';
  is_active: boolean;
  is_default: boolean;
  min_plan_tier: PlanTier;
  variables: ThemeVariables;
  created_at: string;
  updated_at: string;
}

// ---- Platform Settings ----
export interface PlatformSettings {
  id: string;
  key: string;
  value: string;
  category: 'general' | 'branding' | 'payment' | 'email' | 'social' | 'legal' | 'seo' | 'analytics';
  label: string;
  description: string;
  field_type: 'text' | 'textarea' | 'image' | 'toggle' | 'select' | 'color';
  updated_at: string;
}

// ---- Analytics ----
export type AnalyticsEventType = 'profile_view' | 'video_click' | 'photo_view' | 'inquiry_submit' | 'whatsapp_click' | 'phone_click' | 'social_click' | 'qr_scan';

export interface AnalyticsEvent {
  id: string;
  profile_id: string;
  event_type: AnalyticsEventType;
  metadata: Record<string, string>;
  referrer: string | null;
  user_agent: string | null;
  ip_city: string | null;
  created_at: string;
}

// ---- Branding ----
export type BrandingPlacement = 'footer' | 'badge' | 'email' | 'qr' | 'og_tags' | 'favicon' | 'loading';

// ---- UI State Types ----
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// ---- API Response Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ---- Form Types ----
export interface OnboardingFormData {
  name: string;
  bio: string;
  tagline: string;
  city: string;
  state: string;
  languages: string[];
  event_types: string[];
  phone: string;
  whatsapp_number: string;
  instagram_url: string;
  youtube_url: string;
  facebook_url: string;
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  event_date: string;
  event_type: string;
  event_city: string;
  budget_range: string;
  honeypot?: string;
}

// ---- Admin Suite Types ----
export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

export interface AnnouncementBanner {
  id?: string;
  is_active: boolean;
  message: string;
  link_url?: string;
  link_text?: string;
  type: 'info' | 'warning' | 'success';
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  type: 'signup' | 'upgrade' | 'inquiry' | 'verification' | 'featured';
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CustomDomainRequest {
  id: string;
  profile_id: string;
  anchor_name: string;
  domain: string;
  status: 'active' | 'pending' | 'rejected';
  dns_type: 'CNAME' | 'A';
  dns_target: string;
  created_at: string;
}

// ---- Platform Support & Contact Submissions ----
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  admin_notes?: string;
}


