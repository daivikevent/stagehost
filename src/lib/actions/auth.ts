'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/utils';
import { redirect } from 'next/navigation';

/**
 * Ensures user's anchor profile has a 100% clean URL slug with NO random hex hashes or suffixes.
 * E.g., 'Admin User' -> '/admin-user'. Only adds '-2', '-3' if exact slug is taken by another user.
 */
export async function ensureCleanProfileSlug(userId: string, name?: string) {
  if (!userId) return null;
  const adminClient = createAdminClient();

  // Fetch current profile if already created by database trigger
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('id, name, slug, email')
    .eq('user_id', userId)
    .maybeSingle();

  const rawName = name || profile?.name || profile?.email?.split('@')[0] || 'Anchor';
  const cleanBase = generateSlug(rawName) || 'anchor';

  // Find the cleanest available slug (no random hashes)
  let targetSlug = cleanBase;
  let counter = 2;
  while (counter <= 50) {
    const { data: collision } = await adminClient
      .from('anchor_profiles')
      .select('id')
      .eq('slug', targetSlug)
      .neq('user_id', userId)
      .maybeSingle();

    if (!collision) break;
    targetSlug = `${cleanBase}-${counter}`;
    counter++;
  }

  if (profile) {
    const hasHashSuffix = /-[0-9a-f]{4,8}$/i.test(profile.slug);
    if (hasHashSuffix || profile.slug !== targetSlug) {
      await adminClient
        .from('anchor_profiles')
        .update({
          slug: targetSlug,
          name: rawName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
    }
    return targetSlug;
  } else {
    await adminClient
      .from('anchor_profiles')
      .insert({
        user_id: userId,
        name: rawName,
        slug: targetSlug,
        is_listed_in_directory: true,
        is_profile_complete: false,
        onboarding_step: 1,
      });
    return targetSlug;
  }
}

// ---- Sign Up ----
export async function signUp(email: string, password: string, name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);

  if (data.user) {
    try {
      await ensureCleanProfileSlug(data.user.id, name);
    } catch (e) {
      console.error('ensureCleanProfileSlug error in signUp:', e);
    }
  }

  return data;
}

// ---- Sign In ----
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  redirect('/dashboard');
}

// ---- Sign In with Google ----
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

// ---- Sign Out ----
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ---- Get current user ----
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ---- Reset password request ----
export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) throw new Error(error.message);
}
