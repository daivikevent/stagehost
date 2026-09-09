-- ==============================================================================
-- STAGEHOST GIGS COMPLETED COLUMN MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- Add gigs_completed column to anchor_profiles table
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS gigs_completed INTEGER DEFAULT 0;

COMMENT ON COLUMN public.anchor_profiles.gigs_completed IS 'Total number of shows / gigs hosted by the artist (e.g. 650, 400, 1000)';
