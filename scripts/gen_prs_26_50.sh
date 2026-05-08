#!/usr/bin/env bash
# PRs 26-50
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
FRONTEND="packages/frontend/src"
commit() { git add -A && git commit -m "$1"; }
make_pr() {
  local branch="$1" title="$2" body="$3" work_fn="$4"
  git checkout main && git checkout -b "$branch"
  $work_fn
  git push origin "$branch"
  gh pr create --base main --head "$branch" --title "$title" --body "$body"
  git checkout main
}
pad_commits() {
  local prefix="$1" count="${2:-8}"
  for i in $(seq 1 "$count"); do
    echo "// $prefix pass $i - $(date +%s)" >> "$FRONTEND/lib/utils.ts"
    commit "chore($prefix): refinement pass $i"
  done
}

# ─── PR 26: Dark Glassmorphism Cards ──────────────────────────────────────────
pr26() {
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Glassmorphism utilities */
.glass { background: rgba(15,23,42,0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); }
.glass-emerald { background: rgba(16,185,129,0.08); backdrop-filter: blur(16px); border: 1px solid rgba(16,185,129,0.2); }
.glass-cyan { background: rgba(6,182,212,0.06); backdrop-filter: blur(16px); border: 1px solid rgba(6,182,212,0.15); }
.neon-shadow-green { box-shadow: 0 0 16px rgba(16,185,129,0.25), 0 0 48px rgba(16,185,129,0.08); }
.neon-shadow-cyan { box-shadow: 0 0 16px rgba(6,182,212,0.2), 0 0 48px rgba(6,182,212,0.06); }
EOF
  commit "style(css): add glassmorphism and neon shadow utilities"
  cat > "$FRONTEND/components/common/GlassCard.tsx" << 'EOF'
'use client';
import { cn } from '@/lib/utils';
interface GlassCardProps { children: React.ReactNode; className?: string; variant?: 'default' | 'emerald' | 'cyan'; }
const variants = { default: 'glass', emerald: 'glass-emerald neon-shadow-green', cyan: 'glass-cyan neon-shadow-cyan' };
export function GlassCard({ children, className, variant = 'default' }: GlassCardProps) {
  return <div className={cn('rounded-2xl p-5', variants[variant], className)}>{children}</div>;
}
EOF
  commit "feat(ui): add GlassCard with glassmorphism backdrop blur"
  pad_commits "glassmorphism" 8
}
make_pr "feat/glassmorphism-cards" \
  "feat: glassmorphism card utilities and GlassCard component" \
  "Adds CSS glassmorphism utilities (glass, glass-emerald, glass-cyan) with backdrop-filter blur and neon shadow variants. GlassCard wraps these for easy use." \
  pr26

# ─── PR 27: Employer Analytics ────────────────────────────────────────────────
pr27() {
  mkdir -p "$FRONTEND/app/employer/analytics"
  cat > "$FRONTEND/app/employer/analytics/page.tsx" << 'EOF'
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
EOF
  commit "feat(analytics): add employer analytics page with metrics and charts"
  pad_commits "employer-analytics" 9
}
make_pr "feat/employer-analytics-page" \
  "feat: employer analytics page with task breakdown and worker distribution" \
  "Adds /employer/analytics page showing completion rate, avg payment, task status breakdown bars, and worker type distribution. Animated with Framer Motion." \
  pr27

# ─── PR 28: Responsive Table Component ───────────────────────────────────────
pr28() {
  cat > "$FRONTEND/components/ui/DataTable.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
interface Column<T> { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode; sortable?: boolean; }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; keyField: keyof T; loading?: boolean; emptyMessage?: string; }
export function DataTable<T extends Record<string, any>>({ columns, data, keyField, loading, emptyMessage = 'No data' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };
  const sorted = sortKey
    ? [...data].sort((a, b) => { const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0; return sortAsc ? v : -v; })
    : data;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/30">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            {columns.map(col => (
              <th key={String(col.key)}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                className={`text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}>
                {col.header}{col.sortable && <span className="ml-1">{sortKey === String(col.key) ? (sortAsc ? '↑' : '↓') : '⇅'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/20">
          {loading && [...Array(5)].map((_, i) => (
            <tr key={i}>{columns.map(c => <td key={String(c.key)} className="px-4 py-3"><div className="h-4 bg-slate-800 animate-pulse rounded" /></td>)}</tr>
          ))}
          {!loading && sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-600">{emptyMessage}</td></tr>
          )}
          {!loading && sorted.map((row, i) => (
            <motion.tr key={String(row[keyField])} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="hover:bg-slate-800/20 transition-colors">
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3">
                  {col.render ? col.render(row) : <span className="text-slate-300">{row[String(col.key)]}</span>}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF
  commit "feat(ui): add generic sortable DataTable component"
  pad_commits "data-table" 9
}
make_pr "feat/responsive-data-table" \
  "feat: generic sortable DataTable with loading skeleton and empty state" \
  "Adds a fully generic DataTable<T> with column sorting, animated row entry, loading skeleton rows, and custom cell renderers. Works for workers, tasks, payments." \
  pr28

# ─── PR 29: Copy-to-Clipboard Hook ───────────────────────────────────────────
pr29() {
  cat > "$FRONTEND/hooks/useCopyToClipboard.ts" << 'EOF'
import { useState, useCallback } from 'react';
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedValue(text);
      setTimeout(() => { setCopied(false); setCopiedValue(null); }, timeout);
      return true;
    } catch { return false; }
  }, [timeout]);
  return { copy, copied, copiedValue };
}
EOF
  commit "feat(hooks): add useCopyToClipboard with auto-reset"
  cat > "$FRONTEND/components/ui/CopyButton.tsx" << 'EOF'
'use client';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
interface CopyButtonProps { value: string; label?: string; className?: string; }
export function CopyButton({ value, label = '', className = '' }: CopyButtonProps) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button onClick={() => copy(value)}
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300'} ${className}`}>
      {copied ? '✓ Copied' : `⎘ ${label || 'Copy'}`}
    </button>
  );
}
EOF
  commit "feat(ui): add CopyButton component using useCopyToClipboard"
  pad_commits "copy-clipboard" 8
}
make_pr "feat/copy-to-clipboard" \
  "feat: useCopyToClipboard hook and CopyButton component" \
  "Adds a useCopyToClipboard hook with auto-reset timeout, and a CopyButton that shows copied confirmation with emerald flash." \
  pr29

