-- ============================================
-- StageHost — Database Schema
-- Version: 1.0
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ANCHOR PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS anchor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE,
  bio TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  languages TEXT[] DEFAULT '{}',
  event_types TEXT[] DEFAULT '{}',
  profile_photo_url TEXT,
  cover_photo_url TEXT,
  phone TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  starting_price INTEGER,
  experience_years INTEGER,
  is_listed_in_directory BOOLEAN DEFAULT true,
  is_profile_complete BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  theme_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_anchor_profiles_user_id ON anchor_profiles(user_id);
CREATE INDEX idx_anchor_profiles_slug ON anchor_profiles(slug);
CREATE INDEX idx_anchor_profiles_city ON anchor_profiles(city);
CREATE INDEX idx_anchor_profiles_directory ON anchor_profiles(is_listed_in_directory) WHERE is_listed_in_directory = true;


-- ============================================
-- 2. VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'youtube' CHECK (platform IN ('youtube', 'instagram', 'facebook', 'google_drive', 'other')),
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_videos_profile_id ON videos(profile_id);


-- ============================================
-- 3. PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_profile_id ON photos(profile_id);


-- ============================================
-- 4. SERVICE PACKAGES
-- ============================================
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  price_range_min INTEGER,
  price_range_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_packages_profile_id ON service_packages(profile_id);


-- ============================================
-- 5. TESTIMONIALS
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_designation TEXT DEFAULT '',
  text TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  event_type TEXT DEFAULT '',
  event_date DATE,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_testimonials_profile_id ON testimonials(profile_id);


-- ============================================
-- 6. SCHEDULE SLOTS
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  slot_type TEXT NOT NULL DEFAULT 'full_day' CHECK (slot_type IN ('morning', 'evening', 'full_day')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'travel')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, date, slot_type)
);

CREATE INDEX idx_schedule_slots_profile_date ON schedule_slots(profile_id, date);


-- ============================================
-- 7. BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES schedule_slots(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  slot_type TEXT NOT NULL DEFAULT 'full_day',
  event_type TEXT DEFAULT '',
  event_name TEXT DEFAULT '',
  city TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  amount INTEGER,
  notes TEXT DEFAULT '',
  is_out_of_city BOOLEAN DEFAULT false,
  travel_buffer_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_profile_id ON bookings(profile_id);
CREATE INDEX idx_bookings_date ON bookings(profile_id, date);


-- ============================================
-- 8. INQUIRIES
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  event_date DATE,
  event_type TEXT DEFAULT '',
  event_city TEXT DEFAULT '',
  budget_range TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  source TEXT DEFAULT 'portfolio' CHECK (source IN ('portfolio', 'directory', 'direct', 'referral')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inquiries_profile_id ON inquiries(profile_id);
CREATE INDEX idx_inquiries_status ON inquiries(profile_id, status);


-- ============================================
-- 9. PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL DEFAULT 0,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 10. SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  razorpay_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);


-- ============================================
-- 11. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'captured' CHECK (status IN ('captured', 'failed', 'refunded')),
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);


-- ============================================
-- 12. THEMES
-- ============================================
CREATE TABLE IF NOT EXISTS themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  preview_url TEXT,
  category TEXT DEFAULT 'dark' CHECK (category IN ('dark', 'light', 'vibrant', 'minimal')),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  min_plan_tier INTEGER DEFAULT 0,
  variables JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK to anchor_profiles now that themes exists
ALTER TABLE anchor_profiles ADD CONSTRAINT fk_anchor_theme FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL;


-- ============================================
-- 13. PLATFORM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT '',
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'branding', 'payment', 'email', 'social', 'legal', 'seo', 'analytics')),
  label TEXT DEFAULT '',
  description TEXT DEFAULT '',
  field_type TEXT DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'image', 'toggle', 'select', 'color')),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 14. ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES anchor_profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'video_click', 'photo_view', 'inquiry_submit', 'whatsapp_click', 'phone_click', 'social_click', 'qr_scan')),
  metadata JSONB DEFAULT '{}',
  referrer TEXT,
  user_agent TEXT,
  ip_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_profile_id ON analytics_events(profile_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);


