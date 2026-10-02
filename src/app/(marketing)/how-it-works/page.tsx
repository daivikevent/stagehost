import type { Metadata } from 'next';
import { HowItWorksClient } from '@/components/marketing/HowItWorksClient';
import { getPageContent } from '@/lib/actions/pages';
import type { PlatformFeature } from '@/constants/documentation';

export const metadata: Metadata = {
  title: 'How It Works & User Guide | BookMyArtist',
  description:
    'Complete user guide and interactive documentation on how to use BookMyArtist to build artist portfolios, manage schedules, receive WhatsApp bookings, and find verified talent.',
  openGraph: {
    title: 'How It Works & User Guide | BookMyArtist',
    description:
      'Learn how artists and event planners use BookMyArtist to showcase showreels, manage availability, and book stage talent with 0% commission.',
  },
};

export default async function HowItWorksPage() {
  // Fetch any dynamic documentation custom features saved in CMS
  const customFeatures = await getPageContent<PlatformFeature[]>('how_it_works' as any);

  return (
    <main>
      <HowItWorksClient
        customFeatures={Array.isArray(customFeatures) ? customFeatures : []}
      />
    </main>
  );
}
