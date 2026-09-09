import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'StageHost — Your Stage. Your Brand. Your Bookings.',
    template: '%s | StageHost',
  },
  description:
    'Build your professional anchor portfolio, manage your schedule, and get more bookings — all in one platform. The #1 platform for event anchors & emcees in India.',
  keywords: [
    'anchor portfolio',
    'emcee website',
    'event host',
    'anchor booking',
    'stage host',
    'event anchor',
    'wedding anchor',
    'corporate emcee',
    'portfolio builder',
    'schedule management',
  ],
  authors: [{ name: 'StageHost' }],
  creator: 'StageHost',
  publisher: 'StageHost',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stagehost.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'StageHost',
    title: 'StageHost — Your Stage. Your Brand. Your Bookings.',
    description:
      'Build your professional anchor portfolio, manage your schedule, and get more bookings — all in one platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StageHost — Your Stage. Your Brand. Your Bookings.',
    description:
      'Build your professional anchor portfolio, manage your schedule, and get more bookings.',
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
                const match = document.cookie.match(/(?:^|;\\s*)stagehost_site_theme=([^;]+)/);
                const local = localStorage.getItem('stagehost_site_theme');
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