-- ============================================
-- 15. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_anchor_profiles_updated_at BEFORE UPDATE ON anchor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_schedule_slots_updated_at BEFORE UPDATE ON schedule_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_themes_updated_at BEFORE UPDATE ON themes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 16. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE anchor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ANCHOR PROFILES: Owner can CRUD, anyone can read (for public portfolio)
CREATE POLICY "Profiles are publicly readable" ON anchor_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON anchor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON anchor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON anchor_profiles FOR DELETE USING (auth.uid() = user_id);

-- VIDEOS, PHOTOS, SERVICE_PACKAGES, TESTIMONIALS: Owner CRUD, public read
CREATE POLICY "Videos are publicly readable" ON videos FOR SELECT USING (true);
CREATE POLICY "Users can manage own videos" ON videos FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Photos are publicly readable" ON photos FOR SELECT USING (true);
CREATE POLICY "Users can manage own photos" ON photos FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own photos" ON photos FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service packages are publicly readable" ON service_packages FOR SELECT USING (true);
CREATE POLICY "Users can manage own packages" ON service_packages FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own packages" ON service_packages FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own packages" ON service_packages FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Testimonials are publicly readable" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Users can manage own testimonials" ON testimonials FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own testimonials" ON testimonials FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own testimonials" ON testimonials FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

-- SCHEDULE: Owner CRUD, public can read available slots
CREATE POLICY "Schedule slots are publicly readable" ON schedule_slots FOR SELECT USING (true);
CREATE POLICY "Users can manage own schedule" ON schedule_slots FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own schedule" ON schedule_slots FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own schedule" ON schedule_slots FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

-- BOOKINGS: Owner only
CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own bookings" ON bookings FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

-- INQUIRIES: Owner can read/update, anyone can insert (public form)
CREATE POLICY "Users can read own inquiries" ON inquiries FOR SELECT USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can submit inquiry" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own inquiries" ON inquiries FOR UPDATE USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));

-- PLANS: Public read
CREATE POLICY "Plans are publicly readable" ON plans FOR SELECT USING (true);

-- SUBSCRIPTIONS: Owner only
CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- PAYMENTS: Owner only
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- THEMES: Public read
CREATE POLICY "Themes are publicly readable" ON themes FOR SELECT USING (true);

-- PLATFORM SETTINGS: Public read
CREATE POLICY "Settings are publicly readable" ON platform_settings FOR SELECT USING (true);

-- ANALYTICS: Insert by anyone (tracking), read by profile owner
CREATE POLICY "Anyone can log analytics" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own analytics" ON analytics_events FOR SELECT USING (profile_id IN (SELECT id FROM anchor_profiles WHERE user_id = auth.uid()));


-- ============================================
-- 17. SEED DATA
-- ============================================

-- Seed Plans
INSERT INTO plans (name, slug, tier, price_monthly, price_yearly, description, features, limits, is_active, is_popular, sort_order) VALUES
('Free', 'free', 0, 0, 0, 'Perfect to get started',
 ARRAY['5 video showcases', '10 photo gallery', '3 service packages', 'Basic calendar', 'Inquiry form', 'WhatsApp button', 'Directory listing', 'StageHost subdomain'],
 '{"max_videos": 5, "max_photos": 10, "max_service_packages": 3, "custom_domain": false, "remove_branding_footer": false, "remove_branding_badge": false, "remove_branding_email": false, "remove_branding_full": false, "google_drive_integration": false, "travel_buffer_scheduling": false, "analytics_dashboard": false, "lead_management": false, "priority_directory_listing": false, "featured_directory_listing": false, "custom_theme_colors": false, "seo_tools": false, "invoice_generation": false, "google_calendar_sync": false}'::jsonb,
 true, false, 1),

('Starter', 'starter', 1, 199, 1999, 'For growing anchors',
 ARRAY['15 video showcases', '30 photo gallery', '5 service packages', 'Lead tracking', 'Remove footer branding', 'Basic analytics', '3 theme choices', 'Priority support'],
 '{"max_videos": 15, "max_photos": 30, "max_service_packages": 5, "custom_domain": false, "remove_branding_footer": true, "remove_branding_badge": false, "remove_branding_email": false, "remove_branding_full": false, "google_drive_integration": false, "travel_buffer_scheduling": false, "analytics_dashboard": true, "lead_management": true, "priority_directory_listing": false, "featured_directory_listing": false, "custom_theme_colors": false, "seo_tools": false, "invoice_generation": false, "google_calendar_sync": false}'::jsonb,
 true, false, 2),

