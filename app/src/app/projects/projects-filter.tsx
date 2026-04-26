'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import type { ProjectStatus } from '@/types';

const STATUS_FILTERS = [
  { label: 'All',       value: 'All' },
  { label: 'Active',    value: 'Active' },
  { label: 'Planning',  value: 'Planning' },
  { label: 'On Hold',   value: 'OnHold' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const statusBadge: Record<string, string> = {
  Planning:  'bg-amber-50 text-amber-700 border border-amber-200',
  Active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Completed: 'bg-[#EFF6FF] text-[#1B3A6B] border border-blue-200',
  OnHold:    'bg-orange-50 text-orange-700 border border-orange-200',
  Cancelled: 'bg-red-50 text-red-600 border border-red-200',
};

const statusDot: Record<string, string> = {
  Planning:  'bg-amber-400',
  Active:    'bg-emerald-500',
  Completed: 'bg-[#1B3A6B]',
  OnHold:    'bg-orange-400',
  Cancelled: 'bg-red-400',
};

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  department?: { department_name: string };
}

export function ProjectsFilter({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  return (
    <>
      {/* Pill filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f.value
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
            }`}
          >
            {f.label}
            {f.value !== 'All' && (
              <span className="ml-1.5 opacity-60">
                {projects.filter(p => p.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No projects with status <strong>{filter}</strong>.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Project</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Department</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Start Date</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">End Date</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Budget</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((project, idx) => (
                  <tr
                    key={project.project_id}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <td className="px-5 py-4 max-w-[260px]">
                      <p className="font-medium text-[#1A1A2E] truncate">{project.project_name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{project.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                        <Building2 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        {project.department?.department_name ?? '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[project.status] ?? ''}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status] ?? 'bg-gray-400'}`} />
                        {project.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {project.start_date ? format(new Date(project.start_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {project.end_date ? format(new Date(project.end_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {project.budget ? (
                        <span className="flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {Number(project.budget).toLocaleString('en-IN')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/projects/${project.project_id}`}
                        className="text-xs font-semibold text-[#1B3A6B] hover:underline whitespace-nowrap"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
