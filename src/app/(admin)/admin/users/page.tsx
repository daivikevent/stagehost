import { getAdminUsers } from '@/lib/actions/admin';
import { UsersTableClient } from './UsersTableClient';

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  return <UsersTableClient initialUsers={users} />;
}
