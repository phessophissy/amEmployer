'use client';
import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  variant?: 'emerald' | 'cyan' | 'purple' | 'yellow' | 'red' | 'slate';
  dot?: boolean;
  pulse?: boolean;
}

const variants: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const dotColors: Record<string, string> = {
  emerald: 'bg-emerald-400', cyan: 'bg-cyan-400', purple: 'bg-purple-400',
  yellow: 'bg-yellow-400', red: 'bg-red-400', slate: 'bg-slate-400',
};

export function Badge({ label, variant = 'slate', dot, pulse }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-medium', variants[variant])}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant], pulse && 'animate-pulse')} />}
      {label}
    </span>
  );
}
