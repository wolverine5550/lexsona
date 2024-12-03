import { UserManagement } from '@/components/admin/users/UserManagement';

export const metadata = {
  title: 'User Management - Admin Panel',
  description: 'Manage users, roles, and permissions'
};

export default function UsersPage() {
  return <UserManagement />;
}
