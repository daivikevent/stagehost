import type { Metadata } from 'next';
import { HowItWorksClient } from '@/components/marketing/HowItWorksClient';
import { getPageContent } from '@/lib/actions/pages';
import type { PlatformFeature } from '@/constants/documentation';

export const metadata: Metadata = {
  title: 'How It Works & User Guide',
  description:
    'Complete user guide and interactive documentation on how to use StageHost to build anchor portfolios, manage schedules, receive WhatsApp bookings, and find verified emcees.',
  openGraph: {
    title: 'How It Works & User Guide | StageHost',
    description:
      'Learn how anchors and event planners use StageHost to showcase showreels, manage availability, and book stage hosts with 0% commission.',
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
