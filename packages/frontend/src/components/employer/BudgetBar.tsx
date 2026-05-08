'use client';

interface BudgetBarProps {
  totalBudget: number;
  paidOut: number;
}

export function BudgetBar({ totalBudget, paidOut }: BudgetBarProps) {
  const pct = totalBudget > 0 ? Math.min(100, (paidOut / totalBudget) * 100) : 0;
  const remaining = Math.max(0, totalBudget - paidOut);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono text-slate-500">
        <span>{paidOut.toFixed(2)} cUSD paid</span>
        <span>{remaining.toFixed(2)} remaining</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-600 font-mono text-right">{pct.toFixed(0)}% disbursed</p>
    </div>
  );
}
