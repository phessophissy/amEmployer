'use client';
import { motion } from 'framer-motion';
import { cn, STATUS_COLORS, timeAgo } from '@/lib/utils';

interface Task { id: string; title: string; status: string; reward: string; assignedWorker?: string; validationScore?: number; createdAt: string; }
interface TaskListProps { tasks: Task[]; compact?: boolean; }

export function TaskList({ tasks, compact }: TaskListProps) {
  if (tasks.length === 0) return <p className="text-slate-600 text-sm py-6 text-center">No tasks found.</p>;
  return (
    <div className="divide-y divide-slate-700/20">
      {tasks.map((task, i) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between py-3 gap-3 hover:bg-slate-800/20 px-1 rounded-lg transition-colors">
          <div className="min-w-0 flex-1">
            <p className={cn('text-slate-200 truncate', compact ? 'text-xs' : 'text-sm')}>{task.title}</p>
            {!compact && <p className="text-xs text-slate-600 mt-0.5">{timeAgo(task.createdAt)}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.validationScore !== undefined && (
              <span className={`text-xs font-mono ${task.validationScore >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{task.validationScore}%</span>
            )}
            <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[task.status])}>{task.status}</span>
            <span className="text-xs font-mono text-emerald-400">{parseFloat(task.reward).toFixed(3)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