('Pro', 'pro', 2, 599, 5999, 'For serious professionals',
 ARRAY['Unlimited videos & photos', 'Unlimited packages', 'Google Drive integration', 'Travel buffer scheduling', 'Advanced analytics', 'All themes unlocked', 'SEO tools', 'Priority directory listing'],
 '{"max_videos": -1, "max_photos": -1, "max_service_packages": -1, "custom_domain": false, "remove_branding_footer": true, "remove_branding_badge": true, "remove_branding_email": true, "remove_branding_full": false, "google_drive_integration": true, "travel_buffer_scheduling": true, "analytics_dashboard": true, "lead_management": true, "priority_directory_listing": true, "featured_directory_listing": false, "custom_theme_colors": false, "seo_tools": true, "invoice_generation": false, "google_calendar_sync": false}'::jsonb,
 true, true, 3),

('Premium', 'premium', 3, 1299, 12999, 'For top-tier anchors',
 ARRAY['Everything in Pro', 'Custom domain', 'White-label (no branding)', 'Featured in directory', 'Invoice generation', 'Google Calendar sync', 'Custom brand colors', 'Dedicated support'],
 '{"max_videos": -1, "max_photos": -1, "max_service_packages": -1, "custom_domain": true, "remove_branding_footer": true, "remove_branding_badge": true, "remove_branding_email": true, "remove_branding_full": true, "google_drive_integration": true, "travel_buffer_scheduling": true, "analytics_dashboard": true, "lead_management": true, "priority_directory_listing": true, "featured_directory_listing": true, "custom_theme_colors": true, "seo_tools": true, "invoice_generation": true, "google_calendar_sync": true}'::jsonb,
 true, false, 4);

-- Seed Default Theme (Obsidian Night)
INSERT INTO themes (name, description, category, is_active, is_default, min_plan_tier, variables, sort_order) VALUES
('Obsidian Night', 'Dark, deep navy with gold accents and glassmorphism effects', 'dark', true, true, 0,
 '{
   "--color-primary": "#6C5CE7",
   "--color-primary-hover": "#7E6FF0",
   "--color-accent": "#F0A500",
   "--color-bg-primary": "#0A0A14",
   "--color-bg-secondary": "#12121F",
   "--color-bg-card": "#16162A",
   "--color-text-primary": "#F0F0F5",
   "--color-text-secondary": "#A0A0B8",
   "--color-border": "rgba(255, 255, 255, 0.08)",
   "--font-heading": "Outfit, sans-serif",
   "--font-body": "Inter, sans-serif",
   "--glass-bg": "rgba(255, 255, 255, 0.04)",
   "--glass-border": "rgba(255, 255, 255, 0.08)",
   "--shadow-card": "0 4px 6px rgba(0, 0, 0, 0.3)",
   "--border-radius": "12px",
   "--gradient-hero": "linear-gradient(135deg, #0A0A14 0%, #1A1A2E 50%, #12121F 100%)",
   "--gradient-accent": "linear-gradient(135deg, #6C5CE7 0%, #F0A500 100%)"
 }'::jsonb, 1),

('Pearl White', 'Clean white with subtle shadows and professional feel', 'light', true, false, 1,
 '{
   "--color-primary": "#4F46E5",
   "--color-primary-hover": "#6366F1",
   "--color-accent": "#F59E0B",
   "--color-bg-primary": "#FFFFFF",
   "--color-bg-secondary": "#F9FAFB",
   "--color-bg-card": "#FFFFFF",
   "--color-text-primary": "#111827",
   "--color-text-secondary": "#6B7280",
   "--color-border": "rgba(0, 0, 0, 0.08)",
   "--font-heading": "Outfit, sans-serif",
   "--font-body": "Inter, sans-serif",
   "--glass-bg": "rgba(0, 0, 0, 0.02)",
   "--glass-border": "rgba(0, 0, 0, 0.06)",
   "--shadow-card": "0 1px 3px rgba(0, 0, 0, 0.1)",
   "--border-radius": "12px",
   "--gradient-hero": "linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)",
   "--gradient-accent": "linear-gradient(135deg, #4F46E5 0%, #F59E0B 100%)"
 }'::jsonb, 2),

