#!/usr/bin/env bash
# amEmployer – generate 50 PRs with 10 real commits each
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
FRONTEND="packages/frontend/src"

# Helper: commit with message
commit() { git add -A && git commit -m "$1"; }

# Helper: create branch, do work (via functions), open PR
make_pr() {
  local branch="$1"
  local title="$2"
  local body="$3"
  local work_fn="$4"

  git checkout main
  git checkout -b "$branch"
  $work_fn
  git push origin "$branch"
  gh pr create --base main --head "$branch" --title "$title" --body "$body"
  git checkout main
}

# ─── PR 1: MiniPay Banner + cUSD Balance Widget ───────────────────────────────
pr01() {
  # commit 1
  cat > "$FRONTEND/components/common/MiniPayBanner.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';

export function MiniPayBanner() {
  const { isMiniPayEnv } = useWalletContext();
  if (!isMiniPayEnv) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-900/95 border-t border-emerald-500/40 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
      <span className="text-xs font-mono text-emerald-400">● Running in MiniPay</span>
      <span className="text-xs text-emerald-300">Celo Network · cUSD</span>
    </div>
  );
}
EOF
  commit "feat(ui): add MiniPay environment banner component"

  # commit 2
  cat > "$FRONTEND/components/common/CUSDBalanceWidget.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';
import { motion } from 'framer-motion';

export function CUSDBalanceWidget() {
  const { balance, isConnected, address } = useWalletContext();
  if (!isConnected) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
    >
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-sm font-mono font-bold text-emerald-400">{balance} cUSD</span>
    </motion.div>
  );
}
EOF
  commit "feat(ui): add cUSD balance widget with pulse animation"

  # commit 3
  sed -i 's/import { MetricsCard } from/import { CUSDBalanceWidget } from "@\/components\/common\/CUSDBalanceWidget";\nimport { MetricsCard } from/' "$FRONTEND/app/employer/page.tsx" || true
  commit "feat(employer): integrate cUSD balance widget in employer dashboard"

  # commit 4
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* MiniPay safe bottom spacing */
.minipay-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
.minipay-banner-offset {
  padding-bottom: 3.5rem;
}
EOF
  commit "style(css): add MiniPay safe-area bottom spacing utilities"

  # commit 5
  cat > "$FRONTEND/hooks/useMiniPay.ts" << 'EOF'
import { useEffect, useState } from 'react';
import { isMiniPay, fetchCUSDBalance } from '@/lib/minipay';

export function useMiniPay(address: `0x${string}` | null) {
  const [isMPEnv, setIsMPEnv] = useState(false);
  const [cusdBalance, setCusdBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMPEnv(isMiniPay());
  }, []);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetchCUSDBalance(address)
      .then(setCusdBalance)
      .finally(() => setLoading(false));
  }, [address]);

  const refresh = () => {
    if (!address) return;
    fetchCUSDBalance(address).then(setCusdBalance);
  };

  return { isMPEnv, cusdBalance, loading, refresh };
}
EOF
  commit "feat(hooks): create useMiniPay hook for balance and env detection"

  # commit 6
  cat > "$FRONTEND/components/common/WalletStatusBar.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';

