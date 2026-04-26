import Link from 'next/link';
import { MessageSquare, Clock, AlertCircle, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/stats-card';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { format } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'Official Dashboard' };

export default async function OfficialDashboard() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, citizen:profiles!complaints_user_id_fkey(name, email), department:departments(department_name)')
    .eq('department_id', user!.department_id || '')
    .order('created_date', { ascending: false });

  const statusCounts = complaints?.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const needsAction = complaints?.filter(c =>
    ['Submitted', 'UnderReview', 'InProgress'].includes(c.status)
  ) || [];
  const escalated = complaints?.filter(c => c.status === 'Escalated') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Official Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.department?.department_name || 'Your Department'} — Manage your complaint queue
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Assigned"
          value={complaints?.length || 0}
          icon={MessageSquare}
          iconBg="bg-blue-50"
          iconColor="text-[#1B3A6B]"
        />
        <StatsCard
          title="Needs Action"
          value={needsAction.length}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Escalated"
          value={escalated.length}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Resolved"
          value={(statusCounts['Resolved'] || 0) + (statusCounts['Closed'] || 0)}
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Escalated banner */}
      {escalated.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                {escalated.length} Escalated Complaint{escalated.length > 1 ? 's' : ''} Require Immediate Attention
              </p>
              <p className="text-sm text-red-700">These have been flagged for priority resolution.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100">
              <Link href="/official/complaints?status=Escalated">View All</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Review */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Pending Review</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/official/complaints?status=Submitted" className="text-[#1B3A6B]">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complaints?.filter(c => c.status === 'Submitted').slice(0, 5).map((c: any) => (
                <Link key={c.complaint_id} href={`/official/complaints/${c.complaint_id}`}>
                  <div className="group flex items-start justify-between rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-blue-700">
                        {c.description.slice(0, 60)}...
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        by {c.is_anonymous ? 'Anonymous' : c.citizen?.name} • {format(new Date(c.created_date), 'MMM d')}
                      </p>
                    </div>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-400" />
                  </div>
                </Link>
              ))}
              {!complaints?.filter(c => c.status === 'Submitted').length && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No complaints pending review ✓
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">In Progress</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/official/complaints?status=InProgress" className="text-[#1B3A6B]">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complaints?.filter(c => ['UnderReview', 'InProgress'].includes(c.status)).slice(0, 5).map((c: any) => (
                <Link key={c.complaint_id} href={`/official/complaints/${c.complaint_id}`}>
                  <div className="group flex items-start justify-between rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-blue-700">
                        {c.description.slice(0, 60)}...
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={c.status as ComplaintStatus} size="sm" />
                        <span className="text-xs text-slate-400">
                          {format(new Date(c.updated_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-400" />
                  </div>
                </Link>
              ))}
              {!complaints?.filter(c => ['UnderReview', 'InProgress'].includes(c.status)).length && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No complaints in progress
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
