'use client';
interface DataPoint { label: string; value: number; }
interface TreasuryChartProps { data: DataPoint[]; title: string; color?: string; }
export function TreasuryChart({ data, title, color = 'emerald' }: TreasuryChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const colorMap: Record<string, string> = { emerald: 'bg-emerald-500', cyan: 'bg-cyan-500', purple: 'bg-purple-500' };
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-end" style={{ height: '96px' }}>
              <div
                className={`w-full ${colorMap[color] || 'bg-emerald-500'} rounded-t-sm transition-all duration-700 opacity-80 hover:opacity-100`}
                style={{ height: `${(d.value / max) * 96}px` }}
                title={`${d.label}: ${d.value.toFixed(2)}`}
              />
            </div>
            <span className="text-[9px] text-slate-600 font-mono truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
