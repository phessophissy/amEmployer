'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, shortenAddress } from '@/lib/utils';
interface Payment { id?: string; amount: string; worker?: any; task?: any; taskId?: string; createdAt?: string; timestamp?: string; }
interface PaymentFeedProps { payments: Payment[]; }
export function PaymentFeed({ payments }: PaymentFeedProps) {
  return (
    <div className="divide-y divide-slate-700/10">
      <AnimatePresence initial={false}>
        {payments.slice(0, 10).map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-300 truncate">{p.task?.title || p.taskId || 'Payment'}</p>
                <p className="text-xs text-slate-600 font-mono">→ {shortenAddress(p.worker?.walletAddress || p.worker || '')}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
              <p className="text-xs text-slate-600">{timeAgo(p.createdAt || p.timestamp || '')}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
