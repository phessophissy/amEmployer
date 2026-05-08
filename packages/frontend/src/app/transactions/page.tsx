'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/common/SectionHeader';
import { timeAgo, shortenAddress } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
export default function TransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    api.stats.platform().then(r => {
      const p = r.data?.payments?.recent || [];
      setPayments(p);
      setTotal(parseFloat(r.data?.payments?.totalAmount || '0'));
    }).finally(() => setLoading(false));
  }, []);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <SectionHeader title="Transaction History" subtitle={`${total.toFixed(2)} cUSD total disbursed on Celo`} />
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden divide-y divide-slate-700/20">
          {payments.length === 0 ? (
            <p className="text-center py-12 text-slate-600">No transactions yet.</p>
          ) : payments.map((p: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs font-bold">↑</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{p.task?.title || 'Task Payment'}</p>
                  <p className="text-xs text-slate-500 font-mono">→ {shortenAddress(p.worker?.walletAddress || p.worker || '')}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
                <p className="text-xs text-slate-600">{timeAgo(p.createdAt || p.timestamp || '')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
