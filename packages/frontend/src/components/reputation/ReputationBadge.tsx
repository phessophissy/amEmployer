'use client';
interface ReputationBadgeProps { score: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg'; }
function tier(score: number) {
  if (score >= 90) return { label: 'Elite', color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10', icon: '⭐' };
  if (score >= 75) return { label: 'Expert', color: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10', icon: '💎' };
  if (score >= 50) return { label: 'Skilled', color: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10', icon: '🔷' };
  if (score >= 25) return { label: 'Novice', color: 'text-slate-400 border-slate-500/40 bg-slate-500/10', icon: '🔹' };
  return { label: 'Rookie', color: 'text-red-400 border-red-400/40 bg-red-400/10', icon: '🔸' };
}
export function ReputationBadge({ score, showLabel, size = 'md' }: ReputationBadgeProps) {
  const t = tier(score);
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-mono font-semibold ${t.color} ${pad}`}>
      <span>{t.icon}</span>
      {showLabel && <span>{t.label}</span>}
      <span>{score}</span>
    </span>
  );
}
// reputation system iteration 5
