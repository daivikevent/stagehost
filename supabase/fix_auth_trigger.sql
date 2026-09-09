-- =======================================================
-- StageHost — 100% Clean Slug Trigger
-- Run this in Supabase SQL Editor:
-- Generates clean slugs (e.g., rahul-sharma, aish85)
-- NO random hash suffixes!
-- =======================================================

-- 1. Drop existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- 2. Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();

-- 3. Create 100% Clean User Creation Handler
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
  -- Extract user full name or email username
  raw_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1),
    'anchor'
  );
  
  -- Create clean URL slug: lowercase, replace spaces/special chars with hyphens
  base_slug := LOWER(REGEXP_REPLACE(raw_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);

  IF base_slug = '' THEN
    base_slug := 'anchor';
  END IF;

  -- 100% Clean Slug Check:
  -- If base_slug is free -> use clean slug directly (e.g., 'aish85', 'super-admin', 'rahul-sharma')
  -- Only if exact slug is already taken -> append -2, -3, etc. (like GitHub/Twitter)
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.anchor_profiles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  -- Create Profile in anchor_profiles
  BEGIN
    INSERT INTO public.anchor_profiles (
      user_id,
      name,
      email,
      slug,
      is_listed_in_directory,
      is_profile_complete,
      onboarding_step
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(raw_name, ''), 'Anchor'),
      NEW.email,
      final_slug,
      true,
      false,
      1
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'anchor_profiles warning: %', SQLERRM;
  END;

  -- Create Free Subscription in subscriptions table
  BEGIN
    INSERT INTO public.subscriptions (
      user_id,
      plan_name,
      status,
      max_videos,
      max_photos,
      max_services,
      has_analytics,
      has_custom_domain,
      max_themes,
      show_branding
    ) VALUES (
      NEW.id,
      'Free',
      'active',
      3, 6, 3,
      false, false, 1, true
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'subscriptions warning: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
