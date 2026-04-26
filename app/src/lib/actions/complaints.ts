'use server';

import { createClient } from '@/lib/supabase/server';
import { complaintSchema, responseSchema, additionalInfoSchema } from '@/lib/validations/complaint';
import { getAllowedTransitions } from '@/lib/complaint-workflow';
import { revalidatePath } from 'next/cache';
import type { ComplaintStatus } from '@/types';

export async function submitComplaint(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to submit a complaint.' };

  const raw = {
    description: formData.get('description') as string,
    department_id: formData.get('department_id') as string,
    category: formData.get('category') as string || undefined,
    priority: (formData.get('priority') as string) || 'Normal',
    is_anonymous: formData.get('is_anonymous') === 'true',
  };

  const parsed = complaintSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // image_url is uploaded client-side and passed as a plain string field
  const image_url = (formData.get('image_url') as string) || null;

  const insertPayload: Record<string, unknown> = {
    ...parsed.data,
    user_id: user.id,
    status: 'Submitted',
  };
  if (image_url) insertPayload.image_url = image_url;

  let { data: complaint, error } = await supabase
    .from('complaints')
    .insert(insertPayload)
    .select()
    .single();

  // If the column doesn't exist yet (migration not run), retry without image_url
  if (error && image_url && error.message?.includes('image_url')) {
    const retry = await supabase
      .from('complaints')
      .insert({ ...parsed.data, user_id: user.id, status: 'Submitted' })
      .select()
      .single();
    complaint = retry.data;
    error     = retry.error;
    if (!retry.error) {
      console.warn('[complaints] image_url column missing — run add_complaint_images.sql in Supabase SQL Editor');
    }
  }

  if (error) {
    console.error('[submitComplaint error]', error);
    return { error: `Failed to submit complaint: ${error.message}` };
  }

  // Log initial status to timeline
  await supabase.from('complaint_timeline').insert({
    complaint_id: complaint.complaint_id,
    status: 'Submitted',
    note: 'Complaint submitted by citizen',
    created_by: user.id,
  });

  revalidatePath('/citizen/complaints');
  return { success: true, complaint_id: complaint.complaint_id };
}

export async function updateComplaintStatus(
  complaint_id: string,
  action: { nextStatus: ComplaintStatus; actionType: string; response_text: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const { data: complaint } = await supabase
    .from('complaints')
    .select('status, department_id')
    .eq('complaint_id', complaint_id)
    .single();

  if (!complaint) return { error: 'Complaint not found' };

  const allowed = getAllowedTransitions(complaint.status as ComplaintStatus, profile?.role);
  const transition = allowed.find(t => t.nextStatus === action.nextStatus);

  if (!transition) {
    return { error: 'This status transition is not allowed.' };
  }

  // Update complaint status
  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      status: action.nextStatus,
      assigned_official_id: user.id,
    })
    .eq('complaint_id', complaint_id);

  if (updateError) return { error: 'Failed to update complaint status.' };

  // Upsert response
  if (action.response_text) {
    const responseValidated = responseSchema.safeParse({
      response_text: action.response_text,
      action_type: action.actionType,
    });

    if (!responseValidated.success) {
      return { error: responseValidated.error.issues[0].message };
    }

    const { data: existing } = await supabase
      .from('responses')
      .select('response_id')
      .eq('complaint_id', complaint_id)
      .single();

    if (existing) {
      await supabase
        .from('responses')
        .update({
          response_text: action.response_text,
          action_type: action.actionType,
          response_date: new Date().toISOString(),
          official_id: user.id,
        })
        .eq('complaint_id', complaint_id);
    } else {
      await supabase.from('responses').insert({
        response_text: action.response_text,
        action_type: action.actionType,
        complaint_id,
        official_id: user.id,
      });
    }
  }

  // Log to timeline
  await supabase.from('complaint_timeline').insert({
    complaint_id,
    status: action.nextStatus,
    note: action.response_text || `Status updated to ${action.nextStatus}`,
    created_by: user.id,
  });

  revalidatePath(`/official/complaints/${complaint_id}`);
  revalidatePath('/official/complaints');
  return { success: true };
}

