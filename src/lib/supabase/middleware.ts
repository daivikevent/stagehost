import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase middleware — refreshes auth session on every request.
 * Also handles route protection for dashboard and admin routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/portfolio', '/schedule', '/inquiries', '/analytics', '/settings'];
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes — redirect if not admin
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes — redirect to dashboard if already logged in
  const authPaths = ['/login', '/register'];
  const isAuthRoute = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Custom Domain White-Labeling Rewrite:
  // If host is a custom domain (e.g. rahulsharma.com), rewrite root '/' to '/[artist-slug]'
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '');
  const isPlatformDomain =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.endsWith('.vercel.app') ||
    host === 'bookmyartist.in' ||
    host === 'www.bookmyartist.in' ||
    host === 'stagehost.in' ||
    host === 'www.stagehost.in';

  if (!isPlatformDomain && host) {
    try {
      const { data: row } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_custom_domains')
        .maybeSingle();

      if (row?.value) {
        const domains = JSON.parse(row.value);
        const match = domains.find((d: any) => d.domain?.toLowerCase() === host && d.status === 'active');
        if (match) {
          const { data: profile } = await supabase
            .from('anchor_profiles')
            .select('slug')
            .eq('id', match.profile_id)
            .maybeSingle();

          if (profile?.slug) {
            const url = request.nextUrl.clone();
            if (pathname === '/') {
              url.pathname = `/${profile.slug}`;
              return NextResponse.rewrite(url, { headers: supabaseResponse.headers });
            }
          }
        }
      }
    } catch (domainErr) {
      console.warn('Custom domain middleware check error:', domainErr);
    }
  }

  return supabaseResponse;
}
