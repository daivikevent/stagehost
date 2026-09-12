import { getMyProfile, getMySubscription } from '@/lib/actions/profile';
import { getScheduleData } from '@/lib/actions/schedule';
import { getPublicPlans } from '@/lib/actions/plans';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const [profile, subscription, scheduleData, plans] = await Promise.all([
    getMyProfile(),
    getMySubscription(),
    getScheduleData(),
    getPublicPlans(),
  ]);

  return (
    <SettingsClient
      initialProfile={profile}
      initialSubscription={subscription}
      initialShowCalendar={scheduleData?.showCalendar ?? true}
      plans={plans}
    />
  );
}
