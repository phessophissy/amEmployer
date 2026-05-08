'use client';
interface EscrowCardProps { jobTitle: string; amount: string; workerCount: number; daysRemaining?: number; }
export function EscrowCard({ jobTitle, amount, workerCount, daysRemaining }: EscrowCardProps) {
  return (
    <div className="flex items-center justify-between bg-slate-900/50 border border-yellow-500/20 rounded-xl px-4 py-3 gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-200 truncate font-medium">{jobTitle}</p>
        <p className="text-xs text-slate-500 mt-0.5">{workerCount} workers · {daysRemaining !== undefined ? `${daysRemaining}d remaining` : 'active'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-mono font-bold text-yellow-400">{parseFloat(amount).toFixed(2)} cUSD</p>
        <p className="text-xs text-slate-600">escrow</p>
      </div>
    </div>
  );
}
