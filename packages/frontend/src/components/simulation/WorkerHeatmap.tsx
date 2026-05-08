'use client';
interface WorkerHeatmapProps { workers: { id: string; isActive: boolean; reputation: number; workerType: string }[]; }
const TYPE_COLORS: Record<string, string> = { human: 'bg-cyan-500', ai: 'bg-purple-500', scripted: 'bg-yellow-500' };
export function WorkerHeatmap({ workers }: WorkerHeatmapProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Worker Activity Grid</h3>
      <div className="flex flex-wrap gap-1">
        {workers.map(w => (
          <div key={w.id} title={`${w.workerType} · rep ${w.reputation}`}
            className={`w-3 h-3 rounded-sm transition-all duration-300 ${w.isActive ? TYPE_COLORS[w.workerType] || 'bg-slate-500' : 'bg-slate-800'}`}
            style={{ opacity: w.isActive ? 0.4 + (w.reputation / 100) * 0.6 : 0.3 }}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-xs text-slate-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
