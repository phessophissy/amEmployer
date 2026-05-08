'use client';

interface LiveDotProps {
  active?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function LiveDot({ active = true, label, size = 'md' }: LiveDotProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
      {label && <span className={`font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'} ${active ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>}
    </span>
  );
}
