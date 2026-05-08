'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidationScore } from '@/components/common/ValidationScore';
import { timeAgo } from '@/lib/utils';
interface TaskDetailsModalProps { task: any; onClose: () => void; }
export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  if (!task) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30 }}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
            <h3 className="font-semibold text-slate-200 truncate flex-1 mr-3">{task.title}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 flex-shrink-0">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
            <div className="flex items-center gap-3">
              {task.validationScore !== undefined && <ValidationScore score={task.validationScore} showLabel />}
              <span className="text-sm font-mono font-bold text-emerald-400">{parseFloat(task.reward||'0').toFixed(4)} cUSD</span>
            </div>
            <p className="text-xs text-slate-600 font-mono">{timeAgo(task.createdAt)}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
