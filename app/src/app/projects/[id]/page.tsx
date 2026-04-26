import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, DollarSign, Building2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/navbar';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { format } from 'date-fns';
import type { ProjectStatus } from '@/types';

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-yellow-100 text-yellow-700',
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
  OnHold: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: project } = await supabase
    .from('projects')
    .select('*, department:departments(*)')
    .eq('project_id', id)
    .single();

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-slate-900">{project.project_name}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {project.department?.department_name}
                    </p>
                  </div>
                  <Badge className={`shrink-0 ${statusColors[project.status as ProjectStatus]}`} variant="secondary">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                {project.description ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Project Description</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No description provided</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Project Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Department</p>
                      <p className="text-sm font-medium text-slate-700">
                        {project.department?.department_name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Start Date</p>
                      <p className="text-sm font-medium text-slate-700">
                        {format(new Date(project.start_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {project.end_date && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">End Date</p>
                          <p className="text-sm font-medium text-slate-700">
                            {format(new Date(project.end_date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {project.budget && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Allocated Budget</p>
                          <p className="text-sm font-medium text-slate-700">
                            ${Number(project.budget).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
