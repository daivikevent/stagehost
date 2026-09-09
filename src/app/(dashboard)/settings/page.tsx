import { getMyProfile, getMySubscription } from '@/lib/actions/profile';
import { getScheduleData } from '@/lib/actions/schedule';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const [profile, subscription, scheduleData] = await Promise.all([
    getMyProfile(),
    getMySubscription(),
    getScheduleData(),
  ]);

  return (
    <SettingsClient
      initialProfile={profile}
      initialSubscription={subscription}
      initialShowCalendar={scheduleData?.showCalendar ?? true}
    />
  );
}
