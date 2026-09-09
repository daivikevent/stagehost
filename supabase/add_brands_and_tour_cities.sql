-- ==============================================================================
-- STAGEHOST CLIENT BRANDS, TOUR CITIES & VIP LAYOUT MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Add client_brands array for luxury brand marquee ticker
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS client_brands TEXT[] DEFAULT '{}';

-- 2. Add tour_cities JSONB array for touring hubs & circuits
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS tour_cities JSONB DEFAULT '[]';

-- 3. Ensure profile_layout exists and supports 'classic', 'editorial', 'spotlight', 'vip'
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS profile_layout TEXT DEFAULT 'classic';

COMMENT ON COLUMN public.anchor_profiles.client_brands IS 'List of luxury brand clients (e.g. Taj Hotels, BMW, Forbes Gala)';
COMMENT ON COLUMN public.anchor_profiles.tour_cities IS 'Array of touring cities and circuit tags (e.g. [{"city": "Mumbai", "tag": "Celebrity Galas"}])';
COMMENT ON COLUMN public.anchor_profiles.profile_layout IS 'Public profile layout: classic | editorial | spotlight | vip';
