'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { JobStatusPill } from './JobStatusPill';
import { BudgetBar } from './BudgetBar';
import { TaskCountBadges } from './TaskCountBadges';
import { timeAgo } from '@/lib/utils';

interface Job { id: string; title: string; description: string; status: string; totalBudget: number; taskCount: number; completedCount: number; createdAt: string; }
interface JobDetailDrawerProps { job: Job | null; onClose: () => void; }

export function JobDetailDrawer({ job, onClose }: JobDetailDrawerProps) {
  return (
    <AnimatePresence>
      {job && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-700/40 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <JobStatusPill status={job.status} />
                <span className="text-xs text-slate-500 font-mono">{timeAgo(job.createdAt)}</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{job.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-emerald-400">{job.totalBudget}</div>
                  <div className="text-xs text-slate-500">cUSD Budget</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-cyan-400">{job.taskCount}</div>
                  <div className="text-xs text-slate-500">Total Tasks</div>
                </div>
              </div>
              <BudgetBar totalBudget={job.totalBudget} paidOut={(job.completedCount / Math.max(job.taskCount, 1)) * job.totalBudget} />
              <TaskCountBadges open={job.taskCount - job.completedCount} assigned={0} submitted={0} paid={job.completedCount} />
              <div className="bg-black/40 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-xs font-mono text-emerald-400 mb-1">Job ID</p>
                <p className="text-xs font-mono text-slate-500 break-all">{job.id}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
