'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Clock, Loader2, Send, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/complaints/status-badge';
import { ComplaintTimelineView } from '@/components/complaints/complaint-timeline';
import { createClient } from '@/lib/supabase/client';
import { submitAdditionalInfo, closeCitizenComplaint, reopenCitizenComplaint } from '@/lib/actions/complaints';
import { STATUS_CONFIG } from '@/lib/complaint-workflow';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ComplaintStatus } from '@/types';

export default function CitizenComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('complaints')
      .select(`
        *,
        department:departments(department_id, department_name),
        response:responses(*, official:profiles!responses_official_id_fkey(name, role)),
        timeline:complaint_timeline(*, actor:profiles!complaint_timeline_created_by_fkey(name, role))
      `)
      .eq('complaint_id', params.id as string)
      .single()
      .then(({ data }) => {
        setComplaint(data);
        setLoading(false);
      });
  }, [params.id]);

  async function handleAdditionalInfo(formData: FormData) {
    startTransition(async () => {
      const result = await submitAdditionalInfo(params.id as string, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Information submitted. Your complaint is back under review.');
        router.refresh();
        setAdditionalInfo('');
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
        <Button asChild className="mt-4" variant="outline">
          <Link href="/citizen/complaints">Back to complaints</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[complaint.status as ComplaintStatus];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/citizen/complaints" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B] mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Complaint Details</h1>
            <p className="mt-1 text-xs font-mono text-slate-400">
              REF: {complaint.complaint_id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <StatusBadge status={complaint.status as ComplaintStatus} size="lg" />
        </div>
      </div>

      {/* Status description */}
      <div className={`rounded-xl border p-4 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
        <p className={`text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.icon} {statusConfig.label}
        </p>
        <p className={`mt-1 text-sm ${statusConfig.color} opacity-80`}>
          {statusConfig.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Complaint description */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Complaint Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{complaint.description}</p>
              {complaint.image_url && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Supporting Image
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
                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Additional Information Provided:</p>
                  <p className="text-sm text-blue-800">{complaint.additional_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Official response */}
          {complaint.response && (
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Official Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-green-900">
                  {complaint.response.response_text}
                </p>
                <p className="mt-3 text-xs text-green-600">
                  — {complaint.response.official?.name || 'Government Official'} •{' '}
                  {format(new Date(complaint.response.response_date), 'MMM d, yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Additional info form for PendingInfo status */}
          {complaint.status === 'PendingInfo' && (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-orange-800">
                  Action Required: Provide Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-orange-700">
                  An official has reviewed your complaint and needs more information before proceeding.
                  Please provide the requested details below.
                </p>
                <form action={handleAdditionalInfo} className="space-y-3">
                  <div>
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      name="additional_info"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      placeholder="Provide the additional details requested by the official..."
                      rows={4}
                      className="mt-1 border-orange-300"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending || additionalInfo.length < 20}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit Information
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Resolved actions */}
          {complaint.status === 'Resolved' && (
            <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-emerald-800 mb-1">
                  Your complaint has been resolved.
                </p>
                <p className="text-xs text-emerald-700 mb-4">
                  Are you satisfied with the resolution? You can close it permanently or reopen it if the issue persists.
                </p>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    onClick={() => startTransition(async () => {
                      const result = await closeCitizenComplaint(params.id as string);
                      if (result?.error) toast.error(result.error);
                      else { toast.success('Complaint closed. Thank you for your feedback.'); router.refresh(); }
                    })}
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Yes, Close Complaint'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                    onClick={() => startTransition(async () => {
                      const result = await reopenCitizenComplaint(params.id as string);
                      if (result?.error) toast.error(result.error);
                      else { toast.success('Complaint reopened. An official will follow up.'); router.refresh(); }
                    })}
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '↺ No, Reopen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Complaint Timeline
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
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Complaint Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Reference ID</p>
                  <p className="font-mono font-medium text-slate-700">
                    {complaint.complaint_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Department</p>
                  <p className="font-medium text-slate-700">{complaint.department?.department_name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Filed On</p>
                  <p className="font-medium text-slate-700">
                    {format(new Date(complaint.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Last Updated</p>
                  <p className="font-medium text-slate-700">
                    {format(new Date(complaint.updated_at), 'MMM d, yyyy')}
                  </p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
