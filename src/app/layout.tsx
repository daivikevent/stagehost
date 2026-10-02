import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BookMyArtist — Your Talent. Your Brand. Your Bookings.',
    template: '%s | BookMyArtist',
  },
  description:
    'Build your professional artist portfolio, manage your schedule, and get more bookings — all in one platform. The #1 platform for live artists and performers in India.',
  keywords: [
    'artist portfolio',
    'book my artist',
    'live performers',
    'artist booking',
    'event artist',
    'anchor emcee booking',
    'dj booking',
    'live singer booking',
    'band booking',
    'comedian booking',
    'dancer booking',
    'portfolio builder',
    'schedule management',
  ],
  authors: [{ name: 'BookMyArtist' }],
  creator: 'BookMyArtist',
  publisher: 'BookMyArtist',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bookmyartist.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'BookMyArtist',
    title: 'BookMyArtist — Your Talent. Your Brand. Your Bookings.',
    description:
      'Build your professional artist portfolio, manage your schedule, and get more bookings — all in one platform for live artists & performers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookMyArtist — Your Talent. Your Brand. Your Bookings.',
    description:
      'Build your professional artist portfolio, manage your schedule, and get more bookings.',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A14',
};

import { getGlobalSiteTheme } from '@/lib/actions/themes';
import { PwaRegistrar } from '@/components/common/PwaRegistrar';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeTheme = await getGlobalSiteTheme();

  return (
    <html lang="en" data-site-theme={activeTheme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const match = document.cookie.match(/(?:^|;\\s*)(?:bookmyartist_site_theme|stagehost_site_theme)=([^;]+)/);
                const local = localStorage.getItem('bookmyartist_site_theme') || localStorage.getItem('stagehost_site_theme');
                const theme = (match && match[1]) || local;
                if (theme) {
                  document.documentElement.setAttribute('data-site-theme', theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <PwaRegistrar />
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