('Crimson Stage', 'Dark theme with red and coral accents for a dramatic look', 'dark', true, false, 1,
 '{
   "--color-primary": "#EF4444",
   "--color-primary-hover": "#F87171",
   "--color-accent": "#FB923C",
   "--color-bg-primary": "#0C0A09",
   "--color-bg-secondary": "#1C1917",
   "--color-bg-card": "#1C1917",
   "--color-text-primary": "#FAFAF9",
   "--color-text-secondary": "#A8A29E",
   "--color-border": "rgba(255, 255, 255, 0.08)",
   "--font-heading": "Outfit, sans-serif",
   "--font-body": "Inter, sans-serif",
   "--glass-bg": "rgba(255, 255, 255, 0.04)",
   "--glass-border": "rgba(255, 255, 255, 0.08)",
   "--shadow-card": "0 4px 6px rgba(0, 0, 0, 0.4)",
   "--border-radius": "12px",
   "--gradient-hero": "linear-gradient(135deg, #0C0A09 0%, #1C1917 100%)",
   "--gradient-accent": "linear-gradient(135deg, #EF4444 0%, #FB923C 100%)"
 }'::jsonb, 3),

('Royal Indigo', 'Deep purple tones with a luxurious premium feel', 'vibrant', true, false, 2,
 '{
   "--color-primary": "#8B5CF6",
   "--color-primary-hover": "#A78BFA",
   "--color-accent": "#EC4899",
   "--color-bg-primary": "#0F0B1E",
   "--color-bg-secondary": "#1A1333",
   "--color-bg-card": "#1A1333",
   "--color-text-primary": "#F5F3FF",
   "--color-text-secondary": "#A5B4FC",
   "--color-border": "rgba(139, 92, 246, 0.15)",
   "--font-heading": "Outfit, sans-serif",
   "--font-body": "Inter, sans-serif",
   "--glass-bg": "rgba(139, 92, 246, 0.05)",
   "--glass-border": "rgba(139, 92, 246, 0.12)",
   "--shadow-card": "0 4px 6px rgba(0, 0, 0, 0.4)",
   "--border-radius": "16px",
   "--gradient-hero": "linear-gradient(135deg, #0F0B1E 0%, #1A1333 50%, #0F0B1E 100%)",
   "--gradient-accent": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
 }'::jsonb, 4),

('Emerald Glow', 'Dark green tones with a nature-inspired elegant aesthetic', 'dark', true, false, 2,
 '{
   "--color-primary": "#10B981",
   "--color-primary-hover": "#34D399",
   "--color-accent": "#F59E0B",
   "--color-bg-primary": "#052E16",
   "--color-bg-secondary": "#064E3B",
   "--color-bg-card": "#064E3B",
   "--color-text-primary": "#ECFDF5",
   "--color-text-secondary": "#A7F3D0",
   "--color-border": "rgba(16, 185, 129, 0.15)",
   "--font-heading": "Outfit, sans-serif",
   "--font-body": "Inter, sans-serif",
   "--glass-bg": "rgba(16, 185, 129, 0.05)",
   "--glass-border": "rgba(16, 185, 129, 0.12)",
   "--shadow-card": "0 4px 6px rgba(0, 0, 0, 0.4)",
   "--border-radius": "12px",
   "--gradient-hero": "linear-gradient(135deg, #052E16 0%, #064E3B 100%)",
   "--gradient-accent": "linear-gradient(135deg, #10B981 0%, #F59E0B 100%)"
 }'::jsonb, 5);

