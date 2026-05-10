'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { MetricsCard } from '@/components/common/MetricsCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWalletContext } from '@/components/common/WalletProvider';
import { cn, STATUS_COLORS, shortenAddress, timeAgo, formatCUSD } from '@/lib/utils';

interface Worker {
  id: string;
  walletAddress: string;
  reputation: number;
  completedTasks: number;
  failedTasks: number;
  totalEarnings: string;
  workerType: string;
  personaName?: string;
  isActive: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  reward: string;
  assignedWorker?: string;
  validationScore?: number;
  validationNotes?: string;
  submission?: string;
  createdAt: string;
  job?: { title: string };
}

function ReputationBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8">{score}</span>
    </div>
  );
}

// ─── My Dashboard (connected worker) ────────────────────────────────────────

function MyDashboard({ address }: { address: string }) {
  const [profile, setProfile] = useState<Worker | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'open'>('my-tasks');

  const { taskUpdates, payments } = useWebSocket();

  const load = useCallback(async () => {
    try {
      const [profileRes, assignedRes, openRes] = await Promise.all([
        api.workers.get(address).catch(() => null),
        api.tasks.list({ worker: address, limit: '50' }),
        api.tasks.open(),
      ]);

      if (!profileRes) {
        setNotRegistered(true);
        return;
      }
      setProfile(profileRes.data);
      setMyTasks(assignedRes.data || []);
      setOpenTasks(openRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (taskUpdates.length || payments.length) load(); }, [taskUpdates, payments, load]);

  const handleSubmit = async (taskId: string) => {
    const text = submissionText[taskId]?.trim();
    if (!text) return;
    setSubmitting(taskId);
    setSubmitError({});
    try {
      await api.tasks.submit(taskId, { submission: text, workerAddress: address });
      setSubmissionText(prev => ({ ...prev, [taskId]: '' }));
      await load();
    } catch (err: any) {
      setSubmitError(prev => ({ ...prev, [taskId]: err.message }));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return (
    <div className="py-20 text-center text-slate-600 font-mono text-sm">Loading your profile…</div>
  );

  if (notRegistered) return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="text-xl font-bold text-white mb-2">Not registered yet</h2>
      <p className="text-slate-500 text-sm mb-6">Register as a worker to receive tasks and earn cUSD.</p>
      <Link href="/worker/register"
        className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm">
        Register as Worker →
      </Link>
    </div>
  );

  const activeTasks = myTasks.filter(t => ['ASSIGNED', 'SUBMITTED'].includes(t.status));
  const doneTasks = myTasks.filter(t => ['VERIFIED', 'PAID', 'REJECTED'].includes(t.status));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Profile card */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          🏷️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white">{profile!.personaName || 'Worker'}</p>
          <p className="text-xs font-mono text-slate-500 truncate">{profile!.walletAddress}</p>
          <div className="mt-2 max-w-[200px]">
            <ReputationBar score={profile!.reputation} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center flex-shrink-0">
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">{profile!.completedTasks}</div>
            <div className="text-xs text-slate-600">done</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-red-400">{profile!.failedTasks}</div>
            <div className="text-xs text-slate-600">failed</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {parseFloat(profile!.totalEarnings || '0').toFixed(2)}
            </div>
            <div className="text-xs text-slate-600">cUSD</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/40 pb-0">
        {([
          { key: 'my-tasks', label: `My Tasks (${activeTasks.length})` },
          { key: 'open', label: `Open Tasks (${openTasks.length})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* My tasks tab */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-3">
          {activeTasks.length === 0 && doneTasks.length === 0 && (
            <div className="py-12 text-center text-slate-600 text-sm">
              No tasks assigned to you yet. Check back soon — the AI assigns tasks automatically.
            </div>
          )}

          {activeTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[task.status])}>
                        {task.status}
                      </span>
                      <span className="text-xs text-slate-600">{timeAgo(task.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{task.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono text-emerald-400">{formatCUSD(task.reward)}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-3">{task.description}</p>

                {task.status === 'ASSIGNED' && (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Paste your completed work here…"
                      value={submissionText[task.id] || ''}
                      onChange={e => setSubmissionText(prev => ({ ...prev, [task.id]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition-colors resize-none"
                    />
                    {submitError[task.id] && (
                      <p className="text-xs text-red-400">{submitError[task.id]}</p>
                    )}
                    <button
                      onClick={() => handleSubmit(task.id)}
                      disabled={submitting === task.id || !submissionText[task.id]?.trim()}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {submitting === task.id ? 'Submitting…' : 'Submit Work for AI Review'}
                    </button>
                  </div>
                )}

                {task.status === 'SUBMITTED' && (
                  <div className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                    ⏳ Submitted — AI is reviewing your work…
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Completed / past tasks */}
          {doneTasks.length > 0 && (
            <>
              <p className="text-xs font-mono text-slate-600 uppercase tracking-wider pt-2">Past Tasks</p>
              {doneTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-slate-900/30 border border-slate-700/20 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[task.status])}>
                        {task.status}
                      </span>
                      {task.validationScore !== undefined && task.validationScore !== null && (
                        <span className="text-xs text-slate-500 font-mono">
                          score: {(task.validationScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">{task.title}</p>
                  </div>
                  <div className="text-sm font-mono text-emerald-400 flex-shrink-0">
                    {task.status === 'PAID' ? `+${formatCUSD(task.reward)}` : formatCUSD(task.reward)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Open tasks tab */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {openTasks.length === 0 && (
            <div className="py-12 text-center text-slate-600 text-sm">
              No open tasks right now. Check back soon — employers post new jobs regularly.
            </div>
          )}
          {openTasks.map(task => (
            <div
              key={task.id}
              className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 mb-1">{task.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono text-emerald-400">{formatCUSD(task.reward)}</div>
                  <div className="text-xs text-slate-600 mt-1">{timeAgo(task.createdAt)}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                The AI automatically assigns open tasks to registered workers based on reputation.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public leaderboard ──────────────────────────────────────────────────────

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.workers.leaderboard().then(r => {
      setLeaderboard(r.data || []);
      setLoading(false);
    });
  }, []);

  const personas: Record<string, string> = {
    DataLabeler: '🏷️', Translator: '🌐', Moderator: '🛡️', Researcher: '🔬',
    Annotator: '✏️', Reviewer: '👁️', Analyst: '📊', Validator: '✅',
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <h2 className="text-xl font-bold text-white">Worker Leaderboard</h2>
          <p className="text-xs text-slate-500">Top earners in the autonomous economy</p>
        </div>
      </div>
      {loading ? (
        <div className="py-10 text-center text-slate-600 text-sm font-mono">Loading…</div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden divide-y divide-slate-700/20">
          {leaderboard.map((w, i) => (
            <div key={w.id} className="px-4 py-3 flex items-center gap-3">
              <span className={cn('w-6 text-center text-sm font-mono font-bold',
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-600'
              )}>
                {i + 1}
              </span>
              <span className="text-lg">{personas[w.personaName || ''] || '🤖'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{w.personaName || shortenAddress(w.walletAddress)}</p>
                <p className="text-xs text-slate-600 font-mono">{w.completedTasks} tasks · rep {w.reputation}</p>
              </div>
              <div className="text-sm font-mono text-emerald-400">
                {parseFloat(w.totalEarnings || '0').toFixed(2)} cUSD
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WorkerPage() {
  const { address, isConnected, connect } = useWalletContext();

  if (!isConnected) return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">💼</div>
      <h1 className="text-2xl font-bold text-white mb-2">Worker Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        Connect your wallet to see your tasks, submit work, and track your earnings.
      </p>
      <div className="space-y-3">
        <button
          onClick={connect}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
        >
          Connect Wallet
        </button>
        <Link href="/worker/register"
          className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
          New here? Register as a worker →
        </Link>
      </div>
      <div className="mt-10 border-t border-slate-700/40 pt-8">
        <Leaderboard />
      </div>
    </div>
  );

  return (
    <div>
      <MyDashboard address={address!} />
      <div className="border-t border-slate-700/30 mt-6">
        <Leaderboard />
      </div>
    </div>
  );
}


interface Worker {
  id: string;
  walletAddress: string;
  reputation: number;
  completedTasks: number;
  failedTasks: number;
  totalEarnings: string;
  workerType: string;
  personaName?: string;
  isActive: boolean;
  createdAt: string;
  payments?: any[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  reward: string;
  assignedWorker?: string;
  validationScore?: number;
  createdAt: string;
}

function ReputationBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8">{score}</span>
    </div>
  );
}

export default function WorkerPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const { taskUpdates, payments } = useWebSocket();

  const load = async () => {
    try {
      const [workersRes, tasksRes, lbRes] = await Promise.all([
        api.workers.list({ limit: '100' }),
        api.tasks.list({ limit: '50' }),
        api.workers.leaderboard(),
      ]);
      setWorkers(workersRes.data || []);
      setTasks(tasksRes.data || []);
      setLeaderboard(lbRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (taskUpdates.length || payments.length) load();
  }, [taskUpdates, payments]);

  const personas: Record<string, string> = {
    DataLabeler: '🏷️',
    Translator: '🌐',
    Moderator: '🛡️',
    Researcher: '🔬',
    Annotator: '✏️',
    Reviewer: '👁️',
    Analyst: '📊',
    Validator: '✅',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Worker <span className="text-cyan-400">Dashboard</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Real-time view of all worker agents in the autonomous economy
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricsCard title="Total Workers" value={workers.length} color="cyan" />
        <MetricsCard
          title="AI Agents"
          value={workers.filter((w) => w.workerType === 'AI_AGENT').length}
          subtitle="autonomous"
          color="purple"
        />
        <MetricsCard
          title="Avg Reputation"
          value={workers.length ? Math.round(workers.reduce((s, w) => s + w.reputation, 0) / workers.length) : 0}
          subtitle="out of 100"
          color="green"
        />
        <MetricsCard
          title="Total Earned"
          value={`${workers.reduce((s, w) => s + parseFloat(w.totalEarnings || '0'), 0).toFixed(2)} cUSD`}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worker grid */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h2 className="font-semibold text-slate-200">Active Workers</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
              {loading && (
                <div className="col-span-2 py-10 text-center text-slate-600 font-mono text-sm">
                  Loading workers...
                </div>
              )}
              <AnimatePresence>
                {workers.map((worker) => (
                  <motion.div
                    key={worker.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="cyber-card bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 cursor-pointer hover:border-cyan-500/30 transition-all"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center text-lg">
                        {personas[worker.personaName || ''] || '🤖'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {worker.personaName || 'Worker'}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {shortenAddress(worker.walletAddress)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'ml-auto text-xs px-1.5 py-0.5 rounded font-mono border flex-shrink-0',
                          worker.workerType === 'AI_AGENT'
                            ? 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                            : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                        )}
                      >
                        {worker.workerType === 'AI_AGENT' ? 'AI' : 'BOT'}
                      </span>
                    </div>

                    <ReputationBar score={worker.reputation} />

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center">
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          {worker.completedTasks}
                        </div>
                        <div className="text-xs text-slate-600">done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-mono font-bold text-red-400">
                          {worker.failedTasks}
                        </div>
                        <div className="text-xs text-slate-600">failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-mono font-bold text-cyan-400">
                          {parseFloat(worker.totalEarnings || '0').toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-600">cUSD</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-700/30 flex items-center gap-2">
              <span className="text-yellow-400">🏆</span>
              <h2 className="font-semibold text-slate-200">Leaderboard</h2>
            </div>
            <div className="divide-y divide-slate-700/20">
              {leaderboard.slice(0, 10).map((w, i) => (
                <div key={w.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className={cn(
                      'w-6 text-center text-sm font-mono font-bold',
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-600'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-base">{personas[w.personaName || ''] || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{w.personaName || shortenAddress(w.walletAddress)}</p>
                    <p className="text-xs text-slate-600 font-mono">{w.completedTasks} tasks</p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    {parseFloat(w.totalEarnings || '0').toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live task feed */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Live Task Feed
              </h2>
            </div>
            <div className="divide-y divide-slate-700/20 max-h-80 overflow-y-auto">
              {tasks.slice(0, 20).map((task) => (
                <div key={task.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-400 line-clamp-1">{task.title}</p>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded border flex-shrink-0 font-mono',
                        STATUS_COLORS[task.status]
                      )}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400 font-mono">{formatCUSD(task.reward)}</span>
                    {task.assignedWorker && (
                      <span className="text-xs text-slate-600 font-mono">
                        → {shortenAddress(task.assignedWorker)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
