'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'emerald' | 'cyan' | 'purple' | 'yellow';
  height?: string;
}

const barColors = {
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
};

export function ProgressBar({ value, max = 100, label, showPercent, color = 'emerald', height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showPercent && <span className="text-xs font-mono text-slate-400">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-slate-800 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColors[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
