'use client';
import { motion } from 'framer-motion';
import { JobStatusPill } from './JobStatusPill';
import { BudgetBar } from './BudgetBar';
import { timeAgo } from '@/lib/utils';

interface JobCardProps { id: string; title: string; description: string; status: string; totalBudget: number; taskCount: number; completedCount: number; createdAt: string; onClick?: () => void; }

export function JobCard({ title, description, status, totalBudget, taskCount, completedCount, createdAt, onClick }: JobCardProps) {
  const paidOut = (completedCount / Math.max(taskCount, 1)) * totalBudget;
  return (
    <motion.div whileTap={{ scale: 0.99 }} onClick={onClick}
      className="bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 rounded-xl p-4 cursor-pointer transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <JobStatusPill status={status} />
          <h3 className="text-sm font-semibold text-slate-200 mt-1.5 truncate">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-mono font-bold text-emerald-400">{totalBudget} cUSD</p>
          <p className="text-xs text-slate-600 mt-0.5">{completedCount}/{taskCount} tasks</p>
        </div>
      </div>
      <BudgetBar totalBudget={totalBudget} paidOut={paidOut} />
      <p className="text-xs text-slate-600 font-mono">{timeAgo(createdAt)}</p>
    </motion.div>
  );
}
