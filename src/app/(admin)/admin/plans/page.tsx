import { getAdminPlans, getCoupons } from '@/lib/actions/admin';
import { PlansClient } from './PlansClient';

export default async function AdminPlansPage() {
  const [plans, coupons] = await Promise.all([
    getAdminPlans(),
    getCoupons(),
  ]);
  return <PlansClient initialPlans={plans} initialCoupons={coupons} />;
}
