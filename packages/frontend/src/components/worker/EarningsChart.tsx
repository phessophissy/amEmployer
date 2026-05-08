'use client';
interface EarningsChartProps { data: number[]; label?: string; }
export function EarningsChart({ data, label }: EarningsChartProps) {
  const max = Math.max(...data, 1);
  const pts = data.map((v,i) => `${(i/(data.length-1))*100},${100-(v/max)*100}`).join(' ');
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      {label && <p className="text-xs font-mono text-slate-500 mb-3">{label}</p>}
      <svg viewBox="0 0 100 60" className="w-full h-14" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points={`0,100 ${pts} 100,100`} fill="rgba(16,185,129,0.06)" stroke="none" />
      </svg>
      <div className="flex justify-between text-xs font-mono text-slate-600 mt-1">
        <span>0</span><span>${Math.max(...data).toFixed(2)} cUSD</span>
      </div>
    </div>
  );
}
