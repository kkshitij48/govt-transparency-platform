import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'Admin') redirect('/unauthorized');

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