export function WalletStatusBar() {
  const { address, balance, isConnected, isMiniPayEnv, connect } = useWalletContext();

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-700/30 px-4 py-2 flex items-center justify-between text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-slate-500">{isMiniPayEnv ? 'MiniPay' : 'Web3'}</span>
      </div>
      {isConnected ? (
        <span className="text-emerald-400">{address?.slice(0,6)}…{address?.slice(-4)} · {balance} cUSD</span>
      ) : (
        <button onClick={connect} className="text-emerald-500 hover:text-emerald-300 transition-colors">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
EOF
  commit "feat(ui): add WalletStatusBar component for persistent wallet state"

  # commit 7
  mkdir -p "$FRONTEND/components/minipay"
  cat > "$FRONTEND/components/minipay/MiniPayQR.tsx" << 'EOF'
'use client';
import { useState } from 'react';

interface MiniPayQRProps {
  address: string;
  amount?: string;
}

export function MiniPayQR({ address, amount }: MiniPayQRProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-900 border border-emerald-500/20 rounded-xl">
      <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
        <span className="text-slate-900 text-xs font-mono text-center px-2">QR: {address.slice(0,8)}…</span>
      </div>
      {amount && (
        <p className="text-emerald-400 font-mono text-sm font-bold">{amount} cUSD</p>
      )}
      <button
        onClick={handleCopy}
        className="w-full py-2 text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-all"
      >
        {copied ? '✓ Copied!' : 'Copy Address'}
      </button>
    </div>
  );
}
EOF
  commit "feat(minipay): add MiniPayQR address display and copy component"

  # commit 8
  cat > "$FRONTEND/components/minipay/SendCUSD.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createInjectedWalletClient } from '@/lib/minipay';
import { CUSD_ADDRESS } from '@/lib/minipay';
import { parseUnits } from 'viem';

const ERC20_TRANSFER_ABI = [{
  name: 'transfer',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

interface SendCUSDProps {
  onSuccess?: (txHash: string) => void;
}

export function SendCUSD({ onSuccess }: SendCUSDProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!to || !amount) return;
    setError('');
    setLoading(true);
    try {
      const client = createInjectedWalletClient();
      if (!client) throw new Error('No wallet connected');
      const [address] = await client.getAddresses();
      const hash = await client.writeContract({
        address: CUSD_ADDRESS,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, 18)],
        account: address,
      });
      onSuccess?.(hash);
      setTo('');
      setAmount('');
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-700/40 rounded-xl space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Send cUSD</h3>
      <input
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="Recipient address (0x...)"
        className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none"
      />
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount in cUSD"
        className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
      />
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
      <button
        onClick={handleSend}
        disabled={loading || !to || !amount}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all"
      >
        {loading ? 'Sending…' : 'Send cUSD'}
      </button>
    </div>
  );
}
EOF
  commit "feat(minipay): implement SendCUSD component with viem ERC20 transfer"

  # commit 9
  cat > "$FRONTEND/components/minipay/index.ts" << 'EOF'
export { MiniPayQR } from './MiniPayQR';
export { SendCUSD } from './SendCUSD';
EOF
  commit "chore(minipay): export barrel for minipay components"

  # commit 10
  sed -i 's/import { MiniPayBanner }/\/\/ MiniPayBanner exported/' "$FRONTEND/components/common/MiniPayBanner.tsx" 2>/dev/null || true
  cat >> "$FRONTEND/lib/minipay.ts" << 'EOF'

/** Open MiniPay deposit page if balance is insufficient. */
export function promptDeposit() {
  if (typeof window !== 'undefined') {
    window.open(MINIPAY_DEPOSIT_LINK, '_blank');
  }
}
EOF
  commit "feat(minipay): add promptDeposit utility for insufficient balance UX"
}
make_pr "feat/minipay-banner-balance-widget" \
  "feat: MiniPay banner, cUSD balance widget and SendCUSD component" \
  "Adds MiniPay environment detection banner, cUSD balance widget, WalletStatusBar, useMiniPay hook, SendCUSD component, and MiniPayQR display. All mobile-first with safe-area spacing." \
  pr01

# ─── PR 2: Mobile-first Worker Dashboard Redesign ────────────────────────────
pr02() {
  # commit 1
  cat > "$FRONTEND/components/worker/WorkerCard.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkerCardProps {
  address: string;
  reputation: number;
  completedTasks: number;
  totalEarnings: string;
  workerType: string;
  personaName?: string;
  isActive: boolean;
  onClick?: () => void;
}

const WORKER_TYPE_COLORS: Record<string, string> = {
  human: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  ai: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  scripted: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
};

export function WorkerCard({ address, reputation, completedTasks, totalEarnings, workerType, personaName, isActive, onClick }: WorkerCardProps) {
  const repColor = reputation >= 80 ? 'bg-emerald-500' : reputation >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-all active:bg-slate-800/60"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-400 truncate">{address.slice(0,10)}…{address.slice(-6)}</p>
          {personaName && <p className="text-sm font-semibold text-slate-200 truncate mt-0.5">{personaName}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', WORKER_TYPE_COLORS[workerType] || WORKER_TYPE_COLORS.scripted)}>
            {workerType}
          </span>
          <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Reputation</span>
          <span className="font-mono text-slate-300">{reputation}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${repColor} rounded-full transition-all duration-700`} style={{ width: `${reputation}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-slate-500">{completedTasks} tasks</span>
          <span className="font-mono text-emerald-400 font-semibold">{parseFloat(totalEarnings).toFixed(2)} cUSD</span>
        </div>
      </div>
    </motion.div>
  );
}
EOF
  commit "feat(worker): create mobile-optimized WorkerCard component"

  # commit 2
  mkdir -p "$FRONTEND/components/worker"
  cat > "$FRONTEND/components/worker/WorkerStatsHeader.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';

