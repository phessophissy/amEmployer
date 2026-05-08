'use client';
type Status = 'online' | 'offline' | 'busy' | 'idle';
const STATUS_CONFIG: Record<Status, { color: string; pulse: boolean; label: string }> = {
  online: { color: 'bg-emerald-400', pulse: true, label: 'Online' },
  offline: { color: 'bg-slate-600', pulse: false, label: 'Offline' },
  busy: { color: 'bg-yellow-400', pulse: true, label: 'Busy' },
  idle: { color: 'bg-slate-400', pulse: false, label: 'Idle' },
};
interface StatusDotProps { status: Status; showLabel?: boolean; size?: 'sm' | 'md'; }
export function StatusDot({ status, showLabel, size = 'sm' }: StatusDotProps) {
  const c = STATUS_CONFIG[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${c.color} ${c.pulse ? 'animate-pulse' : ''}`} />
      {showLabel && <span className="text-xs text-slate-400">{c.label}</span>}
    </span>
  );
}
