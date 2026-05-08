'use client';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
interface QuickStatsProps { totalJobs: number; activeJobs: number; totalTasks: number; totalPaid: number; }
export function QuickStats({ totalJobs, activeJobs, totalTasks, totalPaid }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Jobs', value: totalJobs, color: 'text-slate-200', decimals: 0 },
        { label: 'Active', value: activeJobs, color: 'text-emerald-400', decimals: 0 },
        { label: 'Tasks', value: totalTasks, color: 'text-cyan-400', decimals: 0 },
        { label: 'Paid (cUSD)', value: totalPaid, color: 'text-yellow-400', decimals: 2 },
      ].map(s => (
        <div key={s.label} className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 text-center">
          <AnimatedCounter value={s.value} decimals={s.decimals} className={`text-xl font-bold font-mono ${s.color}`} />
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
