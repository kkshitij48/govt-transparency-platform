import { format } from 'date-fns';
import { STATUS_CONFIG } from '@/lib/complaint-workflow';
import type { ComplaintTimeline, ComplaintStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ComplaintTimelineProps {
  timeline: ComplaintTimeline[];
}

export function ComplaintTimelineView({ timeline }: ComplaintTimelineProps) {
  const sorted = [...timeline].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
      <ul className="space-y-6">
        {sorted.map((entry, idx) => {
          const config = STATUS_CONFIG[entry.status as ComplaintStatus];
          const isLast = idx === sorted.length - 1;
          return (
            <li key={entry.id} className="relative pl-10">
              {/* Dot */}
              <div
                className={cn(
                  'absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm',
                  config?.bgColor || 'bg-slate-100',
                  config?.borderColor || 'border-slate-300',
                  isLast ? 'ring-2 ring-blue-200 ring-offset-2' : ''
                )}
              >
                {config?.icon || '📋'}
              </div>

              {/* Content */}
              <div className={cn(
                'rounded-lg border p-3',
                isLast ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn(
                      'text-sm font-semibold',
                      config?.color || 'text-slate-700'
                    )}>
                      {config?.label || entry.status}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-sm text-slate-600">{entry.note}</p>
                    )}
                    {entry.actor && (
                      <p className="mt-1 text-xs text-slate-400">
                        by {entry.actor.name} ({entry.actor.role})
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                  </time>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
