import { getMyProfile } from '@/lib/actions/profile';
import { getPlatformTaxonomy } from '@/lib/actions/taxonomy';
import { getMyRawMedia } from '@/lib/actions/raw-media';
import { PortfolioForm } from './PortfolioForm';

export default async function PortfolioPage() {
  const [profile, taxonomy, rawMedia] = await Promise.all([
    getMyProfile(),
    getPlatformTaxonomy(),
    getMyRawMedia(),
  ]);

  return (
    <PortfolioForm
      initialProfile={profile}
      taxonomy={taxonomy}
      initialRawMedia={rawMedia}
    />
  );
}
