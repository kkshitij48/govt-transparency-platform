'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const departmentSchema = z.object({
  department_name: z.string().min(3, 'Department name must be at least 3 characters').max(200),
  description: z.string().optional(),
});

const projectSchema = z.object({
  project_name: z.string().min(3).max(500),
  status: z.enum(['Planning', 'Active', 'Completed', 'OnHold', 'Cancelled']),
  start_date: z.string(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  budget: z.coerce.number().optional(),
  department_id: z.string().uuid(),
});

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const raw = {
    department_name: formData.get('department_name') as string,
    description: formData.get('description') as string || undefined,
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('departments').insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath('/admin/departments');
  return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
  const supabase = await createClient();

  const raw = {
    department_name: formData.get('department_name') as string,
    description: formData.get('description') as string || undefined,
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('departments')
    .update(parsed.data)
    .eq('department_id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/departments');
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('departments').delete().eq('department_id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/departments');
  return { success: true };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const raw = {
    project_name: formData.get('project_name') as string,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string || undefined,
    description: formData.get('description') as string || undefined,
    budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
    department_id: formData.get('department_id') as string,
  };

  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('projects').insert({
    ...parsed.data,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  return { success: true };
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();

  const raw = {
    project_name: formData.get('project_name') as string,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string || undefined,
    description: formData.get('description') as string || undefined,
    budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
    department_id: formData.get('department_id') as string,
  };

  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('project_id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  return { success: true };
}

export async function updateUserRole(userId: string, role: string, department_id?: string) {
  const supabase = await createClient();

  // Always write department_id — pass null to clear it
  const updateData: Record<string, unknown> = {
    role,
    department_id: department_id || null,
  };

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { success: true };
}
