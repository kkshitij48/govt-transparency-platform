import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { Navbar } from '@/components/layout/navbar';
import { ProfileForm } from './profile-form';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { User, Building2, ShieldCheck, Calendar } from 'lucide-react';

export const metadata = { title: 'My Profile' };

const roleColors: Record<string, string> = {
  Admin:    'bg-red-50 text-red-700 border border-red-200',
  Official: 'bg-blue-50 text-[#1B3A6B] border border-blue-200',
  Citizen:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  // Fetch complaint stats for citizens
  const supabase = await createClient();
  const { count: totalComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user_id);

  const { count: resolvedComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user_id)
    .in('status', ['Resolved', 'Closed']);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar user={user} />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Account</p>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your personal information and account settings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left — identity card */}
          <div className="space-y-4">
            {/* Avatar + role */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#1B3A6B] flex items-center justify-center text-2xl font-bold text-white mb-4">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <p className="font-semibold text-[#1A1A2E] text-sm">{user.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${roleColors[user.role]}`}>
                <ShieldCheck className="h-3 w-3" />
                {user.role}
              </span>
            </div>

            {/* Meta info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Calendar className="h-4 w-4 text-gray-300 shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Member since</p>
                  <p className="text-xs font-semibold text-gray-700">
                    {format(new Date(user.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              {(user as any).department?.department_name && (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Building2 className="h-4 w-4 text-gray-300 shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Department</p>
                    <p className="text-xs font-semibold text-gray-700">{(user as any).department.department_name}</p>
                  </div>
                </div>
              )}

              {user.role === 'Citizen' && (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <User className="h-4 w-4 text-gray-300 shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Complaints</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {resolvedComplaints ?? 0} resolved / {totalComplaints ?? 0} total
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — editable forms */}
          <div className="lg:col-span-2">
            <ProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
