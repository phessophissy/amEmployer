'use client';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
interface PaymentSummaryCardProps { totalPaid: number; recentCount: number; avgAmount: number; }
export function PaymentSummaryCard({ totalPaid, recentCount, avgAmount }: PaymentSummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/20 border border-emerald-500/20 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-emerald-400 mb-1">Total Disbursed</p>
          <AnimatedCounter value={totalPaid} decimals={2} suffix=" cUSD" className="text-2xl font-bold font-mono text-white" />
        </div>
        <span className="text-2xl">💸</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-500/10">
        <div>
          <p className="text-xs text-slate-500">Payments</p>
          <AnimatedCounter value={recentCount} className="text-lg font-bold font-mono text-cyan-400" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg Payment</p>
          <AnimatedCounter value={avgAmount} decimals={3} suffix=" cUSD" className="text-lg font-bold font-mono text-purple-400" />
        </div>
      </div>
    </div>
  );
}
