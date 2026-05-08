'use client';
import { timeAgo, shortenAddress } from '@/lib/utils';
import { motion } from 'framer-motion';
interface Payment { id: string; amount: string; workerAddress: string; taskTitle: string; timestamp: string; txHash?: string; }
interface PaymentHistoryListProps { payments: Payment[]; }
export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  return (
    <div className="divide-y divide-slate-700/20">
      {payments.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
          className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-xs">↑</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">{p.taskTitle}</p>
              <p className="text-xs text-slate-500 font-mono">→ {shortenAddress(p.workerAddress)}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
            <p className="text-xs text-slate-600">{timeAgo(p.timestamp)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
