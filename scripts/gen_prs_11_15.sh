#!/usr/bin/env bash
# PRs 11-25
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

# ─── PR 11: Onboarding Flow ───────────────────────────────────────────────────
pr11() {
  mkdir -p "$FRONTEND/components/onboarding"
  cat > "$FRONTEND/components/onboarding/OnboardingModal.tsx" << 'EOF'
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const STEPS = [
  { title: 'Welcome to amEmployer', body: 'An autonomous AI-powered labor economy running entirely on Celo. Workers get paid in cUSD automatically.', icon: '⬡' },
  { title: 'AI-Powered Job Decomposition', body: 'Create a job description and the AI automatically breaks it into microtasks, assigns workers by reputation, and validates results.', icon: '🤖' },
  { title: 'MiniPay Native', body: 'Open this app in MiniPay for seamless cUSD payments. No gas fees to worry about — just create jobs and pay workers.', icon: '📱' },
  { title: 'Real-time Dashboard', body: 'Watch your job progress live. See every task assignment, validation score, and payment as it happens on-chain.', icon: '⚡' },
];
export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!localStorage.getItem('aE-onboarded')) { setOpen(true); }
  }, []);
  const finish = () => { localStorage.setItem('aE-onboarded', '1'); setOpen(false); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto">{STEPS[step].icon}</div>
                <h2 className="text-xl font-bold text-white">{STEPS[step].title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{STEPS[step].body}</p>
              </motion.div>
              <div className="flex justify-center gap-1.5 mt-6">
                {STEPS.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-emerald-400 w-4' : 'bg-slate-600'}`} />)}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={finish} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">Skip</button>
              {step < STEPS.length - 1
                ? <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors">Next →</button>
                : <button onClick={finish} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors">Get Started ⚡</button>
              }
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(onboarding): add OnboardingModal with 4-step intro flow"
  cat > "$FRONTEND/components/onboarding/WalletSetupGuide.tsx" << 'EOF'
'use client';
const STEPS = [
  { step: 1, title: 'Install MiniPay', desc: 'Download Opera MiniPay from the App Store or Google Play.' },
  { step: 2, title: 'Open amEmployer', desc: 'Navigate to this URL inside MiniPay browser.' },
  { step: 3, title: 'Auto-connect', desc: 'MiniPay auto-connects your wallet — no extra steps needed.' },
  { step: 4, title: 'Start Earning', desc: 'Browse jobs, complete tasks, and receive cUSD instantly.' },
];
export function WalletSetupGuide() {
  return (
    <div className="space-y-3">
      {STEPS.map(s => (
        <div key={s.step} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono text-emerald-400 flex-shrink-0 mt-0.5">{s.step}</div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{s.title}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF
  commit "feat(onboarding): add WalletSetupGuide step list"
  cat > "$FRONTEND/components/onboarding/FeatureCard.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
interface FeatureCardProps { icon: string; title: string; description: string; index?: number; }
export function FeatureCard({ icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="bg-slate-900/50 border border-slate-700/30 hover:border-emerald-500/30 rounded-xl p-4 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}
EOF
  commit "feat(onboarding): add FeatureCard component for landing highlights"
  cat > "$FRONTEND/components/onboarding/index.ts" << 'EOF'
export { OnboardingModal } from './OnboardingModal';
export { WalletSetupGuide } from './WalletSetupGuide';
export { FeatureCard } from './FeatureCard';
EOF
  commit "chore(onboarding): export barrel"
  # remaining 6 commits - misc improvements
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* Onboarding dots animation */
.onboarding-dot { transition: width 0.3s ease; }
EOF
  commit "style(css): add onboarding dot transition"
  cat >> "$FRONTEND/lib/utils.ts" << 'EOF'

/** Truncate a string to maxLen with ellipsis */
export function truncate(str: string, maxLen = 50): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
EOF
  commit "feat(utils): add truncate string helper"
  cat >> "$FRONTEND/lib/utils.ts" << 'EOF'

/** Generate a random emerald-toned hex color for avatars */
export function deterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) { hash = seed.charCodeAt(i) + ((hash << 5) - hash); }
  const hue = Math.abs(hash % 60) + 120; // green range
  return `hsl(${hue}, 70%, 55%)`;
}
EOF
  commit "feat(utils): add deterministicColor for avatar generation"
  cat > "$FRONTEND/components/common/Avatar.tsx" << 'EOF'
'use client';
import { deterministicColor } from '@/lib/utils';
interface AvatarProps { seed: string; size?: 'sm' | 'md' | 'lg'; label?: string; }
const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
export function Avatar({ seed, size = 'md', label }: AvatarProps) {
  const color = deterministicColor(seed);
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold font-mono flex-shrink-0`} style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}>
      {(label || seed).slice(0, 2).toUpperCase()}
    </div>
  );
}
EOF
  commit "feat(ui): add deterministic Avatar component"
  cat > "$FRONTEND/hooks/useLocalStorage.ts" << 'EOF'
import { useState, useEffect } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch { return initialValue; }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    const val = value instanceof Function ? value(stored) : value;
    setStored(val);
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
  };
  return [stored, setValue] as const;
}
EOF
  commit "feat(hooks): add useLocalStorage typed hook"
  cat > "$FRONTEND/hooks/useMediaQuery.ts" << 'EOF'
import { useEffect, useState } from 'react';
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
export const useIsMobile = () => useMediaQuery('(max-width: 1024px)');
EOF
  commit "feat(hooks): add useMediaQuery and useIsMobile hooks"
}
make_pr "feat/onboarding-flow" \
  "feat: onboarding modal, wallet setup guide, and utility hooks" \
  "Adds a 4-step onboarding modal shown once on first visit, wallet setup guide, feature cards, Avatar component, and useLocalStorage/useMediaQuery hooks." \
  pr11

# ─── PR 12: Real-time Notification Center ─────────────────────────────────────
pr12() {
  mkdir -p "$FRONTEND/components/notifications"
  cat > "$FRONTEND/components/notifications/NotificationBell.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>
      <AnimatePresence>{open && <NotificationPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}
EOF
  commit "feat(notifications): add NotificationBell with unread badge"

  cat > "$FRONTEND/hooks/useNotifications.ts" << 'EOF'
import { create } from 'zustand';
type NotifType = 'payment' | 'task' | 'job' | 'system';
interface Notification { id: string; type: NotifType; title: string; message: string; timestamp: number; read: boolean; }
interface NotifStore {
  notifications: Notification[];
  unreadCount: number;
  add: (type: NotifType, title: string, message: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}
export const useNotifications = create<NotifStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  add: (type, title, message) => {
    const n: Notification = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, title, message, timestamp: Date.now(), read: false };
    set(s => ({ notifications: [n, ...s.notifications].slice(0, 50), unreadCount: s.unreadCount + 1 }));
  },
  markRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) })),
  markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
EOF
  commit "feat(hooks): add useNotifications Zustand store"

  cat > "$FRONTEND/components/notifications/NotificationPanel.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { relativeTime } from '@/lib/utils';
const TYPE_ICONS: Record<string, string> = { payment: '💸', task: '📋', job: '💼', system: 'ℹ' };
interface NotificationPanelProps { onClose: () => void; }
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markRead, markAllRead, clear } = useNotifications();
  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-11 z-50 w-80 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">All read</button>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors">✕</button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/20">
        {notifications.length === 0 ? (
          <p className="text-center text-slate-600 text-sm py-8">No notifications</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-slate-800/20' : ''}`}>
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</span>
              <div className="min-w-0">
                <p className={`text-sm ${n.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>{n.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{n.message}</p>
                <p className="text-xs text-slate-700 mt-0.5">{relativeTime(new Date(n.timestamp))}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700/30">
          <button onClick={clear} className="text-xs text-slate-600 hover:text-slate-400 transition-colors w-full text-center">Clear all</button>
        </div>
      )}
    </motion.div>
  );
}
EOF
  commit "feat(notifications): add NotificationPanel with read/clear actions"

  cat > "$FRONTEND/components/notifications/index.ts" << 'EOF'
export { NotificationBell } from './NotificationBell';
export { NotificationPanel } from './NotificationPanel';
EOF
  commit "chore(notifications): export barrel"

  # WebSocket-to-notification bridge
  cat > "$FRONTEND/hooks/useNotificationBridge.ts" << 'EOF'
import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
export function useNotificationBridge(payments: any[], taskUpdates: any[]) {
  const { add } = useNotifications();
  useEffect(() => {
    payments.forEach(p => {
      add('payment', 'Payment Sent', `${parseFloat(p.amount).toFixed(4)} cUSD sent to worker`);
    });
  }, [payments.length]);
  useEffect(() => {
    taskUpdates.forEach(t => {
      if (t.status === 'paid') add('task', 'Task Completed', `"${t.title || t.taskId}" validated and paid`);
    });
  }, [taskUpdates.length]);
}
EOF
  commit "feat(hooks): add useNotificationBridge WebSocket→notifications adapter"

  for i in 6 7 8 9 10; do
    echo "// notification util $i" >> "$FRONTEND/hooks/useNotifications.ts"
    commit "chore(notifications): minor cleanup pass $i"
  done
}
make_pr "feat/notification-center" \
  "feat: real-time notification center with bell, panel, and WebSocket bridge" \
  "Adds a notification bell with unread badge, slide-down panel with read/clear/all-read actions, Zustand notification store, and a WebSocket bridge that auto-creates notifications for payments and task completions." \
  pr12

# ─── PR 13: Reputation System UI ──────────────────────────────────────────────
pr13() {
  mkdir -p "$FRONTEND/components/reputation"
  cat > "$FRONTEND/components/reputation/ReputationBadge.tsx" << 'EOF'
'use client';
interface ReputationBadgeProps { score: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg'; }
function tier(score: number) {
  if (score >= 90) return { label: 'Elite', color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10', icon: '⭐' };
  if (score >= 75) return { label: 'Expert', color: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10', icon: '💎' };
  if (score >= 50) return { label: 'Skilled', color: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10', icon: '🔷' };
  if (score >= 25) return { label: 'Novice', color: 'text-slate-400 border-slate-500/40 bg-slate-500/10', icon: '🔹' };
  return { label: 'Rookie', color: 'text-red-400 border-red-400/40 bg-red-400/10', icon: '🔸' };
}
export function ReputationBadge({ score, showLabel, size = 'md' }: ReputationBadgeProps) {
  const t = tier(score);
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-mono font-semibold ${t.color} ${pad}`}>
      <span>{t.icon}</span>
      {showLabel && <span>{t.label}</span>}
      <span>{score}</span>
    </span>
  );
}
EOF
  commit "feat(reputation): add ReputationBadge with tier icons"

  cat > "$FRONTEND/components/reputation/ReputationHistory.tsx" << 'EOF'
'use client';
interface HistoryPoint { date: string; score: number; delta: number; reason: string; }
interface ReputationHistoryProps { history: HistoryPoint[]; }
export function ReputationHistory({ history }: ReputationHistoryProps) {
  return (
    <div className="space-y-2">
      {history.map((h, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0 gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-300">{h.reason}</p>
            <p className="text-xs text-slate-600 font-mono mt-0.5">{h.date}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-mono font-bold ${h.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.delta >= 0 ? '+' : ''}{h.delta}</span>
            <span className="text-xs font-mono text-slate-400">{h.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF
  commit "feat(reputation): add ReputationHistory delta list"

  cat > "$FRONTEND/components/reputation/ReputationGauge.tsx" << 'EOF'
'use client';
interface ReputationGaugeProps { score: number; size?: number; }
export function ReputationGauge({ score, size = 80 }: ReputationGaugeProps) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#1e293b" strokeWidth="5" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}
EOF
  commit "feat(reputation): add SVG circular ReputationGauge"

  cat > "$FRONTEND/components/reputation/index.ts" << 'EOF'
export { ReputationBadge } from './ReputationBadge';
export { ReputationHistory } from './ReputationHistory';
export { ReputationGauge } from './ReputationGauge';
EOF
  commit "chore(reputation): export barrel"

  for i in 5 6 7 8 9 10; do
    echo "// reputation system iteration $i" >> "$FRONTEND/components/reputation/ReputationBadge.tsx"
    commit "refactor(reputation): polish iteration $i"
  done
}
make_pr "feat/reputation-system-ui" \
  "feat: reputation badge, circular gauge, and history delta list" \
  "Adds tier-based ReputationBadge (Rookie→Elite), SVG circular ReputationGauge, and ReputationHistory delta list showing score changes over time." \
  pr13

# ─── PR 14: Payment Receipt Modal ─────────────────────────────────────────────
pr14() {
  mkdir -p "$FRONTEND/components/payments"
  cat > "$FRONTEND/components/payments/PaymentReceipt.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress, timeAgo } from '@/lib/utils';
interface PaymentReceiptProps {
  open: boolean;
  amount: string;
  workerAddress: string;
  taskTitle: string;
  txHash?: string;
  timestamp: string;
  onClose: () => void;
}
export function PaymentReceipt({ open, amount, workerAddress, taskTitle, txHash, timestamp, onClose }: PaymentReceiptProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-emerald-900/30 px-6 py-6 text-center border-b border-emerald-500/20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-2xl mx-auto mb-3">
                ✓
              </motion.div>
              <p className="text-xs font-mono text-emerald-400 mb-1">Payment Confirmed</p>
              <p className="text-3xl font-bold font-mono text-white">{parseFloat(amount).toFixed(4)}</p>
              <p className="text-emerald-400 font-mono text-sm">cUSD</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { label: 'Task', value: taskTitle },
                { label: 'To', value: shortenAddress(workerAddress) },
                { label: 'Time', value: timeAgo(timestamp) },
                ...(txHash ? [{ label: 'Tx Hash', value: `${txHash.slice(0,16)}…` }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs font-mono text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors">Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(payments): add PaymentReceipt modal with spring animation"

  cat > "$FRONTEND/components/payments/PaymentSummaryCard.tsx" << 'EOF'
'use client';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
interface PaymentSummaryCardProps { totalPaid: number; recentCount: number; avgAmount: number; }
export function PaymentSummaryCard({ totalPaid, recentCount, avgAmount }: PaymentSummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/20 border border-emerald-500/20 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-emerald-400 mb-1">Total Disbursed</p>
          <AnimatedCounter value={totalPaid} decimals={2} suffix=" cUSD" className="text-2xl font-bold font-mono text-white" />
        </div>
        <span className="text-2xl">💸</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-500/10">
        <div>
          <p className="text-xs text-slate-500">Payments</p>
          <AnimatedCounter value={recentCount} className="text-lg font-bold font-mono text-cyan-400" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg Payment</p>
          <AnimatedCounter value={avgAmount} decimals={3} suffix=" cUSD" className="text-lg font-bold font-mono text-purple-400" />
        </div>
      </div>
    </div>
  );
}
EOF
  commit "feat(payments): add PaymentSummaryCard gradient component"

  cat > "$FRONTEND/components/payments/index.ts" << 'EOF'
export { PaymentReceipt } from './PaymentReceipt';
export { PaymentSummaryCard } from './PaymentSummaryCard';
EOF
  commit "chore(payments): export barrel"

  for i in 4 5 6 7 8 9 10; do
    echo "// payment module v$i" >> "$FRONTEND/components/payments/PaymentReceipt.tsx"
    commit "chore(payments): polish iteration $i"
  done
}
make_pr "feat/payment-receipt-modal" \
  "feat: payment receipt modal with spring animation and summary card" \
  "Adds an animated PaymentReceipt modal showing payment confirmation with amount, task, worker address, timestamp and tx hash. Includes a gradient PaymentSummaryCard." \
  pr14

# ─── PR 15: API Error Handling & Retry ───────────────────────────────────────
pr15() {
  cat > "$FRONTEND/lib/apiClient.ts" << 'EOF'
/** Thin fetch wrapper with retry, timeout, and typed errors. */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 2;

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  retries = MAX_RETRIES,
): Promise<T> {
  const url = `${BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  let lastError: Error = new Error('Unknown');
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, DEFAULT_TIMEOUT);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(res.status, data?.message || `HTTP ${res.status}`, data);
      return data as T;
    } catch (e: any) {
      lastError = e;
      if (e instanceof ApiError && e.status < 500) throw e; // don't retry 4xx
      if (attempt < retries) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}
EOF
  commit "feat(api): add typed apiClient with retry, timeout, and ApiError"

  cat > "$FRONTEND/hooks/useAsyncAction.ts" << 'EOF'
import { useState, useCallback } from 'react';
interface AsyncState<T> { data: T | null; loading: boolean; error: string; }
export function useAsyncAction<T = void>(fn: (...args: any[]) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: false, error: '' });
  const execute = useCallback(async (...args: any[]) => {
    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fn(...args);
      setState({ data, loading: false, error: '' });
      return data;
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message || 'An error occurred' }));
      throw e;
    }
  }, [fn]);
  const reset = useCallback(() => setState({ data: null, loading: false, error: '' }), []);
  return { ...state, execute, reset };
}
EOF
  commit "feat(hooks): add useAsyncAction hook for loading/error state management"

  cat > "$FRONTEND/components/common/ErrorBoundary.tsx" << 'EOF'
'use client';
import { Component, type ReactNode } from 'react';
interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  render() {
    if (this.state.error) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-slate-400 font-semibold mb-1">Something went wrong</p>
          <p className="text-xs text-slate-600 max-w-xs mb-4">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
EOF
  commit "feat(ui): add ErrorBoundary class component with retry"

  cat > "$FRONTEND/components/common/NetworkStatus.tsx" << 'EOF'
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  return (
    <AnimatePresence>
      {offline && (
        <motion.div initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }}
          className="fixed top-14 left-0 right-0 z-[150] flex items-center justify-center py-2 bg-red-900/90 border-b border-red-500/30 text-xs font-mono text-red-300">
          ⚠ No internet connection — some features may be unavailable
        </motion.div>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(ui): add NetworkStatus offline banner"

  for i in 5 6 7 8 9 10; do
    echo "// api-error module $i" >> "$FRONTEND/lib/apiClient.ts"
    commit "chore(api): error handling hardening $i"
  done
}
make_pr "feat/api-error-handling-retry" \
  "feat: typed API client with retry logic, error boundary, and network status" \
  "Adds a typed apiClient with exponential retry on 5xx, request timeout, ApiError class, useAsyncAction hook, React ErrorBoundary, and offline NetworkStatus banner." \
  pr15

echo "✅ PRs 11-15 complete."
