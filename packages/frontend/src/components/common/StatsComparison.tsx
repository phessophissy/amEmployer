'use client';
interface StatDelta { label: string; current: number; previous: number; unit?: string; }
interface StatsComparisonProps { stats: StatDelta[]; }
export function StatsComparison({ stats }: StatsComparisonProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(s => {
        const delta = s.current - s.previous;
        const pct = s.previous > 0 ? Math.round((delta/s.previous)*100) : 0;
        const up = delta >= 0;
        return (
          <div key={s.label} className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold font-mono text-slate-200">{s.current}{s.unit || ''}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={"text-xs font-mono font-bold " + (up ? 'text-emerald-400' : 'text-red-400')}>{up ? '↑' : '↓'} {Math.abs(pct)}%</span>
              <span className="text-xs text-slate-600">vs prev</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
