'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmployerSubNav } from '@/components/common/EmployerSubNav';
import { CardSkeleton } from '@/components/ui/Skeleton';

function countByType(workers: any[]) {
  const counts = { HUMAN: 0, SCRIPTED: 0, AI_AGENT: 0 };
  for (const w of workers) {
    const t = w.workerType as keyof typeof counts;
    if (counts[t] !== undefined) counts[t]++;
  }
  return counts;
}

export default function EmployerAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.stats.platform(),
      api.workers.list({ limit: '200' }),
      api.stats.activity().catch(() => ({ data: [] })),
    ])
      .then(([statsRes, workersRes, activityRes]) => {
        setStats(statsRes.data);
        setWorkers(workersRes.data || []);
        setActivity(activityRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <EmployerSubNav />
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const completionRate =
    stats?.tasks?.total > 0 ? Math.round((stats.tasks.paid / stats.tasks.total) * 100) : 0;
  const typeCounts = countByType(workers);
  const workerMix = [
    { label: 'Human Workers', value: typeCounts.HUMAN, color: 'text-cyan-400' },
    { label: 'AI Agents', value: typeCounts.AI_AGENT, color: 'text-purple-400' },
    { label: 'Scripted Bots', value: typeCounts.SCRIPTED, color: 'text-yellow-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-6">
      <EmployerSubNav />
      <SectionHeader title="Analytics" subtitle="Job and payment performance metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-emerald-400' },
          { label: 'Total Jobs', value: stats?.jobs?.total || 0, color: 'text-purple-400' },
          { label: 'Active Workers', value: stats?.workers?.active || 0, color: 'text-yellow-400' },
          { label: 'Tasks Paid', value: stats?.tasks?.paid || 0, color: 'text-cyan-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`text-xl font-bold font-mono ${s.color}`}>
              {s.value}
            </motion.div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</motion.div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Status Breakdown</h3>
          {[
            { label: 'Open', count: stats?.tasks?.open, color: 'bg-blue-500' },
            { label: 'Assigned', count: stats?.tasks?.assigned, color: 'bg-yellow-500' },
            { label: 'Submitted', count: stats?.tasks?.submitted, color: 'bg-purple-500' },
            { label: 'Paid', count: stats?.tasks?.paid, color: 'bg-emerald-500' },
          ].map((s) => (
            <div key={s.label} className="mb-3">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{s.label}</span>
                <span className="font-mono text-slate-300">{s.count || 0}</span>
              </motion.div>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="h-1.5 bg-slate-800 rounded-full overflow-hidden origin-left">
                <div
                  className={`h-full ${s.color} rounded-full`}
                  style={{
                    width: `${stats?.tasks?.total > 0 ? ((s.count || 0) / stats.tasks.total) * 100 : 0}%`,
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Worker Distribution</h3>
          <div className="space-y-3">
            {workerMix.map((w) => (
              <motion.div key={w.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{w.label}</span>
                <span className={`text-sm font-bold font-mono ${w.color}`}>{w.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      {activity.length > 0 && (
        <div className="mt-6 bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Platform Activity</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            {activity.slice(0, 8).map((item: any, i: number) => (
              <li key={i} className="font-mono truncate">
                {item.type || item.message || JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
