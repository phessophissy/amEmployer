'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CUSDBalanceWidget } from "@/components/common/CUSDBalanceWidget";
import { MetricsCard } from '@/components/common/MetricsCard';
import { AIActivityLog } from '@/components/common/AIActivityLog';
import { cn, shortenAddress, timeAgo } from '@/lib/utils';
import { useWalletContext } from '@/components/common/WalletProvider';
import { JobCard } from '@/components/employer/JobCard';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  totalBudget: number;
  taskCount: number;
  completedCount: number;
  createdAt: string;
}

interface Stats {
  jobs: { total: number; active: number };
  tasks: { total: number; open: number; assigned: number; submitted: number; paid: number };
  workers: { total: number; active: number };
  payments: { totalAmount: string; recent: any[] };
}

export default function EmployerPage() {
  const { address: walletAddress, isConnected, connect } = useWalletContext();

  // Wallet gate — must connect before accessing employer dashboard
  if (!isConnected) return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🏢</div>
      <h1 className="text-2xl font-bold text-white mb-2">Employer Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        Connect your wallet to post jobs, track tasks, and pay workers automatically with cUSD.
      </p>
      <button
        onClick={connect}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
      >
        Connect Wallet
      </button>
    </div>
  );

  return <EmployerDashboard walletAddress={walletAddress!} />;
}

function EmployerDashboard({ walletAddress }: { walletAddress: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    totalBudget: '',
    employerAddress: walletAddress,
  });

  const { connected, aiLogs, taskUpdates, payments } = useWebSocket();

  const load = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        // Filter jobs to only this employer's jobs
        api.jobs.list({ employer: walletAddress }),
        api.stats.platform(),
      ]);
      setJobs(jobsRes.data || []);
      setStats(statsRes.data);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  // Refresh when tasks update
  useEffect(() => {
    if (taskUpdates.length) load();
  }, [taskUpdates, load]);

  // Keep employerAddress in form synced
  useEffect(() => {
    setForm((prev) => ({ ...prev, employerAddress: walletAddress }));
  }, [walletAddress]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.jobs.create({
        title: form.title,
        description: form.description,
        totalBudget: parseFloat(form.totalBudget),
        employerAddress: walletAddress,
      });
      setShowCreateForm(false);
      setForm({ title: '', description: '', totalBudget: '', employerAddress: walletAddress });
      load();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create job');
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await api.jobs.launchDemo();
      load();
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Employer <span className="text-emerald-400">Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-xs sm:text-sm">
            {connected ? (
              <span className="text-emerald-400">● LIVE</span>
            ) : (
              <span className="text-slate-600">○ CONNECTING</span>
            )}{' '}
            — AI Agent is {stats?.jobs.active ? 'actively working' : 'idle'}
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
          >
            {demoLoading ? '⚡ Launching...' : '⚡ Launch Economy'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-semibold rounded-lg transition-all duration-200 hover:bg-emerald-500/10 text-sm"
          >
            + Create Job
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <MetricsCard title="Total Jobs" value={stats?.jobs.total ?? '—'} subtitle={`${stats?.jobs.active ?? 0} active`} color="green" />
        <MetricsCard title="Tasks" value={stats?.tasks.total ?? '—'} subtitle={`${stats?.tasks.open ?? 0} open · ${stats?.tasks.assigned ?? 0} assigned`} color="cyan" />
        <MetricsCard title="Workers" value={stats?.workers.total ?? '—'} subtitle={`${stats?.workers.active ?? 0} active`} color="purple" />
        <MetricsCard title="Paid Out" value={`${parseFloat(stats?.payments.totalAmount || '0').toFixed(2)} cUSD`} subtitle="total distributed" color="orange" />
      </div>

      {/* Task pipeline — horizontal scroll on mobile */}
      <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
        {[
          { label: 'Open', count: stats?.tasks.open, color: 'blue' },
          { label: 'Assigned', count: stats?.tasks.assigned, color: 'yellow' },
          { label: 'Submitted', count: stats?.tasks.submitted, color: 'purple' },
          { label: 'Verified', count: stats?.tasks.paid, color: 'emerald' },
          { label: 'Paid', count: stats?.tasks.paid, color: 'cyan' },
        ].map((stage) => (
          <div
            key={stage.label}
            className="flex-shrink-0 w-[calc(20vw-10px)] sm:w-auto min-w-[72px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center"
          >
            <div className={`text-xl sm:text-2xl font-bold font-mono text-${stage.color}-400`}>
              {stage.count ?? 0}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-1">{stage.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Jobs list */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
              <h2 className="font-semibold text-slate-200">My Jobs</h2>
              <span className="text-xs font-mono text-slate-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-slate-700/20">
              {loading && (
                <div className="px-5 py-10 text-center text-slate-600 font-mono text-sm">Loading...</div>
              )}
              {!loading && jobs.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <div className="text-slate-600 mb-3">No jobs yet</div>
                  <button
                    onClick={handleDemo}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    ⚡ Launch demo economy →
                  </button>
                </div>
              )}
              <div className="divide-y divide-slate-700/10">
                {jobs.map((job, i) => (
                  <JobCard key={job.id} {...job} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Log sidebar */}
        <div className="bg-slate-900/50 border border-emerald-500/10 rounded-xl overflow-hidden h-64 sm:h-[500px]">
          <AIActivityLog logs={aiLogs} maxHeight="460px" />
        </div>
      </div>

      {/* Recent payments */}
      {stats?.payments.recent && stats.payments.recent.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/30">
            <h2 className="font-semibold text-slate-200">Recent Payments</h2>
          </div>
          <div className="divide-y divide-slate-700/20">
            {[...payments, ...stats.payments.recent].slice(0, 10).map((p: any, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">{p.task?.title || p.taskId}</p>
                    <p className="text-xs text-slate-600 font-mono">
                      → {shortenAddress(p.worker?.walletAddress || p.worker || '')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-emerald-400">
                    +{parseFloat(p.amount).toFixed(4)} cUSD
                  </div>
                  <div className="text-xs text-slate-600">{timeAgo(p.createdAt || p.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full sm:max-w-lg bg-slate-900 border border-emerald-500/20 sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <h3 className="font-semibold text-white">Create New Job</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                    Job Title
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Label 500 product images"
                    className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed instructions for the AI to decompose into tasks..."
                    className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 outline-none transition-colors text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                    Total Budget (cUSD)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                    placeholder="100"
                    className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                    Employer Wallet
                  </label>
                  <div className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 break-all">
                    {walletAddress}
                  </div>
                </div>
                {createError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {createError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Create Job & Start AI Decomposition
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
