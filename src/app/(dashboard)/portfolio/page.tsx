import { getMyProfile } from '@/lib/actions/profile';
import { PortfolioForm } from './PortfolioForm';

export default async function PortfolioPage() {
  const profile = await getMyProfile();
  return <PortfolioForm initialProfile={profile} />;
}
