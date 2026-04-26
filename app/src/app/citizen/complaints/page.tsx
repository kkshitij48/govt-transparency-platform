import Link from 'next/link';
import { FileText, PlusCircle, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/complaints/status-badge';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { format } from 'date-fns';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'My Complaints' };

export default async function CitizenComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();

  let query = supabase
    .from('complaints')
    .select('*, department:departments(department_name), response:responses(response_text, response_date)')
    .eq('user_id', user!.user_id)
    .order('created_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: complaints } = await query;

  const statuses: ComplaintStatus[] = ['Submitted', 'UnderReview', 'PendingInfo', 'InProgress', 'Escalated', 'Resolved', 'Closed', 'Rejected'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">
            {complaints?.length || 0} total complaint{(complaints?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild className="bg-[#1B3A6B] hover:bg-[#152e58]">
          <Link href="/citizen/complaints/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Complaint
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link href="/citizen/complaints">
          <Badge
            variant={!status ? 'default' : 'outline'}
            className={`cursor-pointer text-xs ${!status ? 'bg-[#1B3A6B]' : ''}`}
          >
            All
          </Badge>
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/citizen/complaints?status=${s}`}>
            <Badge
              variant={status === s ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${status === s ? 'bg-[#1B3A6B]' : ''}`}
            >
              {s}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Complaints list */}
      <div className="space-y-3">
        {complaints?.map((complaint: any) => (
          <Link key={complaint.complaint_id} href={`/citizen/complaints/${complaint.complaint_id}`}>
            <Card className="group cursor-pointer border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-700">
                      {complaint.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        🏛️ {complaint.department?.department_name}
                      </span>
                      <span>·</span>
                      <span>Filed {format(new Date(complaint.created_date), 'MMM d, yyyy')}</span>
                      {complaint.priority && complaint.priority !== 'Normal' && (
                        <>
                          <span>·</span>
                          <span className={`font-medium ${
                            complaint.priority === 'Critical' ? 'text-red-500' :
                            complaint.priority === 'High' ? 'text-orange-500' : 'text-blue-500'
                          }`}>
                            {complaint.priority} Priority
                          </span>
                        </>
                      )}
                    </div>
                    {complaint.response?.response_text && (
                      <div className="mt-2 rounded bg-green-50 px-2.5 py-1.5 text-xs text-green-700">
                        Official responded: {complaint.response.response_text.slice(0, 80)}...
                      </div>
                    )}
                  </div>
                  <StatusBadge status={complaint.status as ComplaintStatus} size="sm" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!complaints || complaints.length === 0) && (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">
              {status ? `No ${status} complaints` : 'No complaints yet'}
            </p>
            {!status && (
              <Button asChild size="sm" className="mt-4 bg-[#1B3A6B] hover:bg-[#152e58]">
                <Link href="/citizen/complaints/new">Submit your first complaint</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