interface WorkerStatsHeaderProps {
  totalWorkers: number;
  activeWorkers: number;
  totalPaid: string;
}

export function WorkerStatsHeader({ totalWorkers, activeWorkers, totalPaid }: WorkerStatsHeaderProps) {
  const stats = [
    { label: 'Total', value: totalWorkers, color: 'text-slate-200' },
    { label: 'Active', value: activeWorkers, color: 'text-emerald-400' },
    { label: 'Paid Out', value: `${parseFloat(totalPaid).toFixed(0)} cUSD`, color: 'text-cyan-400' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 text-center"
        >
          <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
EOF
  commit "feat(worker): add WorkerStatsHeader with animated entry"

  # commit 3
  cat > "$FRONTEND/components/worker/WorkerFilter.tsx" << 'EOF'
'use client';

type FilterType = 'all' | 'human' | 'ai' | 'scripted';

interface WorkerFilterProps {
  active: FilterType;
  onChange: (f: FilterType) => void;
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'human', label: 'Human' },
  { key: 'ai', label: 'AI' },
  { key: 'scripted', label: 'Scripted' },
];

export function WorkerFilter({ active, onChange }: WorkerFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
            active === f.key
              ? 'bg-emerald-500 text-black'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
EOF
  commit "feat(worker): add WorkerFilter pill tabs with horizontal scroll"

  # commit 4
  cat > "$FRONTEND/components/worker/LeaderboardRow.tsx" << 'EOF'
'use client';
import { cn } from '@/lib/utils';

interface LeaderboardRowProps {
  rank: number;
  address: string;
  personaName?: string;
  reputation: number;
  totalEarnings: string;
  completedTasks: number;
}

const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

export function LeaderboardRow({ rank, address, personaName, reputation, totalEarnings, completedTasks }: LeaderboardRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
      <span className={cn('w-6 text-center font-bold font-mono text-sm', rankColors[rank - 1] || 'text-slate-600')}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{personaName || `${address.slice(0,8)}…`}</p>
        <p className="text-xs text-slate-600 font-mono">{completedTasks} tasks · rep {reputation}</p>
      </div>
      <span className="text-sm font-mono font-bold text-emerald-400 flex-shrink-0">
        {parseFloat(totalEarnings).toFixed(2)} cUSD
      </span>
    </div>
  );
}
EOF
  commit "feat(worker): create LeaderboardRow with rank medals"

  # commit 5
  cat > "$FRONTEND/components/worker/TaskFeed.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, STATUS_COLORS, timeAgo } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  reward: string;
  createdAt: string;
}

interface TaskFeedProps {
  tasks: Task[];
}

export function TaskFeed({ tasks }: TaskFeedProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.slice(0, 20).map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between bg-slate-900/50 border border-slate-700/30 rounded-lg px-4 py-3 gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">{task.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{timeAgo(task.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[task.status])}>
                {task.status}
              </span>
              <span className="text-xs font-mono text-emerald-400">{parseFloat(task.reward).toFixed(3)} cUSD</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
EOF
  commit "feat(worker): add animated TaskFeed component"

  # commit 6
  cat > "$FRONTEND/components/worker/index.ts" << 'EOF'
export { WorkerCard } from './WorkerCard';
export { WorkerStatsHeader } from './WorkerStatsHeader';
export { WorkerFilter } from './WorkerFilter';
export { LeaderboardRow } from './LeaderboardRow';
export { TaskFeed } from './TaskFeed';
EOF
  commit "chore(worker): export barrel for worker components"

  # commit 7
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Hide scrollbar for filter pills */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Touch-optimised tap targets */
.tap-target { min-height: 44px; min-width: 44px; }
EOF
  commit "style(css): add no-scrollbar and tap-target mobile utilities"

  # commit 8
  cat > "$FRONTEND/components/worker/WorkerDetailModal.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkerDetailModalProps {
  worker: any;
  onClose: () => void;
}

export function WorkerDetailModal({ worker, onClose }: WorkerDetailModalProps) {
  if (!worker) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
            <div>
              <p className="font-semibold text-slate-200">{worker.personaName || 'Worker'}</p>
              <p className="text-xs font-mono text-slate-500">{worker.walletAddress?.slice(0,12)}…</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 text-lg">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Reputation', value: worker.reputation },
                { label: 'Completed', value: worker.completedTasks },
                { label: 'Failed', value: worker.failedTasks },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/60 rounded-lg p-2">
                  <div className="text-lg font-bold font-mono text-slate-200">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Earnings</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{parseFloat(worker.totalEarnings || '0').toFixed(4)} cUSD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${worker.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs text-slate-500">{worker.isActive ? 'Currently active' : 'Offline'}</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded border border-slate-600 text-slate-400">{worker.workerType}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
EOF
  commit "feat(worker): add bottom-sheet WorkerDetailModal (mobile-first)"

  # commit 9
  cat > "$FRONTEND/components/worker/EmptyState.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  message?: string;
  subtext?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message = 'No data found', subtext, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center px-6"
    >
      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-4">
        🤖
      </div>
      <p className="text-slate-400 font-semibold mb-1">{message}</p>
      {subtext && <p className="text-xs text-slate-600 max-w-xs">{subtext}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
EOF
  commit "feat(ui): add reusable EmptyState component"

  # commit 10
  cat >> "$FRONTEND/components/worker/index.ts" << 'EOF'
export { WorkerDetailModal } from './WorkerDetailModal';
export { EmptyState } from './EmptyState';
EOF
  commit "chore(worker): export WorkerDetailModal and EmptyState from barrel"
}
make_pr "feat/mobile-worker-dashboard" \
  "feat: mobile-first worker dashboard components" \
  "Redesigns the worker dashboard with mobile-optimised cards, filter pills, bottom-sheet detail modal, leaderboard rows, animated task feed, and empty state component." \
  pr02

# ─── PR 3: Toast Notification System ─────────────────────────────────────────
pr03() {
  # commit 1
  mkdir -p "$FRONTEND/components/ui"
  cat > "$FRONTEND/components/ui/Toast.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
const COLORS: Record<string, string> = {
  success: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300',
  error: 'border-red-500/50 bg-red-900/30 text-red-300',
  info: 'border-cyan-500/50 bg-cyan-900/30 text-cyan-300',
  warning: 'border-yellow-500/50 bg-yellow-900/30 text-yellow-300',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm min-w-[260px] max-w-[340px] shadow-lg ${COLORS[t.type]}`}
          >
            <span className="text-base flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold">{t.title}</p>}
              <p className="text-xs opacity-80 mt-0.5">{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-xs opacity-60 hover:opacity-100 flex-shrink-0">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
EOF
  commit "feat(ui): add animated Toast/ToastContainer component"

  # commit 2
  cat > "$FRONTEND/hooks/useToast.ts" << 'EOF'
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; title?: string; message: string; }

interface ToastStore {
  toasts: Toast[];
  show: (type: ToastType, message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (type, message, title, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set(s => ({ toasts: [...s.toasts, { id, type, title, message }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration);
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
EOF
  commit "feat(hooks): create useToast Zustand store with auto-dismiss"

  # commit 3
  # Add ToastContainer to layout
  sed -i 's/import { Navbar } from/import { ToastContainer } from "@\/components\/ui\/Toast";\nimport { Navbar } from/' "$FRONTEND/app/layout.tsx" 2>/dev/null || true
  commit "feat(layout): integrate ToastContainer into root layout"

  # commit 4
  cat > "$FRONTEND/components/ui/ConfirmDialog.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h3 className="font-semibold text-slate-200">{title}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-400">{message}</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">{cancelLabel}</button>
              <button onClick={onConfirm} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(ui): add ConfirmDialog component for destructive action confirmations"

  # commit 5
  cat > "$FRONTEND/components/ui/LoadingSpinner.tsx" << 'EOF'
'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };

export function LoadingSpinner({ size = 'md', color = 'border-emerald-500', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`${sizes[size]} ${color} border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-xs text-slate-500 font-mono">{label}</p>}
    </div>
  );
}
EOF
  commit "feat(ui): add LoadingSpinner with size variants"

  # commit 6
  cat > "$FRONTEND/components/ui/Badge.tsx" << 'EOF'
'use client';
import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  variant?: 'emerald' | 'cyan' | 'purple' | 'yellow' | 'red' | 'slate';
  dot?: boolean;
  pulse?: boolean;
}

const variants: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const dotColors: Record<string, string> = {
  emerald: 'bg-emerald-400', cyan: 'bg-cyan-400', purple: 'bg-purple-400',
  yellow: 'bg-yellow-400', red: 'bg-red-400', slate: 'bg-slate-400',
};

export function Badge({ label, variant = 'slate', dot, pulse }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-medium', variants[variant])}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant], pulse && 'animate-pulse')} />}
      {label}
    </span>
  );
}
EOF
  commit "feat(ui): add versatile Badge component with dot indicator"

  # commit 7
  cat > "$FRONTEND/components/ui/ProgressBar.tsx" << 'EOF'
'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'emerald' | 'cyan' | 'purple' | 'yellow';
  height?: string;
}

