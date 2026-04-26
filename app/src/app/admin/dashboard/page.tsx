import Link from 'next/link';
import {
  Users, Building2, FolderOpen, FileText,
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  ArrowRight, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/stats-card';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalComplaints },
    { count: totalProjects },
    { count: totalDepartments },
    { data: recentComplaints },
    { data: complaints },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('complaints').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('departments').select('*', { count: 'exact', head: true }),
    supabase.from('complaints')
      .select('*, department:departments(department_name), citizen:profiles!complaints_user_id_fkey(name)')
      .order('created_date', { ascending: false })
      .limit(8),
    supabase.from('complaints').select('status'),
  ]);

  const statusCounts = complaints?.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const resolutionRate = totalComplaints
    ? Math.round(((statusCounts['Resolved'] || 0) + (statusCounts['Closed'] || 0)) / totalComplaints * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          System overview and transparency metrics — {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers || 0}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-[#1B3A6B]"
        />
        <StatsCard
          title="Total Complaints"
          value={totalComplaints || 0}
          icon={FileText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Active Projects"
          value={totalProjects || 0}
          icon={FolderOpen}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Departments"
          value={totalDepartments || 0}
          icon={Building2}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Resolution metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Resolution Rate</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{resolutionRate}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Submitted</p>
          <p className="mt-1 text-2xl font-bold text-[#1B3A6B]">{statusCounts['Submitted'] || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Escalated</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{statusCounts['Escalated'] || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">{statusCounts['Rejected'] || 0}</p>
        </div>
      </div>

      {/* Quick access */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/admin/users', icon: Users, label: 'Manage Users', color: 'bg-[#1B3A6B]' },
          { href: '/admin/departments', icon: Building2, label: 'Departments', color: 'bg-green-600' },
          { href: '/admin/projects', icon: FolderOpen, label: 'Projects', color: 'bg-purple-600' },
          { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'bg-orange-600' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#1B3A6B]">
                {item.label}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-blue-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent complaints */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold">Recent Complaints</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/complaints" className="text-[#1B3A6B]">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentComplaints?.map((c: any) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {c.complaint_id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate text-sm text-slate-700">
                        {c.description.slice(0, 50)}...
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.department?.department_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status as ComplaintStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {format(new Date(c.created_date), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