-- Seed Platform Settings
INSERT INTO platform_settings (key, value, category, label, description, field_type) VALUES
-- General
('site_name', 'StageHost', 'general', 'Site Name', 'The name of your platform', 'text'),
('site_tagline', 'Your Stage. Your Brand. Your Bookings.', 'general', 'Tagline', 'Platform tagline displayed on the landing page', 'text'),
('support_email', 'support@stagehost.in', 'general', 'Support Email', 'Email for customer support', 'text'),
('maintenance_mode', 'false', 'general', 'Maintenance Mode', 'Enable to show maintenance page to all users', 'toggle'),
('registration_open', 'true', 'general', 'Registration Open', 'Allow new user registrations', 'toggle'),

-- Branding
('logo_url', '', 'branding', 'Logo URL', 'Platform logo image URL', 'image'),
('favicon_url', '', 'branding', 'Favicon URL', 'Favicon image URL', 'image'),
('primary_color', '#6C5CE7', 'branding', 'Primary Color', 'Main brand color', 'color'),
('accent_color', '#F0A500', 'branding', 'Accent Color', 'Secondary brand color', 'color'),

-- Payment
('razorpay_key_id', '', 'payment', 'Razorpay Key ID', 'Your Razorpay API Key ID', 'text'),
('razorpay_key_secret', '', 'payment', 'Razorpay Key Secret', 'Your Razorpay API Key Secret (stored securely)', 'text'),
('razorpay_webhook_secret', '', 'payment', 'Razorpay Webhook Secret', 'Webhook verification secret', 'text'),

-- Email
('resend_api_key', '', 'email', 'Resend API Key', 'Your Resend email service API key', 'text'),
('email_from', 'StageHost <hello@stagehost.in>', 'email', 'From Email', 'Email sender name and address', 'text'),

-- Social
('social_instagram', '', 'social', 'Instagram URL', 'Platform Instagram page URL', 'text'),
('social_youtube', '', 'social', 'YouTube URL', 'Platform YouTube channel URL', 'text'),
('social_facebook', '', 'social', 'Facebook URL', 'Platform Facebook page URL', 'text'),
('social_twitter', '', 'social', 'Twitter/X URL', 'Platform Twitter/X page URL', 'text'),

-- Legal
('terms_of_service', '', 'legal', 'Terms of Service', 'Terms of Service content (HTML supported)', 'textarea'),
('privacy_policy', '', 'legal', 'Privacy Policy', 'Privacy Policy content (HTML supported)', 'textarea'),
('refund_policy', '', 'legal', 'Refund Policy', 'Refund Policy content (HTML supported)', 'textarea'),

-- SEO
('meta_title', 'StageHost — Your Stage. Your Brand. Your Bookings.', 'seo', 'Meta Title', 'Default page title for SEO', 'text'),
('meta_description', 'Build your professional anchor portfolio, manage your schedule, and get more bookings.', 'seo', 'Meta Description', 'Default meta description for SEO', 'textarea'),
('og_image_url', '', 'seo', 'OG Image', 'Default Open Graph image for social sharing', 'image'),

-- Analytics
('google_analytics_id', '', 'analytics', 'Google Analytics ID', 'Google Analytics measurement ID (G-XXXXXXX)', 'text'),
('google_tag_manager_id', '', 'analytics', 'GTM Container ID', 'Google Tag Manager container ID (GTM-XXXXXXX)', 'text');


-- ============================================
-- 18. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 2;
BEGIN
  raw_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  
  IF raw_name <> '' THEN
    base_slug := LOWER(REGEXP_REPLACE(raw_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
  ELSE
    base_slug := 'anchor';
  END IF;

  IF base_slug = '' THEN
    base_slug := 'anchor';
  END IF;

  -- 100% Clean Slug Check:
  -- If base_slug is free -> use clean slug directly (e.g., 'admin-user', 'rahul-sharma')
  -- Only if exact slug is already taken -> append -2, -3, etc.
  final_slug := base_slug;
  counter := 2;
  WHILE EXISTS (SELECT 1 FROM public.anchor_profiles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  BEGIN
    INSERT INTO public.anchor_profiles (user_id, name, email, slug, is_listed_in_directory, is_profile_complete, onboarding_step)
    VALUES (NEW.id, COALESCE(NULLIF(raw_name, ''), 'Anchor'), NEW.email, final_slug, true, false, 1)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'anchor_profiles creation warning: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 15. COUPONS & DISCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);


-- ============================================
-- 16. PLATFORM SETTINGS & BROADCAST
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

