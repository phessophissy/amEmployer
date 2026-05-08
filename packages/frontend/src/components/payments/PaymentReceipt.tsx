'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress, timeAgo } from '@/lib/utils';
interface PaymentReceiptProps {
  open: boolean;
  amount: string;
  workerAddress: string;
  taskTitle: string;
  txHash?: string;
  timestamp: string;
  onClose: () => void;
}
export function PaymentReceipt({ open, amount, workerAddress, taskTitle, txHash, timestamp, onClose }: PaymentReceiptProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-emerald-900/30 px-6 py-6 text-center border-b border-emerald-500/20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-2xl mx-auto mb-3">
                ✓
              </motion.div>
              <p className="text-xs font-mono text-emerald-400 mb-1">Payment Confirmed</p>
              <p className="text-3xl font-bold font-mono text-white">{parseFloat(amount).toFixed(4)}</p>
              <p className="text-emerald-400 font-mono text-sm">cUSD</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { label: 'Task', value: taskTitle },
                { label: 'To', value: shortenAddress(workerAddress) },
                { label: 'Time', value: timeAgo(timestamp) },
                ...(txHash ? [{ label: 'Tx Hash', value: `${txHash.slice(0,16)}…` }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs font-mono text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors">Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// payment module v4
