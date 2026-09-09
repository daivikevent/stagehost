import { getMyInquiries } from '@/lib/actions/inquiries';
import { getScheduleData } from '@/lib/actions/schedule';
import { InquiriesClient } from './InquiriesClient';

export default async function InquiriesPage() {
  const [inquiries, scheduleData] = await Promise.all([
    getMyInquiries(),
    getScheduleData(),
  ]);

  return (
    <InquiriesClient
      initialInquiries={inquiries}
      initialBookings={scheduleData?.bookings || []}
      profileName={scheduleData?.profile?.name || 'Artist'}
    />
  );
}

