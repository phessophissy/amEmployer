'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { MetricsCard } from '@/components/common/MetricsCard';
import { useWebSocket } from '@/hooks/useWebSocket';
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
