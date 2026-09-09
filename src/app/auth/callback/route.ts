import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler.
 * Supabase redirects here after Google OAuth with a `code` param.
 * We exchange it for a session, then redirect to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (sessionData?.user) {
        try {
          const { ensureCleanProfileSlug } = await import('@/lib/actions/auth');
          const name = sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || sessionData.user.email?.split('@')[0] || 'Anchor';
          await ensureCleanProfileSlug(sessionData.user.id, name);
        } catch (slugErr) {
          console.error('OAuth clean slug error:', slugErr);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
