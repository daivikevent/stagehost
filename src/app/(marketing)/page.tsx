import { LandingPage } from '@/components/marketing/LandingPage';
import { getPublicPlans } from '@/lib/actions/plans';

export default async function HomePage() {
  const plans = await getPublicPlans();
  return <LandingPage initialPlans={plans} />;
}
