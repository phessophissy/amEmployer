'use client';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { MetricsCard } from '@/components/common/MetricsCard';

const PIE_COLORS = ['#00ff88', '#00e5ff', '#bd00ff', '#ff6b35', '#f87171'];

export default function TreasuryPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([api.stats.platform(), api.stats.activity()]);
      setStats(statsRes.data);
      setActivity(activityRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const taskDistribution = stats
    ? [
        { name: 'Open', value: stats.tasks.open },
        { name: 'Assigned', value: stats.tasks.assigned },
        { name: 'Submitted', value: stats.tasks.submitted },
        { name: 'Verified', value: stats.tasks.verified },
        { name: 'Paid', value: stats.tasks.paid },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Treasury <span className="text-orange-400">Dashboard</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">On-chain financial overview and escrow status</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricsCard
          title="Total Distributed"
          value={`${parseFloat(stats?.payments.totalAmount || '0').toFixed(4)} cUSD`}
          subtitle="to workers"
          color="green"
        />
        <MetricsCard
          title="Onchain Tasks"
          value={stats?.onchain.totalTasks ?? '—'}
          color="cyan"
        />
        <MetricsCard
          title="Onchain Completed"
          value={stats?.onchain.completedTasks ?? '—'}
          color="purple"
        />
        <MetricsCard
          title="Onchain Paid"
          value={`${parseFloat(stats?.onchain.paidOut || '0').toFixed(4)} cUSD`}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity chart */}
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Payment Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={activity}>
              <defs>
                <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2936" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1c2936', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#ff6b35' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                name="cUSD Paid"
                stroke="#ff6b35"
                fill="url(#amtGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution */}
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Task Status Distribution</h3>
          {taskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taskDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d1117', border: '1px solid #1c2936', borderRadius: 8 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-600 font-mono text-sm">
              No task data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent payments table */}
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/30">
          <h2 className="text-sm font-semibold text-slate-200">Recent On-Chain Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/30">
                {['Task', 'Worker', 'Amount', 'Tx Hash', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {stats?.payments.recent.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-300 max-w-xs">
                    <p className="truncate">{p.task?.title || p.taskId}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">
                    {p.worker?.walletAddress?.slice(0, 10)}...
                  </td>
                  <td className="px-5 py-3 font-mono text-emerald-400">
                    {parseFloat(p.amount).toFixed(4)} cUSD
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {p.txHash ? `${p.txHash.slice(0, 16)}...` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.payments.recent || stats.payments.recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-600 font-mono text-sm">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
