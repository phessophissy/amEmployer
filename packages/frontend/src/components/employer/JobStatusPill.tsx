'use client';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  pending:   { label: 'Pending',   cls: 'border-cyan-500/30 bg-cyan-500/8 text-cyan-400',     dot: 'bg-cyan-400' },
  active:    { label: 'Active',    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400 neon-pulse' },
  completed: { label: 'Completed', cls: 'border-slate-500/30 bg-slate-500/8 text-slate-400',   dot: 'bg-slate-400' },
  failed:    { label: 'Failed',    cls: 'border-red-500/30 bg-red-500/8 text-red-400',          dot: 'bg-red-400' },
  paused:    { label: 'Paused',    cls: 'border-yellow-500/30 bg-yellow-500/8 text-yellow-400', dot: 'bg-yellow-400' },
};

export function JobStatusPill({ status }: { status: string }) {
  const key = status?.toLowerCase() ?? 'pending';
  const s = STATUS_MAP[key] ?? STATUS_MAP.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium', s.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}
