'use client';
interface CUSDFlowDiagramProps { deposited: number; escrow: number; paid: number; }
export function CUSDFlowDiagram({ deposited, escrow, paid }: CUSDFlowDiagramProps) {
  const remaining = Math.max(0, deposited - escrow - paid);
  const nodes = [
    { label: 'Deposited', value: deposited, color: 'border-emerald-500/40 text-emerald-400' },
    { label: 'In Escrow', value: escrow, color: 'border-yellow-500/40 text-yellow-400' },
    { label: 'Paid Out', value: paid, color: 'border-cyan-500/40 text-cyan-400' },
    { label: 'Available', value: remaining, color: 'border-purple-500/40 text-purple-400' },
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-2">
          <div className={`px-4 py-3 rounded-xl border text-center min-w-[90px] ${n.color.split(' ')[0]} bg-slate-900/70`}>
            <p className={`text-lg font-mono font-bold ${n.color.split(' ')[1]}`}>{n.value.toFixed(1)}</p>
            <p className="text-xs text-slate-500">{n.label}</p>
          </div>
          {i < nodes.length - 1 && <span className="text-slate-600 text-sm">→</span>}
        </div>
      ))}
    </div>
  );
}
