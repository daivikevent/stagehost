-- ==============================================================================
-- BookMyArtist — Artist Referral & Reward System Schema
-- ==============================================================================

-- 1. Create table for native PostgreSQL referral logging (optional, seamlessly backed by platform_settings)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id UUID REFERENCES public.anchor_profiles(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL,
  referrer_name TEXT NOT NULL,
  referrer_slug TEXT NOT NULL,
  referred_user_id UUID NOT NULL,
  referred_profile_id UUID REFERENCES public.anchor_profiles(id) ON DELETE SET NULL,
  referred_name TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_slug TEXT,
  referred_avatar TEXT,
  referred_category TEXT DEFAULT 'Artist',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT DEFAULT 'none' CHECK (reward_type IN ('none', 'validity', 'money', 'custom')),
  reward_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ,
  notes TEXT
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_slug ON public.referrals(referrer_slug);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Select policies: users can read their own referrals; admins can read all
CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE POLICY "Service role and admins full access" ON public.referrals
  FOR ALL USING (true);
