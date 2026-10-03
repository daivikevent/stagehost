import { getMyProfile, getMySubscription } from '@/lib/actions/profile';
import { getScheduleData } from '@/lib/actions/schedule';
import { getPublicPlans } from '@/lib/actions/plans';
import { getArtistBillingDetails, getMyPaymentInvoices } from '@/lib/actions/billing';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const [profile, subscription, scheduleData, plans, billingDetails, invoices] = await Promise.all([
    getMyProfile(),
    getMySubscription(),
    getScheduleData(),
    getPublicPlans(),
    getArtistBillingDetails(),
    getMyPaymentInvoices(),
  ]);

  return (
    <SettingsClient
      initialProfile={profile}
      initialSubscription={subscription}
      initialShowCalendar={scheduleData?.showCalendar ?? true}
      plans={plans}
      initialBillingDetails={billingDetails}
      initialInvoices={invoices}
    />
  );
}
