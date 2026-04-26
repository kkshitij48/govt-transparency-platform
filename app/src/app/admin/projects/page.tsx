'use client';

import { useEffect, useState, useTransition } from 'react';
import { FolderOpen, Plus, Pencil, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { createProject, updateProject } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ProjectStatus } from '@/types';

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-yellow-100 text-yellow-700',
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
  OnHold: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [status, setStatus] = useState('Planning');
  const [deptId, setDeptId] = useState('');

  const load = async () => {
    const supabase = createClient();
    const [{ data: p }, { data: d }] = await Promise.all([
      supabase.from('projects').select('*, department:departments(department_name)').order('created_at', { ascending: false }),
      supabase.from('departments').select('department_id, department_name').order('department_name'),
    ]);
    setProjects(p || []);
    setDepartments(d || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleSubmit(formData: FormData) {
    formData.set('status', status);
    formData.set('department_id', deptId);
    startTransition(async () => {
      const result = editingProject
        ? await updateProject(editingProject.project_id, formData)
        : await createProject(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(editingProject ? 'Project updated' : 'Project created');
        setOpen(false);
        setEditingProject(null);
        load();
      }
    });
  }

  function openEdit(p: any) {
    setEditingProject(p);
    setStatus(p.status);
    setDeptId(p.department_id);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">{projects.length} projects</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditingProject(null); setStatus('Planning'); setDeptId(''); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1B3A6B] hover:bg-[#152e58]">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Project Name *</Label>
                <Input name="project_name" defaultValue={editingProject?.project_name} placeholder="Project name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Planning', 'Active', 'Completed', 'OnHold', 'Cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department *</Label>
                  <Select value={deptId} onValueChange={(v) => { if (v) setDeptId(v); }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date *</Label>
                  <Input name="start_date" type="date" defaultValue={editingProject?.start_date} required />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input name="end_date" type="date" defaultValue={editingProject?.end_date} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Budget ($)</Label>
                <Input name="budget" type="number" defaultValue={editingProject?.budget} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingProject?.description} rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingProject(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !deptId} className="bg-[#1B3A6B] hover:bg-[#152e58]">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(p => (
              <tr key={p.project_id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.project_name}</p>
                  {p.description && (
                    <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.department?.department_name}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${statusColors[p.status as ProjectStatus]}`} variant="secondary">
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {format(new Date(p.start_date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {p.budget ? `$${Number(p.budget).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#1B3A6B] hover:text-blue-700"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && projects.length === 0 && (
          <div className="py-16 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">No projects yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
