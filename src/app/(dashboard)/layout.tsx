import { DashboardShell } from '@/components/dashboard/DashboardLayout';
import { getMyProfile } from '@/lib/actions/profile';
import { checkIsAdmin, getImpersonationStatus, getAnnouncementBanner } from '@/lib/actions/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, isAdmin, impersonation, announcement] = await Promise.all([
    getMyProfile(),
    checkIsAdmin(),
    getImpersonationStatus(),
    getAnnouncementBanner(),
  ]);

  return (
    <DashboardShell
      userName={profile?.name}
      userSlug={profile?.slug}
      isAdmin={isAdmin}
      impersonation={impersonation}
      announcement={announcement}
    >
      {children}
    </DashboardShell>
  );
}