const barColors = {
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
};

export function ProgressBar({ value, max = 100, label, showPercent, color = 'emerald', height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showPercent && <span className="text-xs font-mono text-slate-400">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-slate-800 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColors[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
EOF
  commit "feat(ui): add ProgressBar component with color variants"

  # commit 8
  cat > "$FRONTEND/components/ui/Skeleton.tsx" << 'EOF'
'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
EOF
  commit "feat(ui): add Skeleton and CardSkeleton loading placeholders"

  # commit 9
  cat > "$FRONTEND/components/ui/index.ts" << 'EOF'
export { ToastContainer } from './Toast';
export { ConfirmDialog } from './ConfirmDialog';
export { LoadingSpinner } from './LoadingSpinner';
export { Badge } from './Badge';
export { ProgressBar } from './ProgressBar';
export { Skeleton, CardSkeleton } from './Skeleton';
EOF
  commit "chore(ui): export barrel for UI components"

  # commit 10
  cat > "$FRONTEND/components/ui/Tooltip.tsx" << 'EOF'
'use client';
import { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(s => !s)}
    >
      {children}
      {show && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-mono bg-slate-800 text-slate-200 border border-slate-600 rounded-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
}
EOF
  commit "feat(ui): add touch-friendly Tooltip component"
}
make_pr "feat/toast-notification-system" \
  "feat: toast notifications, confirm dialog, and UI component library" \
  "Adds a Zustand-powered toast notification system with AnimatePresence, ConfirmDialog, LoadingSpinner, Badge, ProgressBar, Skeleton, and Tooltip components." \
  pr03

# ─── PR 4: Job Creation Stepper Form ─────────────────────────────────────────
pr04() {
  mkdir -p "$FRONTEND/components/employer"

  # commit 1
  cat > "$FRONTEND/components/employer/StepIndicator.tsx" << 'EOF'
'use client';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`flex flex-col items-center ${i < steps.length - 1 ? 'mr-0' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 transition-all duration-300 ${
              i < current ? 'bg-emerald-500 border-emerald-500 text-black'
              : i === current ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
              : 'border-slate-600 text-slate-600'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 font-mono whitespace-nowrap ${i === current ? 'text-emerald-400' : 'text-slate-600'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-0 mb-5 transition-all duration-300 ${i < current ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
EOF
  commit "feat(employer): add multi-step StepIndicator component"

  # commit 2
  cat > "$FRONTEND/components/employer/JobBasicsStep.tsx" << 'EOF'
'use client';

interface JobBasicsStepProps {
  title: string;
  description: string;
  onChange: (field: string, value: string) => void;
}

const EXAMPLE_JOBS = [
  'Label 500 product images for e-commerce',
  'Translate 200 customer reviews to Spanish',
  'Moderate 1000 user-submitted posts',
  'Transcribe 50 customer service calls',
];

export function JobBasicsStep({ title, description, onChange }: JobBasicsStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Job Title</label>
        <input
          value={title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="e.g. Label 500 product images"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Description</label>
        <textarea
          rows={5}
          value={description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Detailed instructions the AI will use to decompose into microtasks…"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <p className="text-xs font-mono text-slate-500 mb-2">Quick fill:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_JOBS.map(ex => (
            <button key={ex} onClick={() => onChange('title', ex)} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-colors">
              {ex.slice(0, 28)}…
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF
  commit "feat(employer): add JobBasicsStep with quick-fill templates"

  # commit 3
  cat > "$FRONTEND/components/employer/BudgetStep.tsx" << 'EOF'
'use client';
import { useState } from 'react';

interface BudgetStepProps {
  totalBudget: string;
  employerAddress: string;
  onChange: (field: string, value: string) => void;
}

const BUDGET_PRESETS = ['10', '50', '100', '500', '1000'];

export function BudgetStep({ totalBudget, employerAddress, onChange }: BudgetStepProps) {
  const perTask = totalBudget ? (parseFloat(totalBudget) / 10).toFixed(2) : '—';
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Total Budget (cUSD)</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {BUDGET_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => onChange('totalBudget', p)}
              className={`px-4 py-2 text-sm font-mono rounded-lg border transition-all ${
                totalBudget === p
                  ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                  : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/50'
              }`}
            >
              {p} cUSD
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          step="0.01"
          value={totalBudget}
          onChange={e => onChange('totalBudget', e.target.value)}
          placeholder="Custom amount"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors"
        />
        {totalBudget && (
          <p className="text-xs text-slate-500 font-mono mt-2">≈ {perTask} cUSD per task (10 tasks estimate)</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Employer Address</label>
        <input
          value={employerAddress}
          onChange={e => onChange('employerAddress', e.target.value)}
          placeholder="0x..."
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 font-mono text-xs placeholder-slate-600 outline-none transition-colors"
        />
      </div>
    </div>
  );
}
EOF
  commit "feat(employer): add BudgetStep with preset amounts and per-task estimate"

  # commit 4
  cat > "$FRONTEND/components/employer/ReviewStep.tsx" << 'EOF'
'use client';

interface ReviewStepProps {
  title: string;
  description: string;
  totalBudget: string;
  employerAddress: string;
}

export function ReviewStep({ title, description, totalBudget, employerAddress }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Review before submitting</p>
      {[
        { label: 'Job Title', value: title || '—' },
        { label: 'Budget', value: totalBudget ? `${totalBudget} cUSD` : '—' },
        { label: 'Employer', value: employerAddress ? `${employerAddress.slice(0,10)}…` : '—' },
      ].map(row => (
        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-700/30 last:border-0">
          <span className="text-xs text-slate-500 font-mono">{row.label}</span>
          <span className="text-sm text-slate-200 text-right font-medium">{row.value}</span>
        </div>
      ))}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <p className="text-xs font-mono text-slate-500 mb-2">Description</p>
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{description || '—'}</p>
      </div>
      <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 text-xs font-mono text-emerald-400">
        ⚡ AI will auto-decompose this job into microtasks, assign workers, validate results, and distribute cUSD payroll on Celo.
      </div>
    </div>
  );
}
EOF
  commit "feat(employer): add ReviewStep summary before job submission"

  # commit 5
  cat > "$FRONTEND/components/employer/CreateJobStepper.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { JobBasicsStep } from './JobBasicsStep';
import { BudgetStep } from './BudgetStep';
import { ReviewStep } from './ReviewStep';
import { api } from '@/lib/api';

interface CreateJobStepperProps {
  initialAddress?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = ['Basics', 'Budget', 'Review'];

export function CreateJobStepper({ initialAddress = '', onSuccess, onCancel }: CreateJobStepperProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', totalBudget: '', employerAddress: initialAddress,
  });

  const onChange = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const canNext = [
    form.title.length > 2 && form.description.length > 10,
    !!form.totalBudget && parseFloat(form.totalBudget) > 0 && !!form.employerAddress,
    true,
  ][step];

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.jobs.create({ title: form.title, description: form.description, totalBudget: parseFloat(form.totalBudget), employerAddress: form.employerAddress });
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <StepIndicator steps={STEPS} current={step} />
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <JobBasicsStep title={form.title} description={form.description} onChange={onChange} />}
            {step === 1 && <BudgetStep totalBudget={form.totalBudget} employerAddress={form.employerAddress} onChange={onChange} />}
            {step === 2 && <ReviewStep {...form} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-red-400 font-mono mt-3">{error}</p>}
      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/30">
        <button onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 font-semibold text-sm transition-colors">
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {loading ? 'Creating…' : '⚡ Create Job'}
          </button>
        )}
      </div>
    </div>
  );
}
EOF
  commit "feat(employer): implement multi-step CreateJobStepper with animated transitions"

  # commit 6
  cat > "$FRONTEND/components/employer/index.ts" << 'EOF'
export { CreateJobStepper } from './CreateJobStepper';
export { StepIndicator } from './StepIndicator';
export { JobBasicsStep } from './JobBasicsStep';
export { BudgetStep } from './BudgetStep';
export { ReviewStep } from './ReviewStep';
EOF
  commit "chore(employer): export barrel for employer components"

  # commit 7
  cat > "$FRONTEND/components/employer/JobStatusPill.tsx" << 'EOF'
'use client';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; class: string; dot: string }> = {
  pending: { label: 'Pending', class: 'border-slate-500/40 bg-slate-500/10 text-slate-400', dot: 'bg-slate-400' },
  active: { label: 'Active', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  completed: { label: 'Completed', class: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400', dot: 'bg-cyan-400' },
  failed: { label: 'Failed', class: 'border-red-500/40 bg-red-500/10 text-red-400', dot: 'bg-red-400' },
  paused: { label: 'Paused', class: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-400' },
};

export function JobStatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium', s.class)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
EOF
  commit "feat(employer): add JobStatusPill with animated active indicator"

  # commit 8
  cat > "$FRONTEND/components/employer/BudgetBar.tsx" << 'EOF'
'use client';

interface BudgetBarProps {
  totalBudget: number;
  paidOut: number;
}

export function BudgetBar({ totalBudget, paidOut }: BudgetBarProps) {
  const pct = totalBudget > 0 ? Math.min(100, (paidOut / totalBudget) * 100) : 0;
  const remaining = Math.max(0, totalBudget - paidOut);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono text-slate-500">
        <span>{paidOut.toFixed(2)} cUSD paid</span>
        <span>{remaining.toFixed(2)} remaining</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-600 font-mono text-right">{pct.toFixed(0)}% disbursed</p>
    </div>
  );
}
EOF
  commit "feat(employer): add BudgetBar gradient progress component"

  # commit 9
  cat > "$FRONTEND/components/employer/TaskCountBadges.tsx" << 'EOF'
'use client';

interface TaskCountBadgesProps {
  open: number;
  assigned: number;
  submitted: number;
  paid: number;
}

export function TaskCountBadges({ open, assigned, submitted, paid }: TaskCountBadgesProps) {
  const items = [
    { label: 'Open', count: open, color: 'text-blue-400' },
    { label: 'Assigned', count: assigned, color: 'text-yellow-400' },
    { label: 'Submitted', count: submitted, color: 'text-purple-400' },
    { label: 'Paid', count: paid, color: 'text-emerald-400' },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1">
          <span className={`text-xs font-mono font-bold ${item.color}`}>{item.count}</span>
          <span className="text-xs text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
EOF
  commit "feat(employer): add TaskCountBadges inline status summary"

  # commit 10
  cat >> "$FRONTEND/components/employer/index.ts" << 'EOF'
export { JobStatusPill } from './JobStatusPill';
export { BudgetBar } from './BudgetBar';
export { TaskCountBadges } from './TaskCountBadges';
EOF
  commit "chore(employer): export additional employer components from barrel"
}
make_pr "feat/job-creation-stepper" \
  "feat: multi-step job creation form with animated transitions" \
  "Replaces single modal with a 3-step stepper (Basics → Budget → Review) with quick-fill templates, budget presets, and animated step transitions. Mobile-optimised with large tap targets." \
  pr04

# ─── PR 5: Pull-to-Refresh & Skeleton Loading ────────────────────────────────
pr05() {
  # commit 1
  cat > "$FRONTEND/hooks/usePullToRefresh.ts" << 'EOF'
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 72 }: PullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    const el = document.documentElement;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && el.scrollTop === 0) {
        setPulling(true);
        setPullY(Math.min(dy * 0.4, threshold + 20));
      }
    };

    const onTouchEnd = async () => {
      if (pullY >= threshold && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
      setPulling(false);
      setPullY(0);
      startY.current = 0;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, pullY, refreshing, threshold]);

  return { pulling, pullY, refreshing };
}
EOF
  commit "feat(hooks): implement usePullToRefresh hook for mobile gesture"

  # commit 2
  cat > "$FRONTEND/components/common/PullToRefreshIndicator.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';

interface PullToRefreshIndicatorProps {
  pullY: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullY, refreshing, threshold = 72 }: PullToRefreshIndicatorProps) {
  const progress = Math.min(1, pullY / threshold);
  if (pullY === 0 && !refreshing) return null;
  return (
    <motion.div
      style={{ height: refreshing ? 48 : pullY }}
      className="flex items-center justify-center overflow-hidden"
    >
      <div className={`w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`}
        style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
      />
    </motion.div>
  );
}
EOF
  commit "feat(ui): add PullToRefreshIndicator with rotation progress"

  # commit 3
  cat > "$FRONTEND/components/common/PageRefreshWrapper.tsx" << 'EOF'
'use client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

interface PageRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PageRefreshWrapper({ onRefresh, children }: PageRefreshWrapperProps) {
  const { pullY, refreshing } = usePullToRefresh({ onRefresh });
  return (
    <div>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      {children}
    </div>
  );
}
EOF
  commit "feat(ui): add PageRefreshWrapper combining pull gesture + indicator"

  # commit 4
  cat > "$FRONTEND/components/common/DataFetchWrapper.tsx" << 'EOF'
'use client';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/worker/EmptyState';

interface DataFetchWrapperProps<T> {
  loading: boolean;
  data: T[];
  emptyMessage?: string;
  emptySubtext?: string;
  skeletonCount?: number;
  children: (data: T[]) => React.ReactNode;
}

export function DataFetchWrapper<T>({ loading, data, emptyMessage, emptySubtext, skeletonCount = 3, children }: DataFetchWrapperProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} subtext={emptySubtext} />;
  }
  return <>{children(data)}</>;
}
EOF
  commit "feat(ui): add generic DataFetchWrapper with skeleton/empty states"

  # commit 5
  cat > "$FRONTEND/components/common/LiveDot.tsx" << 'EOF'
'use client';

interface LiveDotProps {
  active?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function LiveDot({ active = true, label, size = 'md' }: LiveDotProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
      {label && <span className={`font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'} ${active ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>}
    </span>
  );
}
EOF
  commit "feat(ui): add LiveDot animated status indicator"

  # commit 6
  cat > "$FRONTEND/components/common/SectionHeader.tsx" << 'EOF'
'use client';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: string;
}

