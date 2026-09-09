import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/actions/admin';
import { DashboardShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
