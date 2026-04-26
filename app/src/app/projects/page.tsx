import Link from 'next/link';
import { FolderOpen, Terminal } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { ProjectsFilter } from './projects-filter';

export const metadata = { title: 'Public Projects' };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, department:departments(department_name)')
    .order('created_at', { ascending: false });

  const list = projects ?? [];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar user={user} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-[#1B3A6B] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600">Projects</span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Public Registry</p>
              <h1 className="font-heading text-3xl font-bold text-[#1A1A2E]">Government Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                Transparent view of all active and completed government initiatives
              </p>
            </div>
            {list.length > 0 && (
              <p className="text-xs text-gray-400 shrink-0">
                {list.length} project{list.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
        </div>

        {/* Empty state */}
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-gray-300 mb-4" />
            <p className="text-sm font-semibold text-gray-500 mb-1">No projects found</p>
            <p className="text-xs text-gray-400 mb-6">
              Projects are created by admins. Run the seed script to populate example data.
            </p>
            <div className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-left max-w-md">
              <Terminal className="h-4 w-4 text-gray-400 shrink-0" />
              <code className="text-xs text-gray-600 font-mono">
                Run <span className="font-bold text-[#1B3A6B]">seed.sql</span> in your Supabase SQL Editor to load sample projects
              </code>
            </div>
          </div>
        ) : (
          /* Filter pills + table — client component receives full data snapshot */
          <ProjectsFilter projects={list} />
        )}
      </div>
    </div>
  );
}
