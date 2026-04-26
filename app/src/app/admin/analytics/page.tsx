import { BarChart3, TrendingUp, Users, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/server';
import { STATUS_CONFIG } from '@/lib/complaint-workflow';
import type { ComplaintStatus } from '@/types';

export const metadata = { title: 'Analytics' };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    { data: complaints },
    { data: departments },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('complaints').select('status, created_date, department_id, department:departments(department_name)'),
    supabase.from('departments').select('department_id, department_name'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  complaints?.forEach((c: any) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  // Department breakdown
  const deptCounts: Record<string, number> = {};
  complaints?.forEach((c: any) => {
    const name = c.department?.department_name || 'Unknown';
    deptCounts[name] = (deptCounts[name] || 0) + 1;
  });

  const total = complaints?.length || 0;
  const resolved = (statusCounts['Resolved'] || 0) + (statusCounts['Closed'] || 0);
  const escalated = statusCounts['Escalated'] || 0;
  const pending = (statusCounts['Submitted'] || 0) + (statusCounts['UnderReview'] || 0);

  const sortedDepts = Object.entries(deptCounts).sort(([, a], [, b]) => b - a);
  const maxDeptCount = sortedDepts[0]?.[1] || 1;

  const statusOrder: ComplaintStatus[] = [
    'Submitted', 'UnderReview', 'PendingInfo', 'InProgress',
    'Escalated', 'Resolved', 'Reopened', 'Rejected', 'Closed'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Transparency Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time insights into complaint resolution and government accountability metrics
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Complaints</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <FileText className="h-5 w-5 text-[#1B3A6B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Resolution Rate</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                </p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Progress
              value={total > 0 ? (resolved / total) * 100 : 0}
              className="mt-3 h-1.5"
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Escalated</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{escalated}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{totalUsers || 0}</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusOrder.map(status => {
              const count = statusCounts[status] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const config = STATUS_CONFIG[status];
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{config.label}</span>
                      <span className="text-xs font-bold text-slate-900">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full ${config.bgColor.replace('bg-', 'bg-').replace('-50', '-400')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Department breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Complaints by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedDepts.map(([dept, count]) => {
              const pct = (count / maxDeptCount) * 100;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{dept}</span>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedDepts.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transparency score */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#1B3A6B]" />
            Transparency Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Resolution Rate',
                score: total > 0 ? Math.round((resolved / total) * 100) : 0,
                target: 80,
                color: 'text-green-600',
                bg: 'bg-green-500',
              },
              {
                label: 'Escalation Rate',
                score: total > 0 ? Math.round((escalated / total) * 100) : 0,
                target: 10,
                color: 'text-red-600',
                bg: 'bg-red-500',
                inverse: true,
              },
              {
                label: 'Pending Backlog',
                score: total > 0 ? Math.round((pending / total) * 100) : 0,
                target: 20,
                color: 'text-yellow-600',
                bg: 'bg-yellow-500',
                inverse: true,
              },
            ].map(metric => (
              <div key={metric.label} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">{metric.label}</p>
                <p className={`mt-2 text-3xl font-bold ${metric.color}`}>{metric.score}%</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${metric.bg}`}
                    style={{ width: `${Math.min(metric.score, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Target: {metric.inverse ? '≤' : '≥'}{metric.target}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
