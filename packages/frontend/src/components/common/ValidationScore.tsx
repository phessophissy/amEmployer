'use client';
interface ValidationScoreProps { score: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg'; }
export function ValidationScore({ score, showLabel, size = 'md' }: ValidationScoreProps) {
  const pass = score >= 60;
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const bg = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';
  const sizes = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };
  return (
    <span className={"inline-flex items-center gap-1.5 font-mono font-bold rounded-full border " + bg + ' ' + sizes[size]}>
      <span className={color}>{score}%</span>
      {showLabel && <span className={"text-xs opacity-80 " + color}>{pass ? 'PASS' : 'FAIL'}</span>}
    </span>
  );
}
