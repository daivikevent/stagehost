import { getPublicPlans } from '@/lib/actions/plans';
import { PricingClient } from './PricingClient';

export const metadata = {
  title: 'Transparent Pricing | BookMyArtist',
  description: 'Simple, transparent pricing for live artists and performers. Free forever tier available. 100% commission-free bookings.',
};

export default async function PricingPage() {
  const plans = await getPublicPlans();
  return <PricingClient plans={plans} />;
}
