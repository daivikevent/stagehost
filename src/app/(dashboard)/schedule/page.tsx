import { getScheduleData } from '@/lib/actions/schedule';
import { getMyInquiries } from '@/lib/actions/inquiries';
import { ScheduleClient } from './ScheduleClient';

export default async function SchedulePage() {
  const [data, inquiries] = await Promise.all([
    getScheduleData(),
    getMyInquiries(),
  ]);

  return (
    <ScheduleClient
      initialProfile={data?.profile || null}
      initialSlots={data?.slotsMap || {}}
      initialBookings={data?.bookings || []}
      initialInquiries={inquiries || []}
      initialShowCalendar={data?.showCalendar ?? true}
    />
  );
}
