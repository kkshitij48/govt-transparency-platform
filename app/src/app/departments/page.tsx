import Link from 'next/link';
import { Building2, ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';

export const metadata = { title: 'Departments' };

const departmentIcons: Record<string, string> = {
  'Ministry of Finance': '💰',
  'Ministry of Health': '🏥',
  'Ministry of Education': '🎓',
  'Ministry of Infrastructure': '🏗️',
  'Ministry of Justice': '⚖️',
  'Ministry of Environment': '🌿',
};

export default async function DepartmentsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: departments } = await supabase
    .from('departments')
    .select('*, projects:projects(count), complaints:complaints(count)')
    .order('department_name');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/" className="hover:text-[#1B3A6B]">Home</Link>
            <span>/</span>
            <span>Departments</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Government Departments</h1>
          <p className="mt-2 text-slate-500">
            Browse all government departments and their public projects
          </p>
        </div>

        {/* Departments grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map(dept => (
            <Card key={dept.department_id} className="group border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {departmentIcons[dept.department_name] || '🏛️'}
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                    Active
                  </Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{dept.department_name}</h3>
                {dept.description && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{dept.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FolderIcon className="h-3.5 w-3.5" />
                    {dept.projects?.[0]?.count || 0} projects
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {dept.complaints?.[0]?.count || 0} complaints
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                    <Link href={`/projects?dept=${dept.department_id}`}>
                      View Projects
                    </Link>
                  </Button>
                  {user?.role === 'Citizen' && (
                    <Button size="sm" asChild className="flex-1 bg-[#1B3A6B] text-xs hover:bg-[#152e58]">
                      <Link href={`/citizen/complaints/new?dept=${dept.department_id}`}>
                        File Complaint
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!departments || departments.length === 0) && (
          <div className="py-20 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">No departments found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
