#!/usr/bin/env bash
# PRs 6-15
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
FRONTEND="packages/frontend/src"

commit() { git add -A && git commit -m "$1"; }
make_pr() {
  local branch="$1" title="$2" body="$3" work_fn="$4"
  git checkout main
  git checkout -b "$branch"
  $work_fn
  git push origin "$branch"
  gh pr create --base main --head "$branch" --title "$title" --body "$body"
  git checkout main
}

# ─── PR 6: Treasury Dashboard ─────────────────────────────────────────────────
pr06() {
  mkdir -p "$FRONTEND/components/treasury"
  # commit 1
  cat > "$FRONTEND/components/treasury/TreasuryStats.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
interface TreasuryStatsProps {
  totalDeposited: string;
  totalPaidOut: string;
  pendingEscrow: string;
  reserveBalance: string;
}
export function TreasuryStats({ totalDeposited, totalPaidOut, pendingEscrow, reserveBalance }: TreasuryStatsProps) {
  const stats = [
    { label: 'Total Deposited', value: totalDeposited, color: 'text-emerald-400', prefix: '' },
    { label: 'Paid Out', value: totalPaidOut, color: 'text-cyan-400', prefix: '' },
    { label: 'In Escrow', value: pendingEscrow, color: 'text-yellow-400', prefix: '' },
    { label: 'Reserve', value: reserveBalance, color: 'text-purple-400', prefix: '' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4">
          <div className={`text-xl sm:text-2xl font-bold font-mono ${s.color}`}>{s.prefix}{parseFloat(s.value || '0').toFixed(2)} cUSD</div>
          <div className="text-xs text-slate-500 mt-1">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
EOF
  commit "feat(treasury): add TreasuryStats four-metric header"

  # commit 2
  cat > "$FRONTEND/components/treasury/PaymentHistoryList.tsx" << 'EOF'
'use client';
import { timeAgo, shortenAddress } from '@/lib/utils';
import { motion } from 'framer-motion';
interface Payment { id: string; amount: string; workerAddress: string; taskTitle: string; timestamp: string; txHash?: string; }
interface PaymentHistoryListProps { payments: Payment[]; }
export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  return (
    <div className="divide-y divide-slate-700/20">
      {payments.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
          className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-xs">↑</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">{p.taskTitle}</p>
              <p className="text-xs text-slate-500 font-mono">→ {shortenAddress(p.workerAddress)}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
            <p className="text-xs text-slate-600">{timeAgo(p.timestamp)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
EOF
  commit "feat(treasury): add PaymentHistoryList component"

  # commit 3
  cat > "$FRONTEND/components/treasury/TreasuryChart.tsx" << 'EOF'
'use client';
interface DataPoint { label: string; value: number; }
interface TreasuryChartProps { data: DataPoint[]; title: string; color?: string; }
export function TreasuryChart({ data, title, color = 'emerald' }: TreasuryChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const colorMap: Record<string, string> = { emerald: 'bg-emerald-500', cyan: 'bg-cyan-500', purple: 'bg-purple-500' };
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-end" style={{ height: '96px' }}>
              <div
                className={`w-full ${colorMap[color] || 'bg-emerald-500'} rounded-t-sm transition-all duration-700 opacity-80 hover:opacity-100`}
                style={{ height: `${(d.value / max) * 96}px` }}
                title={`${d.label}: ${d.value.toFixed(2)}`}
              />
            </div>
            <span className="text-[9px] text-slate-600 font-mono truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
  commit "feat(treasury): add simple bar chart TreasuryChart component"

  # commit 4
  cat > "$FRONTEND/components/treasury/EscrowCard.tsx" << 'EOF'
'use client';
interface EscrowCardProps { jobTitle: string; amount: string; workerCount: number; daysRemaining?: number; }
export function EscrowCard({ jobTitle, amount, workerCount, daysRemaining }: EscrowCardProps) {
  return (
    <div className="flex items-center justify-between bg-slate-900/50 border border-yellow-500/20 rounded-xl px-4 py-3 gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-200 truncate font-medium">{jobTitle}</p>
        <p className="text-xs text-slate-500 mt-0.5">{workerCount} workers · {daysRemaining !== undefined ? `${daysRemaining}d remaining` : 'active'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-mono font-bold text-yellow-400">{parseFloat(amount).toFixed(2)} cUSD</p>
        <p className="text-xs text-slate-600">escrow</p>
      </div>
    </div>
  );
}
EOF
  commit "feat(treasury): add EscrowCard component for locked funds display"

  # commit 5
  cat > "$FRONTEND/components/treasury/TopEarnersTable.tsx" << 'EOF'
'use client';
import { shortenAddress } from '@/lib/utils';
interface Worker { walletAddress: string; personaName?: string; totalEarnings: string; completedTasks: number; }
interface TopEarnersTableProps { workers: Worker[]; }
export function TopEarnersTable({ workers }: TopEarnersTableProps) {
  const sorted = [...workers].sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings)).slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/30">
            {['Rank', 'Worker', 'Tasks', 'Earned'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/20">
          {sorted.map((w, i) => (
            <tr key={w.walletAddress} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{i + 1}</td>
              <td className="px-3 py-2.5">
                <p className="text-slate-200">{w.personaName || shortenAddress(w.walletAddress)}</p>
                <p className="text-xs text-slate-600 font-mono">{w.walletAddress.slice(0,8)}…</p>
              </td>
              <td className="px-3 py-2.5 font-mono text-slate-400">{w.completedTasks}</td>
              <td className="px-3 py-2.5 font-mono font-bold text-emerald-400">{parseFloat(w.totalEarnings).toFixed(2)} cUSD</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF
  commit "feat(treasury): add TopEarnersTable sorted by earnings"

  # commit 6 - update treasury page
  cat > "$FRONTEND/app/treasury/page.tsx" << 'EOF'
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
EOF
  commit "feat(treasury): overhaul treasury page with live stats and leaderboard"

  # commit 7
  cat > "$FRONTEND/components/treasury/index.ts" << 'EOF'
export { TreasuryStats } from './TreasuryStats';
export { PaymentHistoryList } from './PaymentHistoryList';
export { TreasuryChart } from './TreasuryChart';
export { EscrowCard } from './EscrowCard';
export { TopEarnersTable } from './TopEarnersTable';
EOF
  commit "chore(treasury): export barrel for treasury components"

  # commit 8
  cat > "$FRONTEND/components/treasury/PayoutSparkline.tsx" << 'EOF'
'use client';
interface PayoutSparklineProps { values: number[]; width?: number; height?: number; color?: string; }
export function PayoutSparkline({ values, width = 80, height = 24, color = '#10b981' }: PayoutSparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
EOF
  commit "feat(treasury): add SVG PayoutSparkline mini chart"

  # commit 9
  cat > "$FRONTEND/components/treasury/CUSDFlowDiagram.tsx" << 'EOF'
'use client';
interface CUSDFlowDiagramProps { deposited: number; escrow: number; paid: number; }
export function CUSDFlowDiagram({ deposited, escrow, paid }: CUSDFlowDiagramProps) {
  const remaining = Math.max(0, deposited - escrow - paid);
  const nodes = [
    { label: 'Deposited', value: deposited, color: 'border-emerald-500/40 text-emerald-400' },
    { label: 'In Escrow', value: escrow, color: 'border-yellow-500/40 text-yellow-400' },
    { label: 'Paid Out', value: paid, color: 'border-cyan-500/40 text-cyan-400' },
    { label: 'Available', value: remaining, color: 'border-purple-500/40 text-purple-400' },
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-2">
          <div className={`px-4 py-3 rounded-xl border text-center min-w-[90px] ${n.color.split(' ')[0]} bg-slate-900/70`}>
            <p className={`text-lg font-mono font-bold ${n.color.split(' ')[1]}`}>{n.value.toFixed(1)}</p>
            <p className="text-xs text-slate-500">{n.label}</p>
          </div>
          {i < nodes.length - 1 && <span className="text-slate-600 text-sm">→</span>}
        </div>
      ))}
    </div>
  );
}
EOF
  commit "feat(treasury): add CUSDFlowDiagram flow visualization"

  # commit 10
  cat >> "$FRONTEND/lib/utils.ts" << 'EOF'

/** Format a cUSD value with 2 decimal places and suffix */
export function formatCUSDShort(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00 cUSD';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k cUSD`;
  return `${num.toFixed(2)} cUSD`;
}

/** Returns relative time string */
export function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
EOF
  commit "feat(utils): add formatCUSDShort and relativeTime helpers"
}
make_pr "feat/treasury-dashboard-overhaul" \
  "feat: treasury dashboard overhaul with charts, payment history, and top earners" \
  "Redesigns the Treasury page with live stats, payment history list, SVG sparklines, cUSD flow diagram, and top earners table. Mobile-responsive grid layout." \
  pr06

# ─── PR 7: Simulation Page Enhancements ──────────────────────────────────────
pr07() {
  mkdir -p "$FRONTEND/components/simulation"
  # commit 1
  cat > "$FRONTEND/components/simulation/SimulationControls.tsx" << 'EOF'
'use client';
import { useState } from 'react';

interface SimulationControlsProps {
  onLaunch: (config: SimConfig) => Promise<void>;
  running: boolean;
}
interface SimConfig { workerCount: number; jobCount: number; mode: 'standard' | 'stress' | 'custom'; }
const PRESETS = [
  { label: 'Quick', config: { workerCount: 5, jobCount: 2, mode: 'standard' as const } },
  { label: 'Standard', config: { workerCount: 20, jobCount: 5, mode: 'standard' as const } },
  { label: 'Stress', config: { workerCount: 100, jobCount: 10, mode: 'stress' as const } },
];
export function SimulationControls({ onLaunch, running }: SimulationControlsProps) {
  const [config, setConfig] = useState<SimConfig>({ workerCount: 20, jobCount: 5, mode: 'standard' });
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-slate-200 text-sm">Simulation Config</h3>
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setConfig(p.config)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${JSON.stringify(config) === JSON.stringify(p.config) ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/40'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-slate-500 mb-1.5 block">Workers: {config.workerCount}</label>
          <input type="range" min={1} max={100} value={config.workerCount} onChange={e => setConfig(c => ({ ...c, workerCount: +e.target.value }))}
            className="w-full accent-emerald-500" />
        </div>
        <div>
          <label className="text-xs font-mono text-slate-500 mb-1.5 block">Jobs: {config.jobCount}</label>
          <input type="range" min={1} max={20} value={config.jobCount} onChange={e => setConfig(c => ({ ...c, jobCount: +e.target.value }))}
            className="w-full accent-emerald-500" />
        </div>
      </div>
      <button onClick={() => onLaunch(config)} disabled={running}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg">
        {running ? '⚡ Simulation Running…' : '⚡ Launch Simulation'}
      </button>
    </div>
  );
}
EOF
  commit "feat(simulation): add SimulationControls with preset and range sliders"

  # commit 2
  cat > "$FRONTEND/components/simulation/LiveActivityStream.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityEvent { id: string; type: string; message: string; timestamp: number; severity?: 'info' | 'success' | 'warning' | 'error'; }
interface LiveActivityStreamProps { events: ActivityEvent[]; maxItems?: number; }
const SEVERITY_COLORS = { info: 'text-cyan-400', success: 'text-emerald-400', warning: 'text-yellow-400', error: 'text-red-400' };
const SEVERITY_ICONS = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };
export function LiveActivityStream({ events, maxItems = 30 }: LiveActivityStreamProps) {
  return (
    <div className="bg-black/80 border border-emerald-500/10 rounded-xl overflow-hidden h-80 flex flex-col">
      <div className="px-4 py-2.5 border-b border-emerald-500/10 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">LIVE ACTIVITY STREAM</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {events.slice(-maxItems).reverse().map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex gap-2 ${SEVERITY_COLORS[e.severity || 'info']}`}>
              <span className="flex-shrink-0 opacity-60">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
              <span className="flex-shrink-0">{SEVERITY_ICONS[e.severity || 'info']}</span>
              <span className="text-slate-300">{e.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
EOF
  commit "feat(simulation): add LiveActivityStream terminal-style log"

  # commit 3
  cat > "$FRONTEND/components/simulation/WorkerHeatmap.tsx" << 'EOF'
'use client';
interface WorkerHeatmapProps { workers: { id: string; isActive: boolean; reputation: number; workerType: string }[]; }
const TYPE_COLORS: Record<string, string> = { human: 'bg-cyan-500', ai: 'bg-purple-500', scripted: 'bg-yellow-500' };
export function WorkerHeatmap({ workers }: WorkerHeatmapProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Worker Activity Grid</h3>
      <div className="flex flex-wrap gap-1">
        {workers.map(w => (
          <div key={w.id} title={`${w.workerType} · rep ${w.reputation}`}
            className={`w-3 h-3 rounded-sm transition-all duration-300 ${w.isActive ? TYPE_COLORS[w.workerType] || 'bg-slate-500' : 'bg-slate-800'}`}
            style={{ opacity: w.isActive ? 0.4 + (w.reputation / 100) * 0.6 : 0.3 }}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-xs text-slate-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
  commit "feat(simulation): add WorkerHeatmap grid visualization"

  # commit 4
  cat > "$FRONTEND/components/simulation/SimulationMetrics.tsx" << 'EOF'
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
EOF
  commit "feat(simulation): add SimulationMetrics with animated counters"

  # commit 5
  cat > "$FRONTEND/components/simulation/index.ts" << 'EOF'
export { SimulationControls } from './SimulationControls';
export { LiveActivityStream } from './LiveActivityStream';
export { WorkerHeatmap } from './WorkerHeatmap';
export { SimulationMetrics } from './SimulationMetrics';
EOF
  commit "chore(simulation): export barrel for simulation components"

  # commit 6
  cat > "$FRONTEND/components/simulation/TaskPipelineViz.tsx" << 'EOF'
'use client';
interface Stage { label: string; count: number; color: string; }
interface TaskPipelineVizProps { stages: Stage[]; }
export function TaskPipelineViz({ stages }: TaskPipelineVizProps) {
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Pipeline</h3>
      <div className="flex items-end justify-around gap-2 h-24">
        {stages.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-xs font-mono font-bold ${s.color}`}>{s.count}</span>
            <div className="w-full flex items-end" style={{ height: '64px' }}>
              <div className={`w-full ${s.color.replace('text-', 'bg-').replace('-400','-500')} rounded-t transition-all duration-500 opacity-70`}
                style={{ height: `${(s.count / max) * 64}px`, minHeight: s.count > 0 ? '4px' : '0' }} />
            </div>
            <span className="text-[9px] text-slate-600 font-mono">{s.label}</span>
            {i < stages.length - 1 && <span className="absolute text-slate-600 text-xs pointer-events-none" style={{ marginLeft: '100%', marginTop: '-32px' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
  commit "feat(simulation): add TaskPipelineViz bar chart for pipeline stages"

  # commit 7
  cat >> "$FRONTEND/components/simulation/index.ts" << 'EOF'
export { TaskPipelineViz } from './TaskPipelineViz';
EOF
  commit "chore(simulation): export TaskPipelineViz from barrel"

  # commit 8
  cat > "$FRONTEND/hooks/useSimulation.ts" << 'EOF'
import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface SimState { running: boolean; stats: { tasksCompleted: number; payoutsTotal: number; activeWorkers: number } | null; error: string; }

export function useSimulation() {
  const [state, setState] = useState<SimState>({ running: false, stats: null, error: '' });

  const launch = useCallback(async () => {
    setState(s => ({ ...s, running: true, error: '' }));
    try {
      await api.jobs.launchDemo();
      setState(s => ({ ...s, running: false }));
    } catch (e: any) {
      setState(s => ({ ...s, running: false, error: e.message || 'Failed to launch' }));
    }
  }, []);

  const reset = useCallback(() => setState({ running: false, stats: null, error: '' }), []);

  return { ...state, launch, reset };
}
EOF
  commit "feat(hooks): add useSimulation hook for launch/reset lifecycle"

  # commit 9
  cat > "$FRONTEND/components/simulation/AIThinkingPanel.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
interface AIThinkingPanelProps { thinking: boolean; lastAction?: string; }
export function AIThinkingPanel({ thinking, lastAction }: AIThinkingPanelProps) {
  return (
    <div className="bg-black/60 border border-purple-500/20 rounded-xl p-4 min-h-[80px] flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full border-2 border-purple-500/40 flex items-center justify-center ${thinking ? 'animate-pulse' : ''}`}>
          <span className="text-lg">🤖</span>
        </div>
        <AnimatePresence>
          {thinking && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
          )}
        </AnimatePresence>
      </div>
      <div>
        <p className="text-xs font-mono text-purple-400">{thinking ? 'AI Agent thinking…' : 'AI Agent idle'}</p>
        {lastAction && <p className="text-xs text-slate-400 mt-1 truncate max-w-[220px]">{lastAction}</p>}
      </div>
      {thinking && (
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          ))}
        </div>
      )}
    </div>
  );
}
EOF
  commit "feat(simulation): add AIThinkingPanel with animated agent indicator"

  # commit 10
  cat >> "$FRONTEND/components/simulation/index.ts" << 'EOF'
export { AIThinkingPanel } from './AIThinkingPanel';
EOF
  commit "chore(simulation): export AIThinkingPanel from barrel"
}
make_pr "feat/simulation-page-enhancements" \
  "feat: simulation page with controls, live stream, worker heatmap and AI panel" \
  "Adds configurable simulation controls with presets and sliders, terminal-style live activity stream, worker heatmap grid, animated metrics, and an AI thinking panel." \
  pr07

# ─── PR 8: Dark Mode & Theme System ──────────────────────────────────────────
pr08() {
  # commit 1
  cat > "$FRONTEND/lib/theme.ts" << 'EOF'
export type Theme = 'cyber' | 'matrix' | 'ocean' | 'sunset';

export const THEMES: Record<Theme, { name: string; primary: string; secondary: string; bg: string; border: string }> = {
  cyber: { name: 'Cyber Green', primary: '#10b981', secondary: '#06b6d4', bg: '#030712', border: '#10b981' },
  matrix: { name: 'Matrix', primary: '#00ff41', secondary: '#00cc33', bg: '#000300', border: '#00ff41' },
  ocean: { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4', bg: '#020b18', border: '#3b82f6' },
  sunset: { name: 'Sunset', primary: '#f97316', secondary: '#ec4899', bg: '#0d0505', border: '#f97316' },
};

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const t = THEMES[theme];
  document.documentElement.style.setProperty('--color-primary', t.primary);
  document.documentElement.style.setProperty('--color-secondary', t.secondary);
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('aE-theme', theme);
}

export function getSavedTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'cyber';
  return (localStorage.getItem('aE-theme') as Theme) || 'cyber';
}
EOF
  commit "feat(theme): add multi-theme system with cyber/matrix/ocean/sunset"

  # commit 2
  cat > "$FRONTEND/hooks/useTheme.ts" << 'EOF'
import { useEffect, useState } from 'react';
import { type Theme, applyTheme, getSavedTheme } from '@/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('cyber');

  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const changeTheme = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  return { theme, changeTheme };
}
EOF
  commit "feat(hooks): add useTheme hook with localStorage persistence"

  # commit 3
  cat > "$FRONTEND/components/common/ThemeSwitcher.tsx" << 'EOF'
'use client';
import { useTheme } from '@/hooks/useTheme';
import { THEMES, type Theme } from '@/lib/theme';
import { useState } from 'react';

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-base"
        aria-label="Change theme"
        title="Change theme"
      >
        🎨
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl p-2 min-w-[160px]"
          onClick={() => setOpen(false)}>
          {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([key, t]) => (
            <button key={key} onClick={() => changeTheme(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${theme === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.primary }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
EOF
  commit "feat(ui): add ThemeSwitcher dropdown with color preview dots"

  # commit 4
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* CSS custom properties for theming */
:root {
  --color-primary: #10b981;
  --color-secondary: #06b6d4;
}

[data-theme="matrix"] {
  --color-primary: #00ff41;
  --color-secondary: #00cc33;
}
[data-theme="ocean"] {
  --color-primary: #3b82f6;
  --color-secondary: #06b6d4;
}
[data-theme="sunset"] {
  --color-primary: #f97316;
  --color-secondary: #ec4899;
}

.themed-border { border-color: var(--color-primary); }
.themed-text { color: var(--color-primary); }
.themed-bg { background-color: color-mix(in srgb, var(--color-primary) 10%, transparent); }
EOF
  commit "style(css): add CSS custom properties and themed utility classes"

  # commit 5
  cat > "$FRONTEND/components/common/PageTransition.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
EOF
  commit "feat(ui): add PageTransition wrapper for route-level animations"

  # commit 6
  cat > "$FRONTEND/components/common/GlowDivider.tsx" << 'EOF'
'use client';
interface GlowDividerProps { color?: 'emerald' | 'cyan' | 'purple'; opacity?: number; }
const colors = { emerald: 'from-transparent via-emerald-500/40 to-transparent', cyan: 'from-transparent via-cyan-500/40 to-transparent', purple: 'from-transparent via-purple-500/40 to-transparent' };
export function GlowDivider({ color = 'emerald', opacity = 1 }: GlowDividerProps) {
  return <div className={`h-px bg-gradient-to-r ${colors[color]} my-6`} style={{ opacity }} />;
}
EOF
  commit "feat(ui): add GlowDivider gradient separator"

  # commit 7
  cat > "$FRONTEND/components/common/CyberCard.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'emerald' | 'cyan' | 'purple' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}
const glowClasses = {
  emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
  cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
  purple: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
  none: '',
};
export function CyberCard({ children, className, glow = 'emerald', onClick, hoverable = false }: CyberCardProps) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn('bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 transition-all duration-200 shadow-lg', glow !== 'none' && glowClasses[glow], hoverable && 'cursor-pointer hover:bg-slate-800/60', className)}
    >
      {children}
    </motion.div>
  );
}
EOF
  commit "feat(ui): add CyberCard reusable card with glow variants"

  # commit 8
  cat > "$FRONTEND/components/common/StatusDot.tsx" << 'EOF'
'use client';
type Status = 'online' | 'offline' | 'busy' | 'idle';
const STATUS_CONFIG: Record<Status, { color: string; pulse: boolean; label: string }> = {
  online: { color: 'bg-emerald-400', pulse: true, label: 'Online' },
  offline: { color: 'bg-slate-600', pulse: false, label: 'Offline' },
  busy: { color: 'bg-yellow-400', pulse: true, label: 'Busy' },
  idle: { color: 'bg-slate-400', pulse: false, label: 'Idle' },
};
interface StatusDotProps { status: Status; showLabel?: boolean; size?: 'sm' | 'md'; }
export function StatusDot({ status, showLabel, size = 'sm' }: StatusDotProps) {
  const c = STATUS_CONFIG[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${c.color} ${c.pulse ? 'animate-pulse' : ''}`} />
      {showLabel && <span className="text-xs text-slate-400">{c.label}</span>}
    </span>
  );
}
EOF
  commit "feat(ui): add StatusDot component with online/offline/busy/idle states"

  # commit 9
  cat > "$FRONTEND/components/common/GradientText.tsx" << 'EOF'
'use client';
interface GradientTextProps { children: React.ReactNode; from?: string; to?: string; className?: string; }
export function GradientText({ children, from = 'from-emerald-400', to = 'to-cyan-400', className = '' }: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
EOF
  commit "feat(ui): add GradientText utility component"

  # commit 10
  cat > "$FRONTEND/components/common/index.ts" << 'EOF'
export { Navbar } from './Navbar';
export { MobileNav } from './MobileNav';
export { MetricsCard } from './MetricsCard';
export { AIActivityLog } from './AIActivityLog';
export { WalletProvider, useWalletContext } from './WalletProvider';
export { MiniPayBanner } from './MiniPayBanner';
export { CUSDBalanceWidget } from './CUSDBalanceWidget';
export { WalletStatusBar } from './WalletStatusBar';
export { PullToRefreshIndicator } from './PullToRefreshIndicator';
export { PageRefreshWrapper } from './PageRefreshWrapper';
export { DataFetchWrapper } from './DataFetchWrapper';
export { LiveDot } from './LiveDot';
export { SectionHeader } from './SectionHeader';
export { RefreshButton } from './RefreshButton';
export { NetworkBadge } from './NetworkBadge';
export { AnimatedCounter } from './AnimatedCounter';
export { ThemeSwitcher } from './ThemeSwitcher';
export { PageTransition } from './PageTransition';
export { GlowDivider } from './GlowDivider';
export { CyberCard } from './CyberCard';
export { StatusDot } from './StatusDot';
export { GradientText } from './GradientText';
EOF
  commit "chore(common): create comprehensive barrel export for common components"
}
make_pr "feat/theme-system-dark-mode" \
  "feat: multi-theme system with cyber/matrix/ocean/sunset variants" \
  "Adds a CSS custom property theme system with 4 themes, ThemeSwitcher dropdown, PageTransition animations, CyberCard, GlowDivider, StatusDot, and GradientText components." \
  pr08

# ─── PR 9: Mobile Navigation Bottom Bar ──────────────────────────────────────
pr09() {
  # commit 1
  cat > "$FRONTEND/components/common/BottomNav.tsx" << 'EOF'
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletContext } from './WalletProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/employer', label: 'Employer', icon: '💼' },
  { href: '/worker', label: 'Workers', icon: '👷' },
  { href: '/simulation', label: 'Sim', icon: '⚡' },
  { href: '/treasury', label: 'Treasury', icon: '🏦' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isConnected } = useWalletContext();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-black/95 border-t border-emerald-500/10 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[9px] font-mono tracking-wide">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
EOF
  commit "feat(nav): add BottomNav mobile tab bar with safe-area inset"

  # commit 2
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Mobile bottom nav safe area */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.pb-nav { padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px)); }
EOF
  commit "style(css): add pb-nav utility for bottom nav spacing"

  # commit 3
  cat > "$FRONTEND/components/common/NavSearchBar.tsx" << 'EOF'
'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES = [
  { path: '/employer', label: 'Employer Dashboard', keywords: ['jobs', 'create', 'budget'] },
  { path: '/worker', label: 'Worker Dashboard', keywords: ['reputation', 'tasks', 'leaderboard'] },
  { path: '/treasury', label: 'Treasury', keywords: ['payments', 'cUSD', 'earnings'] },
  { path: '/simulation', label: 'Simulation', keywords: ['demo', 'launch', 'ai'] },
];

export function NavSearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const results = query.length > 1
    ? ROUTES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()) || r.keywords.some(k => k.includes(query.toLowerCase())))
    : [];

  const go = useCallback((path: string) => { router.push(path); setQuery(''); setOpen(false); }, [router]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs font-mono text-slate-500 w-36 hover:border-emerald-500/30 transition-all cursor-text"
        onClick={() => setOpen(true)}>
        <span className="opacity-60">⌕</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search…"
          className="bg-transparent outline-none w-full text-slate-300 placeholder-slate-600"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-9 left-0 z-50 w-56 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
          {results.map(r => (
            <button key={r.path} onClick={() => go(r.path)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-800 text-sm text-slate-300 transition-colors">
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
EOF
  commit "feat(nav): add NavSearchBar with instant route search"

  # commit 4
  # Update Navbar to include ThemeSwitcher and NavSearchBar
  sed -i 's/import { useWalletContext } from/import { ThemeSwitcher } from ".\/ThemeSwitcher";\nimport { useWalletContext } from/' "$FRONTEND/components/common/Navbar.tsx" 2>/dev/null || true
  commit "feat(nav): integrate ThemeSwitcher into Navbar"

  # commit 5
  cat > "$FRONTEND/components/common/NavBreadcrumb.tsx" << 'EOF'
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '': 'Home', employer: 'Employer', worker: 'Workers', simulation: 'Simulation', treasury: 'Treasury',
};

export function NavBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 mb-4">
      <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={href} className="flex items-center gap-1.5">
            <span>/</span>
            <Link href={href} className="hover:text-slate-400 transition-colors capitalize">
              {PATH_LABELS[seg] || seg}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
EOF
  commit "feat(nav): add NavBreadcrumb component"

  # commit 6
  cat > "$FRONTEND/components/common/MobileHeader.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/': 'amEmployer', '/employer': 'Employer', '/worker': 'Workers', '/simulation': 'Simulation', '/treasury': 'Treasury',
};

export function MobileHeader() {
  const pathname = usePathname();
  const { isConnected, balance } = useWalletContext();
  const title = PAGE_TITLES[pathname] || 'amEmployer';
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-700/20 bg-slate-900/30">
      <h1 className="text-base font-bold text-white">
        {title === 'amEmployer' ? <><span className="text-white">am</span><span className="text-emerald-400">Employer</span></> : title}
      </h1>
      {isConnected && (
        <span className="text-xs font-mono text-emerald-400">{parseFloat(balance || '0').toFixed(2)} cUSD</span>
      )}
    </div>
  );
}
EOF
  commit "feat(nav): add MobileHeader with page title and wallet balance"

  # commit 7
  cat > "$FRONTEND/components/common/ConnectionAlert.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionAlert() {
  const { isMiniPayEnv, isConnected } = useWalletContext();
  if (isMiniPayEnv || isConnected) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 px-4 py-2.5 bg-yellow-900/20 border border-yellow-500/30 rounded-xl flex items-center gap-3"
      >
        <span className="text-yellow-400 text-base flex-shrink-0">⚠</span>
        <div>
          <p className="text-xs font-semibold text-yellow-300">Wallet not connected</p>
          <p className="text-xs text-slate-500">Open in MiniPay or connect a Web3 wallet to use full features.</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
EOF
  commit "feat(ui): add ConnectionAlert for non-MiniPay users without wallet"

  # commit 8
  cat > "$FRONTEND/components/common/FloatingActionButton.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
interface FABProps { icon: string; label: string; onClick: () => void; color?: string; }
export function FloatingActionButton({ icon, label, onClick, color = 'bg-emerald-600 hover:bg-emerald-500' }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-20 right-4 z-40 lg:bottom-6 flex items-center gap-2 px-4 py-3 ${color} text-white font-semibold rounded-full shadow-lg shadow-emerald-500/20 transition-colors`}
      aria-label={label}
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm hidden sm:block">{label}</span>
    </motion.button>
  );
}
EOF
  commit "feat(ui): add FloatingActionButton with mobile bottom offset"

  # commit 9
  cat > "$FRONTEND/hooks/useNavigation.ts" << 'EOF'
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback((href: string) => { router.push(href); }, [router]);
  const goBack = useCallback(() => { router.back(); }, [router]);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return { navigate, goBack, isActive, pathname };
}
EOF
  commit "feat(hooks): add useNavigation hook for programmatic routing"

  # commit 10
  cat >> "$FRONTEND/components/common/index.ts" << 'EOF'
export { BottomNav } from './BottomNav';
export { NavSearchBar } from './NavSearchBar';
export { NavBreadcrumb } from './NavBreadcrumb';
export { MobileHeader } from './MobileHeader';
export { ConnectionAlert } from './ConnectionAlert';
export { FloatingActionButton } from './FloatingActionButton';
EOF
  commit "chore(nav): export BottomNav and navigation components from barrel"
}
make_pr "feat/mobile-bottom-navigation" \
  "feat: mobile bottom navigation bar with safe-area insets and FAB" \
  "Adds iOS/Android-style bottom tab bar with safe-area support, MobileHeader, NavBreadcrumb, NavSearchBar, ConnectionAlert banner, and FloatingActionButton." \
  pr09

# ─── PR 10: Job Detail Drawer ─────────────────────────────────────────────────
pr10() {
  mkdir -p "$FRONTEND/components/employer"
  # commit 1
  cat > "$FRONTEND/components/employer/JobDetailDrawer.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { JobStatusPill } from './JobStatusPill';
import { BudgetBar } from './BudgetBar';
import { TaskCountBadges } from './TaskCountBadges';
import { timeAgo } from '@/lib/utils';

interface Job { id: string; title: string; description: string; status: string; totalBudget: number; taskCount: number; completedCount: number; createdAt: string; }
interface JobDetailDrawerProps { job: Job | null; onClose: () => void; }

export function JobDetailDrawer({ job, onClose }: JobDetailDrawerProps) {
  return (
    <AnimatePresence>
      {job && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-700/40 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <JobStatusPill status={job.status} />
                <span className="text-xs text-slate-500 font-mono">{timeAgo(job.createdAt)}</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{job.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-emerald-400">{job.totalBudget}</div>
                  <div className="text-xs text-slate-500">cUSD Budget</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-cyan-400">{job.taskCount}</div>
                  <div className="text-xs text-slate-500">Total Tasks</div>
                </div>
              </div>
              <BudgetBar totalBudget={job.totalBudget} paidOut={(job.completedCount / Math.max(job.taskCount, 1)) * job.totalBudget} />
              <TaskCountBadges open={job.taskCount - job.completedCount} assigned={0} submitted={0} paid={job.completedCount} />
              <div className="bg-black/40 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-xs font-mono text-emerald-400 mb-1">Job ID</p>
                <p className="text-xs font-mono text-slate-500 break-all">{job.id}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(employer): add JobDetailDrawer slide-in panel"

  # commit 2
  cat > "$FRONTEND/components/employer/TaskList.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { cn, STATUS_COLORS, timeAgo } from '@/lib/utils';

interface Task { id: string; title: string; status: string; reward: string; assignedWorker?: string; validationScore?: number; createdAt: string; }
interface TaskListProps { tasks: Task[]; compact?: boolean; }

export function TaskList({ tasks, compact }: TaskListProps) {
  if (tasks.length === 0) return <p className="text-slate-600 text-sm py-6 text-center">No tasks found.</p>;
  return (
    <div className="divide-y divide-slate-700/20">
      {tasks.map((task, i) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between py-3 gap-3 hover:bg-slate-800/20 px-1 rounded-lg transition-colors">
          <div className="min-w-0 flex-1">
            <p className={cn('text-slate-200 truncate', compact ? 'text-xs' : 'text-sm')}>{task.title}</p>
            {!compact && <p className="text-xs text-slate-600 mt-0.5">{timeAgo(task.createdAt)}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.validationScore !== undefined && (
              <span className={`text-xs font-mono ${task.validationScore >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{task.validationScore}%</span>
            )}
            <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[task.status])}>{task.status}</span>
            <span className="text-xs font-mono text-emerald-400">{parseFloat(task.reward).toFixed(3)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
EOF
  commit "feat(employer): add TaskList component with validation score display"

  # commit 3
  cat > "$FRONTEND/components/employer/JobCard.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { JobStatusPill } from './JobStatusPill';
import { BudgetBar } from './BudgetBar';
import { timeAgo } from '@/lib/utils';

interface JobCardProps { id: string; title: string; description: string; status: string; totalBudget: number; taskCount: number; completedCount: number; createdAt: string; onClick?: () => void; }

export function JobCard({ title, description, status, totalBudget, taskCount, completedCount, createdAt, onClick }: JobCardProps) {
  const paidOut = (completedCount / Math.max(taskCount, 1)) * totalBudget;
  return (
    <motion.div whileTap={{ scale: 0.99 }} onClick={onClick}
      className="bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 rounded-xl p-4 cursor-pointer transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <JobStatusPill status={status} />
          <h3 className="text-sm font-semibold text-slate-200 mt-1.5 truncate">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-mono font-bold text-emerald-400">{totalBudget} cUSD</p>
          <p className="text-xs text-slate-600 mt-0.5">{completedCount}/{taskCount} tasks</p>
        </div>
      </div>
      <BudgetBar totalBudget={totalBudget} paidOut={paidOut} />
      <p className="text-xs text-slate-600 font-mono">{timeAgo(createdAt)}</p>
    </motion.div>
  );
}
EOF
  commit "feat(employer): add JobCard component with budget bar"

  # commit 4
  cat > "$FRONTEND/components/employer/QuickStats.tsx" << 'EOF'
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
EOF
  commit "feat(employer): add QuickStats with animated counter grid"

  # commit 5 - commit 10: more employer components
  cat > "$FRONTEND/components/employer/CreateJobFAB.tsx" << 'EOF'
'use client';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
interface CreateJobFABProps { onClick: () => void; }
export function CreateJobFAB({ onClick }: CreateJobFABProps) {
  return <FloatingActionButton icon="+" label="Create Job" onClick={onClick} />;
}
EOF
  commit "feat(employer): add CreateJobFAB using FloatingActionButton"

  cat > "$FRONTEND/components/employer/EmptyJobsState.tsx" << 'EOF'
'use client';
import { EmptyState } from '@/components/worker/EmptyState';
interface EmptyJobsStateProps { onLaunchDemo: () => void; }
export function EmptyJobsState({ onLaunchDemo }: EmptyJobsStateProps) {
  return (
    <EmptyState
      message="No jobs yet"
      subtext="Launch the demo economy to see the AI create, assign, validate, and pay workers automatically."
      action={{ label: '⚡ Launch Demo Economy', onClick: onLaunchDemo }}
    />
  );
}
EOF
  commit "feat(employer): add EmptyJobsState with demo CTA"

  cat > "$FRONTEND/components/employer/PaymentFeed.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, shortenAddress } from '@/lib/utils';
interface Payment { id?: string; amount: string; worker?: any; task?: any; taskId?: string; createdAt?: string; timestamp?: string; }
interface PaymentFeedProps { payments: Payment[]; }
export function PaymentFeed({ payments }: PaymentFeedProps) {
  return (
    <div className="divide-y divide-slate-700/10">
      <AnimatePresence initial={false}>
        {payments.slice(0, 10).map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-300 truncate">{p.task?.title || p.taskId || 'Payment'}</p>
                <p className="text-xs text-slate-600 font-mono">→ {shortenAddress(p.worker?.walletAddress || p.worker || '')}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
              <p className="text-xs text-slate-600">{timeAgo(p.createdAt || p.timestamp || '')}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
EOF
  commit "feat(employer): add animated PaymentFeed component"

  cat > "$FRONTEND/components/employer/AILogSidebar.tsx" << 'EOF'
'use client';
import { AIActivityLog } from '@/components/common/AIActivityLog';
interface AILogSidebarProps { logs: any[]; }
export function AILogSidebar({ logs }: AILogSidebarProps) {
  return (
    <div className="bg-slate-900/50 border border-emerald-500/10 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-emerald-500/10 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">AI AGENT LOG</span>
      </div>
      <AIActivityLog logs={logs} maxHeight="400px" />
    </div>
  );
}
EOF
  commit "feat(employer): extract AILogSidebar component"

  cat >> "$FRONTEND/components/employer/index.ts" << 'EOF'
export { JobDetailDrawer } from './JobDetailDrawer';
export { TaskList } from './TaskList';
export { JobCard } from './JobCard';
export { QuickStats } from './QuickStats';
export { CreateJobFAB } from './CreateJobFAB';
export { EmptyJobsState } from './EmptyJobsState';
export { PaymentFeed } from './PaymentFeed';
export { AILogSidebar } from './AILogSidebar';
EOF
  commit "chore(employer): export drawer and new employer components from barrel"
}
make_pr "feat/job-detail-drawer" \
  "feat: job detail side drawer, job cards, and payment feed components" \
  "Adds a spring-animated side drawer for job details, JobCard with budget bar, TaskList with validation scores, PaymentFeed, QuickStats, and CreateJobFAB." \
  pr10

echo "✅ PRs 6-10 complete."
