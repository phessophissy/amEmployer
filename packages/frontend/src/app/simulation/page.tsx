'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MetricsCard } from '@/components/common/MetricsCard';
import { AIActivityLog } from '@/components/common/AIActivityLog';
import { cn, shortenAddress, timeAgo } from '@/lib/utils';

interface SimulationWallet {
  id: string;
  walletAddress: string;
  tasksCompleted: number;
  earnings: string;
  status: string;
}

interface ChartPoint {
  time: string;
  payments: number;
  amount: number;
}

const WALLET_STATUS_COLORS: Record<string, string> = {
  idle: 'bg-slate-700',
  working: 'bg-yellow-500 animate-pulse',
  submitting: 'bg-purple-500 animate-pulse',
  paid: 'bg-emerald-500',
  failed: 'bg-red-500',
};

export default function SimulationPage() {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [activeSim, setActiveSim] = useState<any | null>(null);
  const [wallets, setWallets] = useState<SimulationWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [paymentChart, setPaymentChart] = useState<ChartPoint[]>([]);
  const [walletCount, setWalletCount] = useState(100);
  const paymentCountRef = useRef(0);

  const { connected, aiLogs, payments, simulationData } = useWebSocket();

  const loadSimulations = async () => {
    const res = await api.simulation.list();
    setSimulations(res.data || []);
    if (!activeSimId && res.data?.length > 0) {
      const running = res.data.find((s: any) => s.status === 'RUNNING') || res.data[0];
      setActiveSimId(running.id);
    }
  };

  const loadActiveSimulation = async () => {
    if (!activeSimId) return;
    try {
      const [simRes, queuesRes] = await Promise.all([
        api.simulation.get(activeSimId),
        api.simulation.queueStats(),
      ]);
      setActiveSim(simRes.data);
      setWallets(simRes.data?.wallets || []);
      setQueueStats(queuesRes.data || []);
    } catch {}
  };

  useEffect(() => {
    loadSimulations();
    const interval = setInterval(() => {
      loadSimulations();
      if (activeSimId) loadActiveSimulation();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSimId]);

  useEffect(() => {
    if (activeSimId) loadActiveSimulation();
  }, [activeSimId]);

  // Track payments in chart
  useEffect(() => {
    if (payments.length === 0) return;
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour12: false });
    setPaymentChart((prev) => {
      paymentCountRef.current += payments.length;
      const last = prev[prev.length - 1];
      if (last && last.time === timeLabel) {
        return prev.map((p) =>
          p.time === timeLabel
            ? { ...p, payments: p.payments + payments.length, amount: p.amount + payments.reduce((s, p) => s + p.amount, 0) }
            : p
        );
      }
      return [
        ...prev.slice(-30),
        {
          time: timeLabel,
          payments: payments.length,
          amount: payments.reduce((s, p) => s + p.amount, 0),
        },
      ];
    });
  }, [payments]);

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchError('');
    try {
      await api.jobs.launchDemo();
      const res = await api.simulation.start({
        walletCount,
        name: `Stress Test — ${walletCount} wallets — ${new Date().toLocaleTimeString()}`,
      });
      setActiveSimId(res.data.id);
      await loadSimulations();
    } catch (err: any) {
      setLaunchError(err.message || 'Failed to launch');
    } finally {
      setLaunching(false);
    }
  };

  const totalEarnings = wallets.reduce((s, w) => s + parseFloat(w.earnings || '0'), 0);
  const completedWallets = wallets.filter((w) => w.tasksCompleted > 0).length;
  const tps = paymentChart.length > 1
    ? (paymentChart.slice(-5).reduce((s, p) => s + p.payments, 0) / 5).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Simulation <span className="text-purple-400">Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-xs sm:text-sm">
            {connected ? <span className="text-emerald-400">● LIVE</span> : <span className="text-slate-600">○ OFFLINE</span>}
            {' '}— Mass wallet stress test
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={walletCount}
              onChange={(e) => setWalletCount(Math.min(500, Math.max(1, parseInt(e.target.value))))}
              className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono text-center outline-none focus:border-purple-500"
            />
            <span className="text-slate-500 text-sm">wallets</span>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLaunch}
              disabled={launching}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
            >
              {launching ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Spawning...
                </span>
              ) : (
                '⚡ Launch'
              )}
            </motion.button>
          </div>
          {launchError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{launchError}</p>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
        <MetricsCard title="Wallets" value={wallets.length || walletCount} color="purple" />
        <MetricsCard title="Active" value={activeSim?.tasksCreated ?? 0} subtitle="tasks" color="cyan" />
        <MetricsCard title="Completed" value={activeSim?.tasksCompleted ?? 0} color="green" />
        <MetricsCard title="Failed" value={activeSim?.tasksFailed ?? 0} color="orange" />
        <MetricsCard title="Paid Out" value={`${totalEarnings.toFixed(2)}`} subtitle="cUSD" color="green" />
        <MetricsCard title="Est. TPS" value={tps} subtitle="tx/sec" color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Wallet Grid */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Wallet Activity</span>
                <span className="text-xs font-mono text-slate-500">({wallets.length || walletCount})</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs">
                {[
                  { label: 'Idle', color: 'bg-slate-700' },
                  { label: 'Working', color: 'bg-yellow-500' },
                  { label: 'Paid', color: 'bg-emerald-500' },
                  { label: 'Failed', color: 'bg-red-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                    <span className="text-slate-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {wallets.length > 0 ? (
              <div className="p-3 h-[260px] sm:h-[320px] overflow-y-auto">
                {/* 10 cols on mobile, 20 on sm+ */}
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }} data-mobile-grid>
                  <style>{`@media (min-width: 640px) { [data-mobile-grid] { grid-template-columns: repeat(20, 1fr) !important; } }`}</style>
                  {wallets.map((w) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'w-full aspect-square rounded-sm cursor-pointer transition-all duration-300',
                        WALLET_STATUS_COLORS[w.status] || 'bg-slate-700'
                      )}
                      title={`${shortenAddress(w.walletAddress)} | ${w.tasksCompleted} tasks | ${parseFloat(w.earnings).toFixed(4)} cUSD`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 h-[260px] sm:h-[320px] flex items-center justify-center">
                <div className="text-center w-full">
                  <p className="text-slate-600 font-mono text-sm mb-4">No simulation running</p>
                  <div className="grid gap-1 opacity-20" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                    {Array.from({ length: Math.min(walletCount, 100) }).map((_, i) => (
                      <div key={i} className="w-full aspect-square rounded-sm bg-slate-600" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment stream chart */}
          <div className="mt-4 bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Payment Stream (live)</h3>
              <span className="text-xs font-mono text-emerald-400">
                {paymentCountRef.current} total payments
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={paymentChart}>
                <defs>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2936" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0d1117', border: '1px solid #1c2936', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#00ff88' }}
                />
                <Area type="monotone" dataKey="payments" stroke="#00ff88" fill="url(#payGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Queue stats */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h3 className="text-sm font-semibold text-slate-200">Queue Statistics</h3>
            </div>
            <div className="p-4">
              {queueStats.length > 0 ? (
                <div className="space-y-3">
                  {queueStats.map((q) => {
                    const total = q.waiting + q.active + q.completed;
                    return (
                      <div key={q.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-slate-400 truncate">
                            {q.name.replace(':', '/')}
                          </span>
                          <span className="text-xs font-mono text-slate-600">{q.active} active</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div className="bg-yellow-500/50 rounded-l" style={{ flex: q.waiting }} />
                          <div className="bg-purple-500/70" style={{ flex: q.active }} />
                          <div className="bg-emerald-500/30 rounded-r" style={{ flex: q.completed }} />
                        </div>
                        <div className="flex gap-3 mt-1 text-xs font-mono text-slate-600">
                          <span className="text-yellow-400">{q.waiting}w</span>
                          <span className="text-purple-400">{q.active}a</span>
                          <span className="text-emerald-400">{q.completed}c</span>
                          <span className="text-red-400">{q.failed}f</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-mono py-4 text-center">No queue data</p>
              )}
            </div>
          </div>

          {/* Live payment feed */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/30 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-200">Live Payouts</h3>
            </div>
            <div className="divide-y divide-slate-700/20 max-h-48 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {payments.slice(0, 15).map((p, i) => (
                  <motion.div
                    key={`${p.txHash}-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-slate-400 font-mono">{shortenAddress(p.worker)}</p>
                      <p className="text-xs text-slate-600">{timeAgo(p.timestamp)}</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      +{typeof p.amount === 'number' ? p.amount.toFixed(4) : p.amount} cUSD
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {payments.length === 0 && (
                <div className="px-4 py-6 text-xs text-slate-600 font-mono text-center">
                  Waiting for payments...
                </div>
              )}
            </div>
          </div>

          {/* AI logs */}
          <div className="bg-slate-900/50 border border-emerald-500/10 rounded-xl overflow-hidden h-64">
            <AIActivityLog logs={aiLogs} maxHeight="220px" title="AI Agent Feed" />
          </div>
        </div>
      </div>

      {/* Simulation history */}
      {simulations.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/30">
            <h2 className="text-sm font-semibold text-slate-200">Simulation History</h2>
          </div>
          <div className="divide-y divide-slate-700/20">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className={cn(
                  'px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors',
                  activeSimId === sim.id && 'bg-slate-800/40 border-l-2 border-purple-500'
                )}
                onClick={() => setActiveSimId(sim.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{sim.name}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {sim.walletCount} wallets · {timeAgo(sim.startedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono flex-shrink-0">
                  <span className="text-emerald-400">{sim.tasksCompleted} done</span>
                  <span className="text-red-400">{sim.tasksFailed} failed</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded border',
                      sim.status === 'RUNNING'
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : sim.status === 'COMPLETED'
                        ? 'text-cyan-400 border-cyan-500/30'
                        : 'text-slate-400 border-slate-600'
                    )}
                  >
                    {sim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
