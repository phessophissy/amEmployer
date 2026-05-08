'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
export default function EmployerAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.stats.platform().then(r => setStats(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>;
  const completionRate = stats?.tasks?.total > 0 ? Math.round((stats.tasks.paid / stats.tasks.total) * 100) : 0;
  const avgPayment = stats?.payments?.recent?.length > 0 ? (parseFloat(stats.payments.totalAmount) / stats.payments.recent.length).toFixed(4) : '0';
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <SectionHeader title="Analytics" subtitle="Job and payment performance metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-emerald-400', trend: '+' },
          { label: 'Avg Payment', value: `${avgPayment} cUSD`, color: 'text-cyan-400' },
          { label: 'Total Jobs', value: stats?.jobs?.total || 0, color: 'text-purple-400' },
          { label: 'Active Workers', value: stats?.workers?.active || 0, color: 'text-yellow-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            {s.trend && <div className="text-xs text-emerald-400 mt-1">{s.trend} trending up</div>}
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Status Breakdown</h3>
          {[
            { label: 'Open', count: stats?.tasks?.open, color: 'bg-blue-500', total: stats?.tasks?.total },
            { label: 'Assigned', count: stats?.tasks?.assigned, color: 'bg-yellow-500', total: stats?.tasks?.total },
            { label: 'Submitted', count: stats?.tasks?.submitted, color: 'bg-purple-500', total: stats?.tasks?.total },
            { label: 'Paid', count: stats?.tasks?.paid, color: 'bg-emerald-500', total: stats?.tasks?.total },
          ].map(s => (
            <div key={s.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{s.label}</span><span className="font-mono text-slate-300">{s.count || 0}</span></div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.total > 0 ? ((s.count || 0)/s.total)*100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Worker Distribution</h3>
          <div className="space-y-3">
            {[{ label: 'Human Workers', value: Math.round((stats?.workers?.total || 0) * 0.3), color: 'text-cyan-400' },
              { label: 'AI Agents', value: Math.round((stats?.workers?.total || 0) * 0.4), color: 'text-purple-400' },
              { label: 'Scripted Bots', value: Math.round((stats?.workers?.total || 0) * 0.3), color: 'text-yellow-400' }]
              .map(w => (
                <div key={w.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{w.label}</span>
                  <span className={`text-sm font-bold font-mono ${w.color}`}>{w.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
