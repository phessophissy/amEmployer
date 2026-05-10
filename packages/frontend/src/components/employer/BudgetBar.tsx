'use client';

interface BudgetBarProps {
  totalBudget: number;
  paidOut: number;
  showLabels?: boolean;
}

export function BudgetBar({ totalBudget, paidOut, showLabels = true }: BudgetBarProps) {
  const pct = totalBudget > 0 ? Math.min(100, (paidOut / totalBudget) * 100) : 0;
  const remaining = Math.max(0, totalBudget - paidOut);
  const fillColor =
    pct >= 100
      ? 'linear-gradient(90deg, #10b981, #06b6d4)'
      : pct >= 50
      ? 'linear-gradient(90deg, #10b981, #34d399)'
      : 'linear-gradient(90deg, #6366f1, #10b981)';
  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span className="text-emerald-400/80">{paidOut.toFixed(2)} cUSD paid</span>
          <span>{remaining.toFixed(2)} remaining</span>
        </div>
      )}
      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      {showLabels && (
        <p className="text-[10px] text-slate-600 font-mono text-right">{pct.toFixed(0)}% disbursed</p>
      )}
    </div>
  );
}
