'use client';
interface HistoryPoint { date: string; score: number; delta: number; reason: string; }
interface ReputationHistoryProps { history: HistoryPoint[]; }
export function ReputationHistory({ history }: ReputationHistoryProps) {
  return (
    <div className="space-y-2">
      {history.map((h, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0 gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-300">{h.reason}</p>
            <p className="text-xs text-slate-600 font-mono mt-0.5">{h.date}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-mono font-bold ${h.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.delta >= 0 ? '+' : ''}{h.delta}</span>
            <span className="text-xs font-mono text-slate-400">{h.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
