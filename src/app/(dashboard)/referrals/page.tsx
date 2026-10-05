import { getUserReferralData } from '@/lib/actions/referrals';
import { ReferralsClient } from '@/app/(dashboard)/referrals/ReferralsClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Invite Artists & Referrals | BookMyArtist',
  description: 'Invite fellow artists, earn rewards, and climb the BookMyArtist community leaderboard.',
};

export default async function ReferralsPage() {
  const data = await getUserReferralData();

  if (!data) {
    redirect('/login');
  }

  return <ReferralsClient initialData={data} />;
}
