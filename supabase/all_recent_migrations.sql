-- ==============================================================================
-- STAGEHOST CONSOLIDATED RECENT MIGRATIONS
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- This ensures all newly added fields and constraints exist natively in PostgreSQL.
-- ==============================================================================

-- 1. Add gigs_completed column to anchor_profiles
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS gigs_completed INTEGER DEFAULT 0;

-- 2. Add artist_type and artist_specialties columns to anchor_profiles
ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS artist_type TEXT DEFAULT 'emcee';

ALTER TABLE IF EXISTS public.anchor_profiles 
ADD COLUMN IF NOT EXISTS artist_specialties TEXT[] DEFAULT '{}';

-- 3. Create index for fast category and directory searches
CREATE INDEX IF NOT EXISTS idx_anchor_profiles_artist_type 
ON public.anchor_profiles (artist_type);

-- 4. Update videos platform check constraint to include google_drive
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'videos' AND constraint_name = 'videos_platform_check'
  ) THEN
    ALTER TABLE public.videos DROP CONSTRAINT videos_platform_check;
  END IF;
  
  -- Add updated check constraint with google_drive
  ALTER TABLE public.videos 
  ADD CONSTRAINT videos_platform_check 
  CHECK (platform IN ('youtube', 'instagram', 'facebook', 'google_drive', 'other'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if table does not exist yet
END $$;

-- 5. Backfill: If any profile has gigs:<number> in artist_specialties, extract to gigs_completed
UPDATE public.anchor_profiles
SET gigs_completed = (
  SELECT substring(elem from 'gigs:([0-9]+)')::integer
  FROM unnest(anchor_profiles.artist_specialties) AS elem
  WHERE elem ~ '^gigs:[0-9]+$'
  LIMIT 1
)
WHERE artist_specialties IS NOT NULL
  AND array_to_string(artist_specialties, ',') LIKE '%gigs:%'
  AND (gigs_completed IS NULL OR gigs_completed = 0);

-- Done!
SELECT 'StageHost migrations applied successfully!' AS status;
