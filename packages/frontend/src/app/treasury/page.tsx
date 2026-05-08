'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LiveDot } from '@/components/common/LiveDot';

export default function TreasuryPage() {
  const [stats, setStats] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, payments } = useWebSocket();

  const load = async () => {
    try {
      const [statsRes, workersRes] = await Promise.all([api.stats.platform(), api.workers.list({ limit: '20' })]);
      setStats(statsRes.data);
      setWorkers(workersRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);
  useEffect(() => { if (payments.length) load(); }, [payments]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Treasury <span className="text-emerald-400">Dashboard</span></h1>
          <p className="text-xs text-slate-500 font-mono mt-1">On-chain cUSD flow · Celo Mainnet</p>
        </div>
        <LiveDot active={connected} label={connected ? 'LIVE' : 'OFFLINE'} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Paid', value: stats?.payments?.totalAmount || '0', color: 'text-emerald-400' },
            { label: 'Workers', value: stats?.workers?.total || 0, color: 'text-cyan-400', isNum: true },
            { label: 'Jobs Run', value: stats?.jobs?.total || 0, color: 'text-purple-400', isNum: true },
            { label: 'Tasks Done', value: stats?.tasks?.paid || 0, color: 'text-yellow-400', isNum: true },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4">
              <div className={`text-xl font-bold font-mono ${s.color}`}>
                {s.isNum ? s.value : `${parseFloat(s.value as string).toFixed(2)} cUSD`}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-700/30 flex items-center justify-between">
          <SectionHeader title="Recent Payments" subtitle="Live on-chain cUSD disbursements" />
        </div>
        {stats?.payments?.recent?.length > 0 ? (
          <div className="divide-y divide-slate-700/20">
            {[...payments, ...(stats?.payments?.recent || [])].slice(0, 15).map((p: any, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{p.task?.title || p.taskId}</p>
                    <p className="text-xs font-mono text-slate-600">→ {(p.worker?.walletAddress || p.worker || '').slice(0,10)}…</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-slate-600 text-sm">No payments yet. Launch a demo to see live payroll.</div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/30">
          <SectionHeader title="Top Earners" subtitle="Workers by total cUSD earned" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/20">
                {['#', 'Worker', 'Type', 'Tasks', 'Earned'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/10">
              {workers.sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings)).slice(0, 10).map((w: any, i: number) => (
                <tr key={w.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 text-sm">{w.personaName || `Worker ${i+1}`}</p>
                    <p className="text-xs text-slate-600 font-mono">{w.walletAddress?.slice(0,10)}…</p>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-400 font-mono">{w.workerType}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-sm">{w.completedTasks}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-sm">{parseFloat(w.totalEarnings || '0').toFixed(2)} cUSD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