export async function submitAdditionalInfo(complaint_id: string, formData: FormData) {
  // Use anon client only to get the authenticated user identity
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const raw = { additional_info: formData.get('additional_info') as string };
  const parsed = additionalInfoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Use service-role client to bypass RLS.
  // RLS UPDATE policy checks the NEW row's status, but we're changing
  // status from 'PendingInfo' → 'UnderReview', so the WITH CHECK fails.
  // We verify ownership manually before writing.
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify this complaint belongs to the citizen and is currently PendingInfo
  const { data: existing } = await admin
    .from('complaints')
    .select('user_id, status')
    .eq('complaint_id', complaint_id)
    .single();

  if (!existing) return { error: 'Complaint not found.' };
  if (existing.user_id !== user.id) return { error: 'Unauthorized.' };
  if (existing.status !== 'PendingInfo') return { error: 'This complaint is not awaiting additional information.' };

  const { error } = await admin
    .from('complaints')
    .update({
      additional_info: parsed.data.additional_info,
      status: 'UnderReview',
    })
    .eq('complaint_id', complaint_id);

  if (error) return { error: 'Failed to submit information. Please try again.' };

  await admin.from('complaint_timeline').insert({
    complaint_id,
    status: 'UnderReview',
    note: 'Citizen provided additional information',
    created_by: user.id,
  });

  revalidatePath(`/citizen/complaints/${complaint_id}`);
  revalidatePath('/citizen/complaints');
  return { success: true };
}

export async function closeCitizenComplaint(complaint_id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await admin
    .from('complaints')
    .select('user_id, status')
    .eq('complaint_id', complaint_id)
    .single();

  if (!existing) return { error: 'Complaint not found.' };
  if (existing.user_id !== user.id) return { error: 'Unauthorized.' };
  if (existing.status !== 'Resolved') return { error: 'Only resolved complaints can be closed.' };

  const { error } = await admin
    .from('complaints')
    .update({ status: 'Closed' })
    .eq('complaint_id', complaint_id);

  if (error) return { error: 'Failed to close complaint.' };

  await admin.from('complaint_timeline').insert({
    complaint_id,
    status: 'Closed',
    note: 'Citizen marked complaint as resolved and closed',
    created_by: user.id,
  });

  revalidatePath(`/citizen/complaints/${complaint_id}`);
  revalidatePath('/citizen/complaints');
  return { success: true };
}

export async function reopenCitizenComplaint(complaint_id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await admin
    .from('complaints')
    .select('user_id, status')
    .eq('complaint_id', complaint_id)
    .single();

  if (!existing) return { error: 'Complaint not found.' };
  if (existing.user_id !== user.id) return { error: 'Unauthorized.' };
  if (existing.status !== 'Resolved') return { error: 'Only resolved complaints can be reopened.' };

  const { error } = await admin
    .from('complaints')
    .update({ status: 'Reopened' })
    .eq('complaint_id', complaint_id);

  if (error) return { error: 'Failed to reopen complaint.' };

  await admin.from('complaint_timeline').insert({
    complaint_id,
    status: 'Reopened',
    note: 'Citizen was not satisfied with the resolution and reopened the complaint',
    created_by: user.id,
  });

  revalidatePath(`/citizen/complaints/${complaint_id}`);
  revalidatePath('/citizen/complaints');
  return { success: true };
}

export async function getComplaintWithDetails(complaint_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      citizen:profiles!complaints_user_id_fkey(user_id, name, email),
      department:departments(department_id, department_name),
      response:responses(*, official:profiles!responses_official_id_fkey(user_id, name, email)),
      timeline:complaint_timeline(*, actor:profiles!complaint_timeline_created_by_fkey(name, role))
    `)
    .eq('complaint_id', complaint_id)
    .single();

  if (error) return null;
  return data;
}

export async function getComplaintAnalytics() {
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from('complaints')
    .select('status, created_date, department_id, departments(department_name)');

  if (!complaints) return null;

  const statusCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  complaints.forEach((c: any) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const deptName = c.departments?.department_name || 'Unknown';
    deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;

    const month = new Date(c.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  const total = complaints.length;
  const resolved = statusCounts['Resolved'] || 0 + (statusCounts['Closed'] || 0);

  return {
    total_complaints: total,
    resolved_complaints: resolved,
    pending_complaints: (statusCounts['Submitted'] || 0) + (statusCounts['UnderReview'] || 0) + (statusCounts['InProgress'] || 0),
    escalated_complaints: statusCounts['Escalated'] || 0,
    resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    complaints_by_status: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    complaints_by_department: Object.entries(deptCounts).map(([department, count]) => ({ department, count })),
    monthly_trend: Object.entries(monthCounts).map(([month, count]) => ({ month, count })),
  };
}
