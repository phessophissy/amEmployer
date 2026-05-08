'use client';
interface ReputationGaugeProps { score: number; size?: number; }
export function ReputationGauge({ score, size = 80 }: ReputationGaugeProps) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#1e293b" strokeWidth="5" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}
