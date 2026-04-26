import Link from 'next/link';
import {
  FileText, PlusCircle, CheckCircle2, AlertCircle, Clock,
  Bell, ChevronRight, TrendingUp, TrendingDown
} from 'lucide-react';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { format } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'Dashboard' };

// ── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, topColor, icon: Icon, trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  topColor: string;
  icon: React.ElementType;
  trend?: { value: number; up: boolean };
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className={`h-1 w-full ${topColor}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#1A1A2E]">{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
            {trend && (
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}% from last month
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Priority badge ────────────────────────────────────────────────────────────
function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500',
    High:     'bg-orange-400',
    Normal:   'bg-blue-400',
    Low:      'bg-gray-300',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[priority] ?? colors.Normal}`} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function CitizenDashboard() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, department:departments(department_name)')
    .eq('user_id', user!.user_id)
    .order('created_date', { ascending: false })
    .limit(20);

  const counts = (complaints || []).reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const total    = complaints?.length ?? 0;
  const resolved = (counts.Resolved ?? 0) + (counts.Closed ?? 0);
  const pending  = (counts.Submitted ?? 0) + (counts.UnderReview ?? 0) + (counts.InProgress ?? 0);
  const needInfo = counts.PendingInfo ?? 0;

  const firstName = user?.name?.split(' ')[0] ?? 'Citizen';

  return (
    <div className="space-y-7">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Citizen Portal</p>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">
            Good day, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
            <Bell className="h-4 w-4 text-gray-500" />
            {needInfo > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                {needInfo}
              </span>
            )}
          </button>
          <Link
            href="/citizen/complaints/new"
            className="inline-flex items-center gap-2 bg-[#1B3A6B] text-white px-4 py-2 text-sm font-semibold rounded hover:bg-[#152e58] transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Complaint
          </Link>
        </div>
      </div>

      {/* ── Action required alert ─────────────────────────────── */}
      {needInfo > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {needInfo} complaint{needInfo > 1 ? 's' : ''} require{needInfo === 1 ? 's' : ''} your response
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Officials have requested additional information. Respond to avoid delays.
            </p>
          </div>
          <Link
            href="/citizen/complaints?status=PendingInfo"
            className="shrink-0 text-xs font-semibold text-amber-800 border border-amber-300 rounded px-3 py-1.5 hover:bg-amber-100 transition-colors"
          >
            Respond Now
          </Link>
        </div>
      )}

      {/* ── Metric cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Filed"  value={total}    icon={FileText}     topColor="bg-[#1B3A6B]" />
        <MetricCard label="Resolved"     value={resolved} icon={CheckCircle2} topColor="bg-emerald-500" sub={total > 0 ? `${Math.round((resolved / total) * 100)}% rate` : undefined} />
        <MetricCard label="In Progress"  value={pending}  icon={Clock}        topColor="bg-amber-400" />
        <MetricCard label="Needs Info"   value={needInfo} icon={AlertCircle}  topColor="bg-red-400" />
      </div>

      {/* ── Complaints table ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1A1A2E]">Complaint History</h2>
          <Link
            href="/citizen/complaints"
            className="text-xs font-semibold text-[#1B3A6B] hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Ref No.</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Department</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Priority</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Filed</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {complaints?.slice(0, 8).map((c: any, idx) => (
                <tr
                  key={c.complaint_id}
                  className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs font-semibold text-gray-500">
                      #{c.complaint_id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-[#1A1A2E] max-w-[220px] truncate">
                      {c.description.slice(0, 60)}…
                    </p>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {(c.department as any)?.department_name}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <PriorityDot priority={c.priority || 'Normal'} />
                      <span className="text-xs text-gray-500">{c.priority || 'Normal'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={c.status as ComplaintStatus} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(c.created_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/citizen/complaints/${c.complaint_id}`}
                      className="text-xs font-semibold text-[#1B3A6B] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!complaints || complaints.length === 0) && (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No complaints filed yet</p>
              <Link
                href="/citizen/complaints/new"
                className="mt-4 inline-flex items-center gap-2 bg-[#1B3A6B] text-white text-sm font-semibold px-4 py-2 rounded hover:bg-[#152e58] transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                File your first complaint
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
