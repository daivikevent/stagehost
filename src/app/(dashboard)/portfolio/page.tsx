import { getMyProfile } from '@/lib/actions/profile';
import { getPlatformTaxonomy } from '@/lib/actions/taxonomy';
import { PortfolioForm } from './PortfolioForm';

export default async function PortfolioPage() {
  const [profile, taxonomy] = await Promise.all([
    getMyProfile(),
    getPlatformTaxonomy(),
  ]);

  return <PortfolioForm initialProfile={profile} taxonomy={taxonomy} />;
}
