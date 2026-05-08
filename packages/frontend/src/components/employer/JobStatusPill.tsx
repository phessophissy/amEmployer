'use client';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; class: string; dot: string }> = {
  pending: { label: 'Pending', class: 'border-slate-500/40 bg-slate-500/10 text-slate-400', dot: 'bg-slate-400' },
  active: { label: 'Active', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  completed: { label: 'Completed', class: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400', dot: 'bg-cyan-400' },
  failed: { label: 'Failed', class: 'border-red-500/40 bg-red-500/10 text-red-400', dot: 'bg-red-400' },
  paused: { label: 'Paused', class: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-400' },
};

export function JobStatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium', s.class)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
