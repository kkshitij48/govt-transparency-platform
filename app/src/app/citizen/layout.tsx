import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'Citizen') redirect('/unauthorized');

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
