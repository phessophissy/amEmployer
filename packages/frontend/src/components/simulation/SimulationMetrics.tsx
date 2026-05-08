'use client';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
interface SimulationMetricsProps { tasksCompleted: number; payoutsTotal: number; activeWorkers: number; throughputPerMin: number; }
export function SimulationMetrics({ tasksCompleted, payoutsTotal, activeWorkers, throughputPerMin }: SimulationMetricsProps) {
  const metrics = [
    { label: 'Tasks Done', value: tasksCompleted, suffix: '', decimals: 0, color: 'text-emerald-400' },
    { label: 'cUSD Paid', value: payoutsTotal, suffix: '', decimals: 2, color: 'text-cyan-400' },
    { label: 'Active Workers', value: activeWorkers, suffix: '', decimals: 0, color: 'text-purple-400' },
    { label: 'Tasks/min', value: throughputPerMin, suffix: '', decimals: 1, color: 'text-yellow-400' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {metrics.map(m => (
        <div key={m.label} className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-3 text-center">
          <AnimatedCounter value={m.value} decimals={m.decimals} suffix={m.suffix} className={`text-xl font-bold font-mono ${m.color}`} />
          <p className="text-xs text-slate-500 mt-1">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
