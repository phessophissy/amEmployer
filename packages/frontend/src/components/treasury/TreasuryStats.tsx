'use client';
import { motion } from 'framer-motion';
interface TreasuryStatsProps {
  totalDeposited: string;
  totalPaidOut: string;
  pendingEscrow: string;
  reserveBalance: string;
}
export function TreasuryStats({ totalDeposited, totalPaidOut, pendingEscrow, reserveBalance }: TreasuryStatsProps) {
  const stats = [
    { label: 'Total Deposited', value: totalDeposited, color: 'text-emerald-400', prefix: '' },
    { label: 'Paid Out', value: totalPaidOut, color: 'text-cyan-400', prefix: '' },
    { label: 'In Escrow', value: pendingEscrow, color: 'text-yellow-400', prefix: '' },
    { label: 'Reserve', value: reserveBalance, color: 'text-purple-400', prefix: '' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4">
          <div className={`text-xl sm:text-2xl font-bold font-mono ${s.color}`}>{s.prefix}{parseFloat(s.value || '0').toFixed(2)} cUSD</div>
          <div className="text-xs text-slate-500 mt-1">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
