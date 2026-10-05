import { getAllReferralsAdmin } from '@/lib/actions/referrals';
import { AdminReferralsClient } from '@/app/(admin)/admin/referrals/AdminReferralsClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Referrals & Rewards Studio | BookMyArtist Admin',
  description: 'Manage artist referral rewards, validity perks, and community leaderboard.',
};

export default async function AdminReferralsPage() {
  try {
    const data = await getAllReferralsAdmin();
    return <AdminReferralsClient initialData={data} />;
  } catch {
    redirect('/login');
  }
}