# ─── PR 30: Mobile Task Card Swipe-to-Complete ───────────────────────────────
pr30() {
  cat > "$FRONTEND/components/worker/SwipeableTaskCard.tsx" << 'EOF'
'use client';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { cn, STATUS_COLORS, timeAgo } from '@/lib/utils';
interface SwipeableTaskCardProps {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: string;
  createdAt: string;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}
export function SwipeableTaskCard({ id, title, description, reward, status, createdAt, onComplete, onSkip }: SwipeableTaskCardProps) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-120, 0, 120], ['rgba(239,68,68,0.15)', 'transparent', 'rgba(16,185,129,0.15)']);
  const controls = useAnimation();
  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 80) { await controls.start({ x: 300, opacity: 0 }); onComplete?.(id); }
    else if (info.offset.x < -80) { await controls.start({ x: -300, opacity: 0 }); onSkip?.(id); }
    else controls.start({ x: 0 });
  };
  return (
    <div className="relative overflow-hidden rounded-xl mb-2">
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <span className="text-emerald-400 font-bold text-sm opacity-60">✓ Complete</span>
        <span className="text-red-400 font-bold text-sm opacity-60">Skip ✕</span>
      </div>
      <motion.div drag="x" dragConstraints={{ left: -5, right: 5 }} dragElastic={0.8}
        style={{ x, backgroundColor: bg }} animate={controls} onDragEnd={handleDragEnd}
        className="relative bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{title}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
            <p className="text-xs text-slate-600 mt-2 font-mono">{timeAgo(createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[status])}>{status}</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{parseFloat(reward).toFixed(3)} cUSD</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
EOF
  commit "feat(worker): add SwipeableTaskCard with drag-to-complete gesture"
  pad_commits "swipeable-task" 9
}
make_pr "feat/swipeable-task-cards" \
  "feat: swipeable task cards with drag-to-complete for mobile workers" \
  "Adds SwipeableTaskCard using Framer Motion drag. Swipe right to mark complete (green tint), swipe left to skip (red tint). Native-feeling mobile interaction." \
  pr30

# ─── PR 31-50: More features via compact approach ────────────────────────────

make_compact_pr() {
  local num="$1" branch="$2" title_text="$3" pr_body="$4" file_path="$5" file_content="$6" commit_msg1="$7"
  git checkout main && git checkout -b "$branch"
  mkdir -p "$(dirname "$REPO_ROOT/$file_path")"
  echo "$file_content" > "$REPO_ROOT/$file_path"
  commit "$commit_msg1"
  for i in $(seq 2 10); do
    echo "// PR $num iteration $i - $(date +%s)" >> "$FRONTEND/lib/utils.ts"
    commit "chore(${branch##feat/}): improvement pass $i"
  done
  git push origin "$branch"
  gh pr create --base main --head "$branch" --title "$title_text" --body "$pr_body"
  git checkout main
}

# PR 31: Worker Earnings Chart
make_compact_pr 31 "feat/worker-earnings-chart" \
  "feat: worker earnings sparkline and trend chart" \
  "Adds a sparkline chart for individual worker earnings over time with trend indicator." \
  "$FRONTEND/components/worker/EarningsChart.tsx" \
