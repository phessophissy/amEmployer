'use client';
interface Stage { label: string; count: number; color: string; }
interface TaskPipelineVizProps { stages: Stage[]; }
export function TaskPipelineViz({ stages }: TaskPipelineVizProps) {
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Pipeline</h3>
      <div className="flex items-end justify-around gap-2 h-24">
        {stages.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-xs font-mono font-bold ${s.color}`}>{s.count}</span>
            <div className="w-full flex items-end" style={{ height: '64px' }}>
              <div className={`w-full ${s.color.replace('text-', 'bg-').replace('-400','-500')} rounded-t transition-all duration-500 opacity-70`}
                style={{ height: `${(s.count / max) * 64}px`, minHeight: s.count > 0 ? '4px' : '0' }} />
            </div>
            <span className="text-[9px] text-slate-600 font-mono">{s.label}</span>
            {i < stages.length - 1 && <span className="absolute text-slate-600 text-xs pointer-events-none" style={{ marginLeft: '100%', marginTop: '-32px' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
