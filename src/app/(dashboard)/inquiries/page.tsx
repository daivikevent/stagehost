import { getMyInquiries } from '@/lib/actions/inquiries';
import { getScheduleData } from '@/lib/actions/schedule';
import { getMyProfile } from '@/lib/actions/profile';
import { InquiriesClient } from './InquiriesClient';

export default async function InquiriesPage() {
  const [inquiries, scheduleData, profile] = await Promise.all([
    getMyInquiries(),
    getScheduleData(),
    getMyProfile(),
  ]);

  return (
    <InquiriesClient
      initialInquiries={inquiries}
      initialBookings={scheduleData?.bookings || []}
      profileName={profile?.name || scheduleData?.profile?.name || 'Artist'}
      profile={profile}
    />
  );
}