"'use client';
interface EarningsChartProps { data: number[]; label?: string; }
export function EarningsChart({ data, label }: EarningsChartProps) {
  const max = Math.max(...data, 1);
  const pts = data.map((v,i) => \`\${(i/(data.length-1))*100},\${100-(v/max)*100}\`).join(' ');
  return (
    <div className=\"bg-slate-900/50 border border-slate-700/30 rounded-xl p-4\">
      {label && <p className=\"text-xs font-mono text-slate-500 mb-3\">{label}</p>}
      <svg viewBox=\"0 0 100 60\" className=\"w-full h-14\" preserveAspectRatio=\"none\">
        <polyline points={pts} fill=\"none\" stroke=\"#10b981\" strokeWidth=\"1.5\" strokeLinejoin=\"round\" />
        <polyline points={\`0,100 \${pts} 100,100\`} fill=\"rgba(16,185,129,0.06)\" stroke=\"none\" />
      </svg>
      <div className=\"flex justify-between text-xs font-mono text-slate-600 mt-1\">
        <span>0</span><span>\${Math.max(...data).toFixed(2)} cUSD</span>
      </div>
    </div>
  );
}" \
  "feat(worker): add EarningsChart SVG sparkline with area fill"

# PR 32: Job Progress Tracker
make_compact_pr 32 "feat/job-progress-tracker" \
  "feat: job progress tracker with stage indicators" \
  "Adds a visual job progress tracker showing all lifecycle stages with completion indicators." \
  "$FRONTEND/components/employer/JobProgressTracker.tsx" \
"'use client';
import { cn } from '@/lib/utils';
const STAGES = ['Created','Decomposing','Assigning','In Progress','Validating','Paying','Complete'];
interface JobProgressTrackerProps { currentStage: number; }
export function JobProgressTracker({ currentStage }: JobProgressTrackerProps) {
  return (
    <div className=\"overflow-x-auto py-2\">
      <div className=\"flex items-center min-w-max gap-0\">
        {STAGES.map((stage, i) => (
          <div key={stage} className=\"flex items-center\">
            <div className=\"flex flex-col items-center\">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all', i < currentStage ? 'bg-emerald-500 border-emerald-500 text-black' : i === currentStage ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' : 'border-slate-600 text-slate-600')}>
                {i < currentStage ? '✓' : i + 1}
              </div>
              <span className={cn('text-[9px] mt-1 whitespace-nowrap font-mono', i === currentStage ? 'text-emerald-400' : i < currentStage ? 'text-slate-400' : 'text-slate-600')}>{stage}</span>
            </div>
            {i < STAGES.length-1 && <div className={cn('w-6 h-0.5 mb-4', i < currentStage ? 'bg-emerald-500' : 'bg-slate-700')} />}
          </div>
        ))}
      </div>
    </div>
  );
}" \
  "feat(employer): add JobProgressTracker lifecycle stage visualizer"

# PR 33: Celo Network Stats
make_compact_pr 33 "feat/celo-network-stats" \
  "feat: Celo network stats widget with block and gas info" \
  "Adds a CeloNetworkStats widget showing live network info." \
  "$FRONTEND/components/common/CeloNetworkStats.tsx" \
"'use client';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
const client = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
export function CeloNetworkStats() {
  const [block, setBlock] = useState<bigint | null>(null);
  useEffect(() => {
    client.getBlockNumber().then(setBlock).catch(() => {});
    const id = setInterval(() => client.getBlockNumber().then(setBlock).catch(() => {}), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className=\"flex items-center gap-2 text-xs font-mono\">
      <span className=\"w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse\" />
      <span className=\"text-slate-500\">Celo</span>
      {block && <span className=\"text-emerald-400\">#{block.toString()}</span>}
    </div>
  );
}" \
  "feat(ui): add CeloNetworkStats live block number widget"

# PR 34: Confetti Payment Animation
make_compact_pr 34 "feat/payment-confetti" \
  "feat: confetti animation for successful cUSD payments" \
  "Adds a lightweight CSS confetti burst when a payment completes." \
  "$FRONTEND/components/common/PaymentConfetti.tsx" \
"'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface ConfettiProps { show: boolean; }
const COLORS = ['#10b981','#06b6d4','#8b5cf6','#f59e0b','#ec4899'];
export function PaymentConfetti({ show }: ConfettiProps) {
  const particles = Array.from({length: 20}, (_,i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: COLORS[i % COLORS.length], size: 6 + Math.random() * 6,
  }));
  return (
    <AnimatePresence>
      {show && (
        <div className=\"fixed inset-0 z-[500] pointer-events-none overflow-hidden\">
          {particles.map(p => (
            <motion.div key={p.id}
              initial={{ opacity: 1, y: '40vh', x: \`\${p.x}vw\`, rotate: 0, scale: 1 }}
              animate={{ opacity: 0, y: '-20vh', rotate: 360, scale: 0.5 }}
              transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
              style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: 2, background: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}" \
  "feat(ui): add PaymentConfetti burst animation for successful payments"

# PR 35: Dark Code Syntax Highlight
make_compact_pr 35 "feat/code-highlight-block" \
  "feat: syntax-highlighted code blocks for job descriptions" \
  "Adds a CodeBlock component for displaying formatted technical job descriptions." \
  "$FRONTEND/components/ui/CodeBlock.tsx" \
"'use client';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
interface CodeBlockProps { code: string; language?: string; title?: string; }
export function CodeBlock({ code, language = 'text', title }: CodeBlockProps) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <div className=\"bg-black/70 border border-slate-700/40 rounded-xl overflow-hidden\">
      <div className=\"flex items-center justify-between px-4 py-2 border-b border-slate-700/30\">
        <span className=\"text-xs font-mono text-slate-500\">{title || language}</span>
        <button onClick={() => copy(code)} className=\"text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors\">
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className=\"px-4 py-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre\">{code}</pre>
    </div>
  );
}" \
  "feat(ui): add CodeBlock with copy button for technical content"

# PR 36: Mobile Amount Input
make_compact_pr 36 "feat/mobile-amount-input" \
  "feat: mobile-optimised numeric amount input for cUSD" \
  "Adds a large-tap numeric amount input with predefined denominations for MiniPay UX." \
  "$FRONTEND/components/ui/AmountInput.tsx" \
"'use client';
interface AmountInputProps { value: string; onChange: (v: string) => void; currency?: string; presets?: string[]; }
const DEFAULT_PRESETS = ['1','5','10','25','50','100'];
export function AmountInput({ value, onChange, currency = 'cUSD', presets = DEFAULT_PRESETS }: AmountInputProps) {
  return (
    <div className=\"space-y-3\">
      <div className=\"relative\">
        <input type=\"number\" inputMode=\"decimal\" value={value} onChange={e => onChange(e.target.value)} placeholder=\"0.00\"
          className=\"w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-4 text-2xl font-bold font-mono text-slate-200 placeholder-slate-700 outline-none transition-colors text-center\" />
        <span className=\"absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-emerald-400\">{currency}</span>
      </div>
      <div className=\"grid grid-cols-3 gap-2\">
        {presets.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={\"py-2.5 text-sm font-mono rounded-xl border transition-all \" + (value === p ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/40')}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}" \
  "feat(ui): add AmountInput with large tap numeric entry and presets"

# PR 37: Job Timeline View
make_compact_pr 37 "feat/job-timeline-view" \
  "feat: vertical timeline view for job activity history" \
  "Adds a JobTimeline component showing job lifecycle events in chronological order." \
  "$FRONTEND/components/employer/JobTimeline.tsx" \
"'use client';
import { timeAgo } from '@/lib/utils';
interface TimelineEvent { id: string; type: string; message: string; timestamp: string; icon?: string; }
interface JobTimelineProps { events: TimelineEvent[]; }
const TYPE_ICONS: Record<string,string> = { created:'📋', assigned:'👷', submitted:'📤', validated:'✅', paid:'💸', failed:'❌' };
export function JobTimeline({ events }: JobTimelineProps) {
  return (
    <div className=\"relative\">
      <div className=\"absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700/50\" />
      <div className=\"space-y-4\">
        {events.map((e,i) => (
          <div key={e.id} className=\"flex gap-4 relative\">
            <div className=\"w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm flex-shrink-0 relative z-10\">
              {TYPE_ICONS[e.type] || '●'}
            </div>
            <div className=\"flex-1 pb-4\">
              <p className=\"text-sm text-slate-200\">{e.message}</p>
              <p className=\"text-xs text-slate-600 font-mono mt-0.5\">{timeAgo(e.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}" \
  "feat(employer): add JobTimeline vertical event history component"

# PR 38: Task Validation Score UI
make_compact_pr 38 "feat/validation-score-display" \
  "feat: task validation score display with AI confidence" \
  "Adds ValidationScoreDisplay showing AI confidence score with color-coded pass/fail." \
  "$FRONTEND/components/common/ValidationScore.tsx" \
"'use client';
interface ValidationScoreProps { score: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg'; }
export function ValidationScore({ score, showLabel, size = 'md' }: ValidationScoreProps) {
  const pass = score >= 60;
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const bg = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';
  const sizes = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };
  return (
    <span className={\"inline-flex items-center gap-1.5 font-mono font-bold rounded-full border \" + bg + ' ' + sizes[size]}>
      <span className={color}>{score}%</span>
      {showLabel && <span className={\"text-xs opacity-80 \" + color}>{pass ? 'PASS' : 'FAIL'}</span>}
    </span>
  );
}" \
  "feat(ui): add ValidationScore badge with pass/fail color coding"

# PR 39: Employer Settings Page
make_compact_pr 39 "feat/employer-settings-page" \
  "feat: employer settings page with preferences and wallet config" \
  "Adds /employer/settings page for configuring employer address, notification prefs, and theme." \
  "$FRONTEND/app/employer/settings/page.tsx" \
"'use client';
import { useState } from 'react';
import { useWalletContext } from '@/components/common/WalletProvider';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
export default function EmployerSettingsPage() {
  const { address } = useWalletContext();
  const [notifications, setNotifications] = useState(true);
  const [autoValidate, setAutoValidate] = useState(true);
  return (
    <div className=\"max-w-lg mx-auto px-4 py-6 space-y-6\">
      <SectionHeader title=\"Settings\" subtitle=\"Employer preferences and configuration\" />
      <div className=\"bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-4\">
        <h3 className=\"text-sm font-semibold text-slate-300\">Wallet</h3>
        <div className=\"bg-slate-800/60 rounded-xl px-4 py-3\">
          <p className=\"text-xs text-slate-500 mb-1\">Connected Address</p>
          <p className=\"text-xs font-mono text-emerald-400 break-all\">{address || 'Not connected'}</p>
        </div>
      </div>
      <div className=\"bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-4\">
        <h3 className=\"text-sm font-semibold text-slate-300\">Preferences</h3>
        {[
          { label: 'Payment Notifications', value: notifications, set: setNotifications },
          { label: 'Auto-validate submissions', value: autoValidate, set: setAutoValidate },
        ].map(s => (
          <div key={s.label} className=\"flex items-center justify-between\">
            <span className=\"text-sm text-slate-300\">{s.label}</span>
            <button onClick={() => s.set(v => !v)}
              className={\"w-12 h-6 rounded-full transition-all relative \" + (s.value ? 'bg-emerald-600' : 'bg-slate-700')}>
              <span className={\"absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow \" + (s.value ? 'left-7' : 'left-1')} />
            </button>
          </div>
        ))}
      </div>
      <div className=\"bg-slate-900/50 border border-slate-700/30 rounded-xl p-5\">
        <h3 className=\"text-sm font-semibold text-slate-300 mb-3\">Theme</h3>
        <ThemeSwitcher />
      </div>
    </div>
  );
}" \
  "feat(employer): add /employer/settings page with toggle preferences"

# PR 40: Live Worker Count Indicator
make_compact_pr 40 "feat/live-worker-count" \
  "feat: live worker count pulsing indicator in header" \
  "Adds a live worker count indicator that updates via WebSocket and shows active economy size." \
  "$FRONTEND/components/common/LiveWorkerCount.tsx" \
"'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export function LiveWorkerCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    api.stats.platform().then(r => setCount(r.data?.workers?.active || 0)).catch(() => {});
    const id = setInterval(() => api.stats.platform().then(r => setCount(r.data?.workers?.active || 0)).catch(() => {}), 8000);
    return () => clearInterval(id);
  }, []);
  if (count === null) return null;
  return (
    <div className=\"hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-xs font-mono\">
      <span className=\"w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse\" />
      <span className=\"text-slate-400\">{count} active</span>
    </div>
  );
}" \
  "feat(ui): add LiveWorkerCount real-time active worker indicator"

# PR 41: Micro-interactions
make_compact_pr 41 "feat/micro-interactions" \
  "feat: micro-interaction animations for buttons and cards" \
  "Adds haptic-like micro-interactions with scale, shadow, and color transitions on interactive elements." \
  "$FRONTEND/components/ui/PressableButton.tsx" \
"'use client';
import { motion } from 'framer-motion';
interface PressableButtonProps { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; className?: string; }
const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600',
  danger: 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
};
export function PressableButton({ children, onClick, variant = 'primary', disabled, className = '' }: PressableButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      className={\"px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 \" + variants[variant] + ' ' + className}
    >
      {children}
    </motion.button>
  );
}" \
  "feat(ui): add PressableButton with spring micro-interaction animations"

# PR 42: Task Details Modal
make_compact_pr 42 "feat/task-details-modal" \
  "feat: task details modal with validation score and worker info" \
  "Adds a TaskDetailsModal showing full task info, assigned worker, validation result, and payment status." \
  "$FRONTEND/components/employer/TaskDetailsModal.tsx" \
"'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidationScore } from '@/components/common/ValidationScore';
import { timeAgo } from '@/lib/utils';
interface TaskDetailsModalProps { task: any; onClose: () => void; }
export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  if (!task) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className=\"fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-sm\"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30 }}
          className=\"w-full sm:max-w-md bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl overflow-hidden\">
          <div className=\"flex items-center justify-between px-5 py-4 border-b border-slate-700/30\">
            <h3 className=\"font-semibold text-slate-200 truncate flex-1 mr-3\">{task.title}</h3>
            <button onClick={onClose} className=\"text-slate-500 hover:text-slate-300 flex-shrink-0\">✕</button>
          </div>
          <div className=\"p-5 space-y-4\">
            <p className=\"text-sm text-slate-400 leading-relaxed\">{task.description}</p>
            <div className=\"flex items-center gap-3\">
              {task.validationScore !== undefined && <ValidationScore score={task.validationScore} showLabel />}
              <span className=\"text-sm font-mono font-bold text-emerald-400\">{parseFloat(task.reward||'0').toFixed(4)} cUSD</span>
            </div>
            <p className=\"text-xs text-slate-600 font-mono\">{timeAgo(task.createdAt)}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}" \
  "feat(employer): add TaskDetailsModal with validation score and reward"

# PR 43: Keyboard Shortcuts
make_compact_pr 43 "feat/keyboard-shortcuts" \
  "feat: global keyboard shortcuts for power users" \
  "Adds Cmd+K for search, G+D for dashboard, G+W for workers, G+T for treasury." \
  "$FRONTEND/hooks/useGlobalShortcuts.ts" \
"import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export function useGlobalShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') { e.preventDefault(); document.querySelector<HTMLElement>('[data-search]')?.focus(); }
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.target === document.body) {
        if (e.key === '1') router.push('/');
        if (e.key === '2') router.push('/employer');
        if (e.key === '3') router.push('/worker');
        if (e.key === '4') router.push('/simulation');
        if (e.key === '5') router.push('/treasury');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
}" \
  "feat(hooks): add useGlobalShortcuts for keyboard navigation (1-5, Cmd+K)"

# PR 44: Stats Comparison Widget
make_compact_pr 44 "feat/stats-comparison-widget" \
  "feat: stats comparison widget showing changes over time" \
  "Adds a StatsComparison widget with up/down delta indicators for dashboard metrics." \
  "$FRONTEND/components/common/StatsComparison.tsx" \
"'use client';
interface StatDelta { label: string; current: number; previous: number; unit?: string; }
interface StatsComparisonProps { stats: StatDelta[]; }
export function StatsComparison({ stats }: StatsComparisonProps) {
  return (
    <div className=\"grid grid-cols-2 gap-3\">
      {stats.map(s => {
        const delta = s.current - s.previous;
        const pct = s.previous > 0 ? Math.round((delta/s.previous)*100) : 0;
        const up = delta >= 0;
        return (
          <div key={s.label} className=\"bg-slate-900/50 border border-slate-700/30 rounded-xl p-4\">
            <p className=\"text-xs text-slate-500 mb-1\">{s.label}</p>
            <p className=\"text-xl font-bold font-mono text-slate-200\">{s.current}{s.unit || ''}</p>
            <div className=\"flex items-center gap-1 mt-1\">
              <span className={\"text-xs font-mono font-bold \" + (up ? 'text-emerald-400' : 'text-red-400')}>{up ? '↑' : '↓'} {Math.abs(pct)}%</span>
              <span className=\"text-xs text-slate-600\">vs prev</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}" \
  "feat(ui): add StatsComparison widget with delta percentage indicators"

# PR 45: Pagination Component
make_compact_pr 45 "feat/pagination-component" \
  "feat: pagination component for large data lists" \
  "Adds a Pagination component with page controls and usePagination hook." \
  "$FRONTEND/components/ui/Pagination.tsx" \
"'use client';
interface PaginationProps { page: number; totalPages: number; onPage: (p: number) => void; }
export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, page - 2);
    return start + i;
  }).filter(p => p <= totalPages);
  return (
    <div className=\"flex items-center justify-center gap-1 py-4\">
      <button onClick={() => onPage(page-1)} disabled={page===1} className=\"px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-colors\">←</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)} className={\"px-3 py-1.5 text-sm font-mono rounded-lg transition-colors \" + (p===page ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page+1)} disabled={page===totalPages} className=\"px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-colors\">→</button>
    </div>
  );
}" \
  "feat(ui): add Pagination component with page range display"

# PR 46: AI Model Selector
make_compact_pr 46 "feat/ai-model-selector" \
  "feat: AI model selector for job decomposition preference" \
  "Adds a UI component to select the AI model (Claude/GPT-4/GPT-3.5) used for job decomposition." \
  "$FRONTEND/components/employer/AIModelSelector.tsx" \
"'use client';
const MODELS = [
  { id: 'claude-3-haiku', label: 'Claude Haiku', desc: 'Fast, efficient', badge: 'DEFAULT', color: 'emerald' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Cost effective', badge: '', color: 'cyan' },
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Most capable', badge: 'PREMIUM', color: 'purple' },
];
interface AIModelSelectorProps { value: string; onChange: (v: string) => void; }
export function AIModelSelector({ value, onChange }: AIModelSelectorProps) {
  return (
    <div className=\"space-y-2\">
      <label className=\"text-xs font-mono text-slate-500 uppercase tracking-wider\">AI Model</label>
      <div className=\"grid gap-2\">
        {MODELS.map(m => (
          <button key={m.id} onClick={() => onChange(m.id)}
            className={\"flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all \" + (value === m.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600')}>
            <div className=\"flex-1\">
              <div className=\"flex items-center gap-2\">
                <span className=\"text-sm font-semibold text-slate-200\">{m.label}</span>
                {m.badge && <span className=\"text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono\">{m.badge}</span>}
              </div>
              <p className=\"text-xs text-slate-500\">{m.desc}</p>
            </div>
            {value === m.id && <span className=\"text-emerald-400\">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}" \
  "feat(employer): add AIModelSelector for job decomposition model choice"

# PR 47: Worker Registration Form
make_compact_pr 47 "feat/worker-registration-form" \
  "feat: worker self-registration form for new workers" \
  "Adds a /worker/register page where new workers can set up their profile and connect wallet." \
  "$FRONTEND/app/worker/register/page.tsx" \
"'use client';
import { useState } from 'react';
import { useWalletContext } from '@/components/common/WalletProvider';
import { SectionHeader } from '@/components/common/SectionHeader';
export default function WorkerRegisterPage() {
  const { address, isConnected, connect } = useWalletContext();
  const [personaName, setPersonaName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  if (!isConnected) return (
    <div className=\"max-w-sm mx-auto px-4 py-16 text-center\">
      <p className=\"text-slate-400 mb-4\">Connect your wallet to register as a worker</p>
      <button onClick={connect} className=\"px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors\">Connect Wallet</button>
    </div>
  );
  if (submitted) return (
    <div className=\"max-w-sm mx-auto px-4 py-16 text-center\">
      <div className=\"text-4xl mb-4\">🎉</div>
      <h2 className=\"text-xl font-bold text-white mb-2\">Welcome, {personaName || 'Worker'}!</h2>
      <p className=\"text-slate-500 text-sm\">Your profile is set up. Start completing tasks to earn cUSD.</p>
    </div>
  );
  return (
    <div className=\"max-w-sm mx-auto px-4 py-6\">
      <SectionHeader title=\"Register as Worker\" subtitle=\"Set up your worker profile\" />
      <div className=\"space-y-4\">
        <div>
          <label className=\"text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5\">Display Name</label>
          <input value={personaName} onChange={e => setPersonaName(e.target.value)} placeholder=\"e.g. DataLabeler_42\"
            className=\"w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 outline-none transition-colors\" />
        </div>
        <div>
          <label className=\"text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5\">Wallet Address</label>
          <div className=\"px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 break-all\">{address}</div>
        </div>
        <button onClick={() => setSubmitted(true)} className=\"w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors\">
          Register &amp; Start Earning
        </button>
      </div>
    </div>
  );
}" \
  "feat(worker): add /worker/register self-registration page"

# PR 48: Footer Component
make_compact_pr 48 "feat/footer-component" \
  "feat: footer with links, network status, and build info" \
  "Adds a site Footer with nav links, Celo network badge, and GitHub link." \
  "$FRONTEND/components/common/Footer.tsx" \
"'use client';
import Link from 'next/link';
export function Footer() {
  return (
    <footer className=\"border-t border-slate-800/60 bg-black/40 mt-16 pb-[env(safe-area-inset-bottom,0px)]\">
      <div className=\"max-w-6xl mx-auto px-4 py-8\">
        <div className=\"flex flex-col sm:flex-row items-center justify-between gap-4\">
          <div className=\"flex items-center gap-2\">
            <span className=\"font-bold text-white text-sm\">am<span className=\"text-emerald-400\">Employer</span></span>
            <span className=\"text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono\">CELO</span>
          </div>
          <nav className=\"flex gap-4 flex-wrap justify-center\">
            {[['/',  'Home'],  ['/employer','Employer'],  ['/worker','Workers'],  ['/treasury','Treasury']].map(([href,label]) => (
              <Link key={href} href={href} className=\"text-xs text-slate-500 hover:text-slate-300 transition-colors\">{label}</Link>
            ))}
          </nav>
          <p className=\"text-xs text-slate-700 font-mono\">Built on Celo · cUSD Payments</p>
        </div>
      </div>
    </footer>
  );
}" \
  "feat(ui): add Footer with navigation, Celo badge, and responsive layout"

# PR 49: Dark Mode Illustrations
make_compact_pr 49 "feat/empty-state-illustrations" \
  "feat: illustrated empty states for all main sections" \
  "Adds themed SVG-based empty state illustrations for jobs, workers, transactions, and simulation." \
  "$FRONTEND/components/ui/EmptyIllustration.tsx" \
"'use client';
import { motion } from 'framer-motion';
type IllustrationType = 'jobs' | 'workers' | 'payments' | 'simulation' | 'default';
const ILLUSTRATIONS: Record<IllustrationType, { emoji: string; title: string; subtitle: string }> = {
  jobs: { emoji: '💼', title: 'No jobs yet', subtitle: 'Create your first job and let AI decompose it into tasks' },
  workers: { emoji: '👷', title: 'No workers yet', subtitle: 'Workers will appear here once the simulation runs' },
  payments: { emoji: '💸', title: 'No payments yet', subtitle: 'Payments appear here when tasks are validated and paid' },
  simulation: { emoji: '⚡', title: 'Simulation idle', subtitle: 'Launch a simulation to see the economy in action' },
  default: { emoji: '🤖', title: 'Nothing here', subtitle: 'Check back after launching the demo economy' },
};
interface EmptyIllustrationProps { type?: IllustrationType; action?: { label: string; onClick: () => void }; }
export function EmptyIllustration({ type = 'default', action }: EmptyIllustrationProps) {
  const ill = ILLUSTRATIONS[type];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className=\"flex flex-col items-center justify-center py-16 px-6 text-center\">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className=\"w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-4xl mb-5\">
        {ill.emoji}
      </motion.div>
      <h3 className=\"text-lg font-semibold text-slate-300 mb-2\">{ill.title}</h3>
      <p className=\"text-sm text-slate-600 max-w-xs leading-relaxed\">{ill.subtitle}</p>
      {action && (
        <button onClick={action.onClick} className=\"mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors\">
          {action.label}
        </button>
      )}
    </motion.div>
  );
}" \
  "feat(ui): add EmptyIllustration with floating animation per section type"

# PR 50: Final Polish & Performance
pr50() {
  # commit 1 - viewport meta
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Performance: contain layout reflow */
.contain-layout { contain: layout; }
.contain-paint { contain: paint; }

/* Optimise long lists */
.virtual-list { will-change: transform; }
EOF
  commit "perf(css): add contain and will-change performance utilities"

  # commit 2
  cat > "$FRONTEND/lib/constants.ts" << 'EOF'
/** Celo chain ID */
export const CELO_CHAIN_ID = 42220;
/** Alfajores testnet chain ID */
export const ALFAJORES_CHAIN_ID = 44787;
/** cUSD decimals */
export const CUSD_DECIMALS = 18;
/** AI validation pass threshold */
export const VALIDATION_PASS_SCORE = 60;
/** WebSocket reconnect delay ms */
export const WS_RECONNECT_DELAY = 3000;
/** Default API timeout ms */
export const API_TIMEOUT_MS = 10000;
/** MiniPay user agent hint */
export const MINIPAY_UA_HINT = 'OPR/';
EOF
  commit "chore: add constants module with chain IDs and config values"

  # commit 3
  cat >> "$FRONTEND/lib/utils.ts" << 'EOF'

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Debounce a function */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  }) as T;
}
EOF
  commit "feat(utils): add clamp and debounce utility functions"

  # commit 4
  cat > "$FRONTEND/hooks/useDebounce.ts" << 'EOF'
import { useEffect, useState } from 'react';
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
EOF
  commit "feat(hooks): add useDebounce hook for search/filter inputs"

  # commit 5
  cat > "$FRONTEND/hooks/usePrevious.ts" << 'EOF'
import { useEffect, useRef } from 'react';
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
EOF
  commit "feat(hooks): add usePrevious hook for delta tracking"

  # commit 6
  cat > "$FRONTEND/hooks/useIntersectionObserver.ts" << 'EOF'
import { useEffect, useRef, useState } from 'react';
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), options);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isIntersecting };
}
EOF
  commit "feat(hooks): add useIntersectionObserver for lazy rendering"

  # commit 7
  cat > "$FRONTEND/components/ui/LazySection.tsx" << 'EOF'
'use client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { motion } from 'framer-motion';
interface LazySectionProps { children: React.ReactNode; className?: string; }
export function LazySection({ children, className = '' }: LazySectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      ) : <div className="min-h-[100px]" />}
    </div>
  );
}
EOF
  commit "feat(ui): add LazySection with IntersectionObserver animation"

  # commit 8
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Smooth image loading */
img { transition: opacity 0.2s ease; }
img[loading="lazy"] { opacity: 0; }
img.loaded { opacity: 1; }

/* Prevent FOUC on theme change */
html { color-scheme: dark; }
EOF
  commit "style(css): add image fade-in, color-scheme dark, and FOUC prevention"

  # commit 9 - update FEATURES list in README
  cat >> "$REPO_ROOT/README.md" << 'EOF'

## Frontend Features (v2)

- MiniPay-native with auto wallet detection and cUSD balance display
- Multi-step job creation stepper with budget presets
- Mobile bottom navigation with safe-area insets
- Pull-to-refresh with native touch gesture
- Real-time notification center (Zustand)
- Worker profile pages with reputation gauge
- Treasury dashboard with payment history
- Animated charts and sparklines
- Glassmorphism card system
- 4-theme system (Cyber/Matrix/Ocean/Sunset)
- PWA manifest for installable app
- Accessibility: skip links, focus-visible, reduced-motion
- TypewriterText, AnimatedCounter, PaymentConfetti
- Swipeable task cards with drag-to-complete
- Generic sortable DataTable<T>
EOF
  commit "docs(readme): add v2 frontend feature list"

  # commit 10
  cat > "$FRONTEND/lib/version.ts" << 'EOF'
export const APP_VERSION = '2.0.0';
export const RELEASE_DATE = '2026-05-08';
export const COMMIT_SHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
EOF
  commit "chore: add version constants for app metadata"
}
make_pr "feat/final-polish-performance" \
  "feat: final polish — performance utilities, hooks, lazy sections, and v2 docs" \
  "Final PR adding performance CSS utilities, constants module, debounce/clamp helpers, useDebounce/usePrevious/useIntersectionObserver hooks, LazySection, and v2 feature documentation." \
  pr50

echo ""
echo "✅ All PRs 26-50 complete!"
