import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGoogleAuthUrl } from '@/lib/services/google-oauth';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login?returnUrl=/vault', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    const { data: profile } = await supabase
      .from('anchor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    const authUrl = generateGoogleAuthUrl(profile.id);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Failed to generate Google auth URL:', error);
    return NextResponse.redirect(
      new URL(`/vault?error=${encodeURIComponent(error.message || 'Failed to start Google Drive connection')}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