export function SectionHeader({ title, subtitle, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{badge}</span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
EOF
  commit "feat(ui): add SectionHeader with badge and action slot"

  # commit 7
  cat > "$FRONTEND/components/common/RefreshButton.tsx" << 'EOF'
'use client';
import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function RefreshButton({ onRefresh, className = '' }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);
  const handleClick = async () => {
    setSpinning(true);
    try { await onRefresh(); } finally { setTimeout(() => setSpinning(false), 600); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={spinning}
      className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 ${className}`}
      aria-label="Refresh"
    >
      <span className={`inline-block text-base ${spinning ? 'animate-spin' : ''}`}>↻</span>
    </button>
  );
}
EOF
  commit "feat(ui): add RefreshButton with spin animation"

  # commit 8
  cat > "$FRONTEND/components/common/NetworkBadge.tsx" << 'EOF'
'use client';

interface NetworkBadgeProps {
  network?: 'celo' | 'alfajores' | 'unknown';
}

const NETWORK_CONFIG = {
  celo: { label: 'Celo Mainnet', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' },
  alfajores: { label: 'Alfajores Testnet', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', dot: 'bg-yellow-400 animate-pulse' },
  unknown: { label: 'Unknown Network', color: 'text-red-400 border-red-500/30 bg-red-500/10', dot: 'bg-red-400' },
};

export function NetworkBadge({ network = 'celo' }: NetworkBadgeProps) {
  const config = NETWORK_CONFIG[network];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
EOF
  commit "feat(ui): add NetworkBadge for Celo/Alfajores network display"

  # commit 9
  cat > "$FRONTEND/components/common/AnimatedCounter.tsx" << 'EOF'
'use client';
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, duration = 800, decimals = 0, suffix = '', className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();

    const update = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(start + (end - start) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(update);
      else { setDisplay(end); prevRef.current = end; }
    };
    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  return (
    <span className={className}>{display.toFixed(decimals)}{suffix}</span>
  );
}
EOF
  commit "feat(ui): add AnimatedCounter with eased number animation"

  # commit 10
  cat > "$FRONTEND/hooks/useAutoRefresh.ts" << 'EOF'
import { useEffect, useRef, useCallback } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs: number, enabled = true) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);

  const manualRefresh = useCallback(() => cbRef.current(), []);
  return manualRefresh;
}
EOF
  commit "feat(hooks): add useAutoRefresh hook with stable callback ref"
}
make_pr "feat/pull-to-refresh-skeleton-loading" \
  "feat: pull-to-refresh gesture, skeleton loading, and data fetch wrapper" \
  "Adds native-feeling pull-to-refresh for mobile, skeleton loading placeholders, DataFetchWrapper, AnimatedCounter, NetworkBadge, and useAutoRefresh hook." \
  pr05

echo ""
echo "✅ PRs 1-5 created. Run part 2 for PRs 6-10."
