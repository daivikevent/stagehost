-- ==============================================================================
-- STAGEHOST MULTI-ARTIST EXPANSION MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Add artist_type column to anchor_profiles table
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS artist_type TEXT DEFAULT 'emcee';

-- 2. Add artist_specialties column for genre, instrument, style tags
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS artist_specialties TEXT[] DEFAULT '{}';

-- 3. Set existing profiles with null or empty artist_type to 'emcee'
UPDATE public.anchor_profiles
SET artist_type = 'emcee'
WHERE artist_type IS NULL OR artist_type = '';

-- 4. Create an index for high-performance category filtering in directory
CREATE INDEX IF NOT EXISTS idx_anchor_profiles_artist_type 
ON public.anchor_profiles (artist_type);

-- 5. Add helpful comment to table columns
COMMENT ON COLUMN public.anchor_profiles.artist_type IS 'Category of artist: emcee, dj, singer, musician, standup, dancer, magician, speaker, voiceover, photographer, celebrity';
COMMENT ON COLUMN public.anchor_profiles.artist_specialties IS 'Custom sub-genres and skills (e.g., Bollywood, EDM, Sufi, Classical, Corporate)';
