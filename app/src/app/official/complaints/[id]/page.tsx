'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Clock, User, Building2,
  AlertTriangle, CheckCircle, MessageSquare, HelpCircle, XCircle, ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/complaints/status-badge';
import { ComplaintTimelineView } from '@/components/complaints/complaint-timeline';
import { createClient } from '@/lib/supabase/client';
import { updateComplaintStatus } from '@/lib/actions/complaints';
import { getAllowedTransitions, STATUS_CONFIG } from '@/lib/complaint-workflow';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ComplaintStatus, UserRole } from '@/types';

const actionIcons: Record<string, React.ReactNode> = {
  InitialReview: <MessageSquare className="h-4 w-4" />,
  RequestInfo: <HelpCircle className="h-4 w-4" />,
  Validate: <CheckCircle className="h-4 w-4" />,
  Reject: <XCircle className="h-4 w-4" />,
  Resolve: <CheckCircle className="h-4 w-4" />,
  Escalate: <AlertTriangle className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  InitialReview: 'bg-[#1B3A6B] hover:bg-[#152e58]',
  RequestInfo: 'bg-orange-500 hover:bg-orange-600',
  Validate: 'bg-purple-600 hover:bg-purple-700',
  Reject: 'bg-red-600 hover:bg-red-700',
  Resolve: 'bg-green-600 hover:bg-green-700',
  Escalate: 'bg-red-500 hover:bg-red-600',
};

export default function OfficialComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('Official');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [responseText, setResponseText] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase
        .from('complaints')
        .select(`
          *,
          citizen:profiles!complaints_user_id_fkey(user_id, name, email),
          department:departments(department_id, department_name),
          response:responses(*, official:profiles!responses_official_id_fkey(name, role)),
          timeline:complaint_timeline(*, actor:profiles!complaint_timeline_created_by_fkey(name, role))
        `)
        .eq('complaint_id', params.id as string)
        .single(),
      supabase.auth.getUser().then(({ data: { user } }) =>
        supabase.from('profiles').select('role').eq('user_id', user!.id).single()
      ),
    ]).then(([{ data: complaint }, { data: profile }]) => {
      setComplaint(complaint);
      setUserRole(profile?.role as UserRole || 'Official');
      setLoading(false);
    });
  }, [params.id]);

  async function handleAction(transition: any) {
    if (transition.requiresResponse && !responseText.trim()) {
      toast.error('Please provide a response before taking this action.');
      return;
    }
    startTransition(async () => {
      const result = await updateComplaintStatus(params.id as string, {
        nextStatus: transition.nextStatus,
        actionType: transition.actionType,
        response_text: responseText,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Complaint status updated to ${transition.nextStatus}`);
        router.refresh();
        // Reload complaint
        const supabase = createClient();
        const { data } = await supabase
          .from('complaints')
          .select(`*, citizen:profiles!complaints_user_id_fkey(user_id, name, email), department:departments(department_id, department_name), response:responses(*, official:profiles!responses_official_id_fkey(name, role)), timeline:complaint_timeline(*, actor:profiles!complaint_timeline_created_by_fkey(name, role))`)
          .eq('complaint_id', params.id as string)
          .single();
        setComplaint(data);
        setResponseText('');
        setActiveAction(null);
      }
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Complaint not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/official/complaints">Back to queue</Link>
        </Button>
      </div>
    );
  }

  const transitions = getAllowedTransitions(complaint.status as ComplaintStatus, userRole);
  const statusConfig = STATUS_CONFIG[complaint.status as ComplaintStatus];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/official/complaints" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B] mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Complaint</h1>
            <p className="font-mono text-xs text-slate-400 mt-1">
              REF: {complaint.complaint_id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <StatusBadge status={complaint.status as ComplaintStatus} size="lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          {/* Complaint details */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complaint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-700">{complaint.description}</p>

              {complaint.image_url && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Supporting Image (submitted by citizen)
                  </p>
                  <a href={complaint.image_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={complaint.image_url}
                      alt="Complaint evidence"
                      className="max-h-72 w-full object-contain rounded-lg border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                  <p className="text-[11px] text-gray-400 mt-1">Click to view full size</p>
                </div>
              )}

              {complaint.additional_info && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Additional Information from Citizen:</p>
                  <p className="text-sm text-blue-800">{complaint.additional_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing response */}
          {complaint.response && (
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800">Current Response on Record</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-900">{complaint.response.response_text}</p>
                <p className="mt-2 text-xs text-green-600">
                  — {complaint.response.official?.name} • {format(new Date(complaint.response.response_date), 'MMM d, yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action panel */}
          {transitions.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Available Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {transitions.map(t => (
                    <Button
                      key={t.actionType}
                      size="sm"
                      className={actionColors[t.actionType]}
                      onClick={() => setActiveAction(activeAction === t.actionType ? null : t.actionType)}
                      variant={activeAction === t.actionType ? 'default' : 'default'}
                    >
                      {actionIcons[t.actionType]}
                      <span className="ml-1.5">{t.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Response textarea */}
                {activeAction && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <Label htmlFor="response_text" className="text-sm font-medium">
                      Official Response{' '}
                      {transitions.find(t => t.actionType === activeAction)?.requiresResponse
                        ? '(Required)'
                        : '(Optional)'}
                    </Label>
                    <Textarea
                      id="response_text"
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Provide your official response, findings, and any actions taken..."
                      rows={5}
                      className="border-slate-300"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const t = transitions.find(tr => tr.actionType === activeAction);
                          if (t) handleAction(t);
                        }}
                        disabled={isPending}
                        className={actionColors[activeAction]}
                        size="sm"
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          actionIcons[activeAction]
                        )}
                        <span className="ml-1.5">
                          Confirm: {transitions.find(t => t.actionType === activeAction)?.label}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setActiveAction(null); setResponseText(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComplaintTimelineView timeline={complaint.timeline} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Citizen info */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4" />
                Complainant
              </h3>
              <div className="space-y-2">
                {complaint.is_anonymous ? (
                  <p className="italic text-sm text-slate-400">Anonymous submission</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-900">{complaint.citizen?.name}</p>
                    <p className="text-xs text-slate-500">{complaint.citizen?.email}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complaint metadata */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Department</p>
                  <p className="font-medium text-slate-700">{complaint.department?.department_name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Priority</p>
                  <Badge className="text-xs" variant="secondary">{complaint.priority || 'Normal'}</Badge>
                </div>
                {complaint.category && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-slate-400">Category</p>
                      <p className="font-medium text-slate-700">{complaint.category}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Filed On</p>
                  <p className="font-medium text-slate-700">
                    {format(new Date(complaint.created_date), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Last Updated</p>
                  <p className="font-medium text-slate-700">
                    {format(new Date(complaint.updated_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status description */}
          <div className={`rounded-xl border p-4 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
            <p className={`text-xs font-semibold ${statusConfig.color}`}>Current State</p>
            <p className={`mt-1 text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </p>
            <p className={`mt-1 text-xs ${statusConfig.color} opacity-75`}>
              {statusConfig.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
