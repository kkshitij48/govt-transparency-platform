import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'All Complaints' };

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('complaints')
    .select(`
      *,
      citizen:profiles!complaints_user_id_fkey(name, email),
      department:departments(department_name),
      response:responses(response_id)
    `)
    .order('created_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: complaints } = await query;

  const statuses: ComplaintStatus[] = ['Submitted', 'UnderReview', 'PendingInfo', 'InProgress', 'Escalated', 'Resolved', 'Closed', 'Rejected'];

  const priorityColors: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Normal: 'bg-slate-100 text-slate-600',
    Low: 'bg-slate-100 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Complaints</h1>
        <p className="mt-1 text-sm text-slate-500">{complaints?.length || 0} complaints</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/complaints">
          <Badge variant={!status ? 'default' : 'outline'} className={`cursor-pointer text-xs ${!status ? 'bg-[#1B3A6B]' : ''}`}>
            All
          </Badge>
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/admin/complaints?status=${s}`}>
            <Badge variant={status === s ? 'default' : 'outline'} className={`cursor-pointer text-xs ${status === s ? 'bg-[#1B3A6B]' : ''}`}>
              {s}
            </Badge>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Citizen</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints?.map((c: any) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {c.complaint_id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate font-medium text-slate-900">
                        {c.description.slice(0, 60)}...
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.is_anonymous ? <span className="italic text-slate-400">Anonymous</span> : c.citizen?.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.department?.department_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${priorityColors[c.priority || 'Normal']}`} variant="secondary">
                        {c.priority || 'Normal'}
                      </Badge>
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

            {(!complaints || complaints.length === 0) && (
              <div className="py-16 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-400">No complaints found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
