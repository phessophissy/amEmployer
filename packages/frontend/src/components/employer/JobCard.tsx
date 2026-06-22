'use client';
import { motion } from 'framer-motion';
import { JobStatusPill } from './JobStatusPill';
import { BudgetBar } from './BudgetBar';
import { cn, timeAgo } from '@/lib/utils';

interface JobCardProps { id: string; title: string; description: string; status: string; totalBudget: number; taskCount: number; completedCount: number; createdAt: string; onClick?: () => void; index?: number; }

const STATUS_DOT: Record<string, string> = {
  PENDING:   'bg-cyan-400',
  ACTIVE:    'bg-emerald-400 neon-pulse',
  COMPLETED: 'bg-emerald-500',
  FAILED:    'bg-red-400',
};

/** SVG arc progress ring */
function ProgressRing({ pct }: { pct: number }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" aria-label={`${pct}% complete`}>
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(51,65,85,0.7)" strokeWidth={3} />
      <circle
        cx={20} cy={20} r={r} fill="none"
        stroke="#10b981" strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={20} y={21} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fill="#94a3b8" fontFamily="monospace">{pct}%</text>
    </svg>
  );
}

export function JobCard({ title, description, status, totalBudget, taskCount, completedCount, createdAt, onClick, index = 0 }: JobCardProps) {
  const pct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const paidOut = (completedCount / Math.max(taskCount, 1)) * totalBudget;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        'group bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-neon-md space-y-3',
        status === 'ACTIVE' && 'hover-glow-green',
        status === 'PENDING' && 'hover-glow-cyan',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[status] || 'bg-slate-600')} />
            <JobStatusPill status={status} />
            <span className="text-[10px] text-slate-600 font-mono">{timeAgo(createdAt)}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-200 truncate leading-snug">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{description}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <p className="text-sm font-mono font-bold text-emerald-400">{totalBudget} cUSD</p>
          {taskCount > 0 && <ProgressRing pct={pct} />}
        </div>
      </div>
      <BudgetBar totalBudget={totalBudget} paidOut={paidOut} />
      <p className="text-[10px] text-slate-600 font-mono">{completedCount}/{taskCount} tasks completed</p>
    </motion.div>
  );
}
