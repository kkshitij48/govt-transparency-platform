import Link from 'next/link';
import { AlertCircle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { format, differenceInDays } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'Escalated Complaints' };

export default async function EscalatedPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from('complaints')
    .select(`
      *,
      citizen:profiles!complaints_user_id_fkey(name, email),
      department:departments(department_name)
    `)
    .eq('department_id', user!.department_id || '')
    .eq('status', 'Escalated')
    .order('created_date', { ascending: true }); // oldest first — most urgent

  const list = complaints ?? [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">Escalated Complaints</h1>
          </div>
          <p className="text-sm text-gray-500">
            {user?.department?.department_name} — {list.length} escalated complaint{list.length !== 1 ? 's' : ''} requiring urgent attention
          </p>
        </div>
        {list.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            {list.length} Urgent
          </span>
        )}
      </div>

      {/* Alert banner */}
      {list.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Escalated complaints have breached SLA or require higher authority review.
            Resolve these as a priority to avoid further escalation.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="py-20 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">No escalated complaints</p>
            <p className="text-xs text-gray-400 mt-1">
              All complaints in your department are within SLA.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Ref No.</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Description</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Citizen</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Priority</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Filed</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Age</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {list.map((c: any, idx) => {
                  const ageDays = differenceInDays(new Date(), new Date(c.created_date));
                  const priorityBadge: Record<string, string> = {
                    Critical: 'bg-red-50 text-red-700 border border-red-200',
                    High:     'bg-orange-50 text-orange-700 border border-orange-200',
                    Normal:   'bg-gray-50 text-gray-600 border border-gray-200',
                    Low:      'bg-gray-50 text-gray-400 border border-gray-200',
                  };
                  return (
                    <tr
                      key={c.complaint_id}
                      className={`border-b border-gray-50 hover:bg-red-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-500">
                          #{c.complaint_id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="font-medium text-[#1A1A2E] truncate">
                          {c.description.slice(0, 60)}…
                        </p>
                        {c.category && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.category}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {c.is_anonymous ? (
                          <span className="italic text-gray-400">Anonymous</span>
                        ) : (
                          c.citizen?.name ?? '—'
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityBadge[c.priority || 'Normal']}`}>
                          {c.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={c.status as ComplaintStatus} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {format(new Date(c.created_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-1 text-xs font-semibold ${ageDays >= 14 ? 'text-red-600' : ageDays >= 7 ? 'text-orange-500' : 'text-gray-500'}`}>
                          <Clock className="h-3 w-3" />
                          {ageDays}d
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/official/complaints/${c.complaint_id}`}
                          className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap"
                        >
                          Resolve
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
