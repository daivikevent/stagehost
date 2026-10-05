import { DashboardShell } from '@/components/dashboard/DashboardLayout';
import { getMyProfile } from '@/lib/actions/profile';
import { checkIsAdmin, getImpersonationStatus, getAnnouncementBanner } from '@/lib/actions/admin';
import { getReferralProgramSettings } from '@/lib/actions/referrals';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, isAdmin, impersonation, announcement, referralSettings] = await Promise.all([
    getMyProfile(),
    checkIsAdmin(),
    getImpersonationStatus(),
    getAnnouncementBanner(),
    getReferralProgramSettings(),
  ]);

  return (
    <DashboardShell
      userName={profile?.name}
      userSlug={profile?.slug}
      isAdmin={isAdmin}
      impersonation={impersonation}
      announcement={announcement}
      referralsEnabled={referralSettings?.enabled ?? false}
    >
      {children}
    </DashboardShell>
  );
}
