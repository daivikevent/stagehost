import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicProfile } from '@/components/public-profile/PublicProfile';
import { getPublicProfile } from '@/lib/actions/profile';
import { getPublicAnchorSchedule } from '@/lib/actions/schedule';
import { DEMO_PROFILES } from '@/lib/demo-data';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = (await getPublicProfile(slug)) || DEMO_PROFILES[slug];

  if (!profile) return { title: 'Profile Not Found' };

  const ogImages = profile.profile_photo_url
    ? [
        {
          url: profile.profile_photo_url,
          width: 800,
          height: 800,
          alt: `${profile.name} — Verified Anchor Portfolio`,
        },
      ]
    : [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'StageHost — Verified Event Anchors & Emcees',
        },
      ];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stagehost.in'),
    title: `${profile.name} — ${profile.tagline || 'Event Anchor'} | StageHost`,
    description: profile.bio?.slice(0, 160) || `${profile.name} is a professional event anchor on StageHost.`,
    openGraph: {
      title: `${profile.name} — ${profile.tagline || 'Event Anchor'}`,
      description: profile.bio?.slice(0, 160),
      type: 'profile',
      url: `/${slug}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} — ${profile.tagline || 'Event Anchor'}`,
      description: profile.bio?.slice(0, 160),
      images: ogImages,
    },
  };

}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const layoutParam = typeof sParams?.layout === 'string' ? sParams.layout : undefined;
  const validLayouts = ['editorial', 'spotlight', 'classic', 'vip', 'palace', 'cinema', 'neostage'] as const;
  const layoutOverride = (layoutParam && (validLayouts as readonly string[]).includes(layoutParam))
    ? (layoutParam === 'neostage' ? 'spotlight' : layoutParam as any)
    : undefined;

  const profile = (await getPublicProfile(slug)) || DEMO_PROFILES[slug];

  if (!profile) notFound();

  // If user requested an old hash-based URL (e.g. /admin-user-180b87), redirect to clean URL
  if (profile.slug && profile.slug !== slug) {
    redirect(`/${profile.slug}`);
  }

  // Fetch schedule and live availability for this anchor
  const scheduleData = await getPublicAnchorSchedule(profile.id);

  // Determine plan tier from subscription (simplified — 0 = free)
  const planTier = 0;

  return (
    <PublicProfile
      profile={profile}
      planTier={planTier}
      scheduleData={scheduleData}
      layoutOverride={layoutOverride}
    />
  );
}

