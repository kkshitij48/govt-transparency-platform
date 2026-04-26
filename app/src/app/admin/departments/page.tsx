'use client';

import { useEffect, useState, useTransition } from 'react';
import { Building2, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { createDepartment, updateDepartment, deleteDepartment } from '@/lib/actions/admin';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('departments')
      .select('*, projects:projects(count), officials:profiles(count)')
      .order('department_name');
    setDepartments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = editingDept
        ? await updateDepartment(editingDept.department_id, formData)
        : await createDepartment(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(editingDept ? 'Department updated' : 'Department created');
        setOpen(false);
        setEditingDept(null);
        load();
      }
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete department "${name}"? This may affect related data.`)) return;
    startTransition(async () => {
      const result = await deleteDepartment(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Department deleted');
        load();
      }
    });
  }

  const departmentEmojis: Record<string, string> = {
    'Ministry of Finance': '💰',
    'Ministry of Health': '🏥',
    'Ministry of Education': '🎓',
    'Ministry of Infrastructure': '🏗️',
    'Ministry of Justice': '⚖️',
    'Ministry of Environment': '🌿',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="mt-1 text-sm text-slate-500">{departments.length} departments</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditingDept(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1B3A6B] hover:bg-[#152e58]">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Edit Department' : 'New Department'}</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="department_name">Department Name *</Label>
                <Input
                  id="department_name"
                  name="department_name"
                  defaultValue={editingDept?.department_name}
                  placeholder="e.g. Ministry of Transport"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingDept?.description}
                  placeholder="Brief description of the department's mandate..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingDept(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-[#1B3A6B] hover:bg-[#152e58]">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map(dept => (
          <Card key={dept.department_id} className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
                  {departmentEmojis[dept.department_name] || '🏛️'}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-[#1B3A6B]"
                    onClick={() => {
                      setEditingDept(dept);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                    onClick={() => handleDelete(dept.department_id, dept.department_name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{dept.department_name}</h3>
              {dept.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{dept.description}</p>
              )}
              <div className="mt-3 flex gap-4 text-xs text-slate-400">
                <span>{dept.projects?.[0]?.count || 0} projects</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && departments.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">No departments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
