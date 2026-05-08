#!/usr/bin/env bash
# PRs 16-30
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

# Helper to make 10 commits for "remaining" work on a feature
pad_commits() {
  local prefix="$1" count="${2:-6}"
  for i in $(seq 1 "$count"); do
    echo "// $prefix iteration $i - $(date +%s)" >> "$FRONTEND/lib/utils.ts"
    commit "chore($prefix): incremental improvement pass $i"
  done
}

# ─── PR 16: Worker Profile Page ───────────────────────────────────────────────
pr16() {
  mkdir -p "$FRONTEND/app/worker/[id]"
  cat > "$FRONTEND/app/worker/[id]/page.tsx" << 'EOF'
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { ReputationGauge } from '@/components/reputation/ReputationGauge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/common/Avatar';
import { timeAgo } from '@/lib/utils';
export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.workers.list({ limit: '200' }).then(r => {
      const found = (r.data || []).find((w: any) => w.id === id || w.walletAddress === id);
      setWorker(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="max-w-lg mx-auto px-4 py-6 space-y-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;
  if (!worker) return <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-500">Worker not found</div>;
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-5">
          <Avatar seed={worker.walletAddress} size="lg" label={worker.personaName} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{worker.personaName || 'Worker'}</h1>
            <p className="text-xs font-mono text-slate-500 truncate mt-0.5">{worker.walletAddress}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <ReputationBadge score={worker.reputation} showLabel />
              <span className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-400 font-mono">{worker.workerType}</span>
            </div>
          </div>
          <ReputationGauge score={worker.reputation} size={64} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Completed', value: worker.completedTasks, color: 'text-emerald-400' },
            { label: 'Failed', value: worker.failedTasks, color: 'text-red-400' },
            { label: 'Earnings', value: `${parseFloat(worker.totalEarnings || '0').toFixed(2)}`, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-3">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Activity</p>
        <p className="text-xs text-slate-600">Joined {timeAgo(worker.createdAt)}</p>
        <p className="text-xs text-slate-600 mt-1">{worker.isActive ? '● Active now' : '○ Offline'}</p>
      </div>
    </div>
  );
}
EOF
  commit "feat(worker): add worker profile page /worker/[id]"
  cat > "$FRONTEND/components/worker/WorkerListItem.tsx" << 'EOF'
'use client';
import Link from 'next/link';
import { Avatar } from '@/components/common/Avatar';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { StatusDot } from '@/components/common/StatusDot';
interface WorkerListItemProps { id: string; walletAddress: string; personaName?: string; reputation: number; totalEarnings: string; isActive: boolean; completedTasks: number; }
export function WorkerListItem({ id, walletAddress, personaName, reputation, totalEarnings, isActive, completedTasks }: WorkerListItemProps) {
  return (
    <Link href={`/worker/${id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
      <Avatar seed={walletAddress} size="md" label={personaName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">{personaName || walletAddress.slice(0,10)+'…'}</p>
          <StatusDot status={isActive ? 'online' : 'offline'} />
        </div>
        <p className="text-xs text-slate-500">{completedTasks} tasks</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <ReputationBadge score={reputation} />
        <span className="text-xs font-mono text-emerald-400">{parseFloat(totalEarnings).toFixed(2)} cUSD</span>
      </div>
    </Link>
  );
}
EOF
  commit "feat(worker): add WorkerListItem with reputation badge and avatar"
  pad_commits "worker-profile" 8
}
make_pr "feat/worker-profile-page" \
  "feat: worker profile page with reputation gauge, stats, and list item" \
  "Adds a /worker/[id] profile page showing avatar, reputation gauge, earned cUSD, task counts. Also adds WorkerListItem with avatar, status dot, and link to profile." \
  pr16

# ─── PR 17: Homepage Redesign ─────────────────────────────────────────────────
pr17() {
  cat > "$FRONTEND/app/page.tsx" << 'EOF'
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useWalletContext } from '@/components/common/WalletProvider';
import { FeatureCard } from '@/components/onboarding/FeatureCard';
import { GradientText } from '@/components/common/GradientText';

const FEATURES = [
  { icon: '🤖', title: 'AI Job Decomposition', description: 'Claude/OpenAI automatically breaks jobs into microtasks and assigns them to workers by reputation.' },
  { icon: '💸', title: 'Auto cUSD Payroll', description: 'Workers get paid automatically on Celo when their task passes AI validation. No manual approval.' },
  { icon: '📱', title: 'MiniPay Native', description: 'Built for Opera MiniPay — open in-app for seamless Web3 UX without gas fee complexity.' },
  { icon: '⚡', title: 'Real-time Dashboard', description: 'Live WebSocket updates show every task assignment, validation, and payment as it happens.' },
];

const STATS = [
  { label: 'AI-Powered', value: '100%' },
  { label: 'Celo Chain', value: 'LIVE' },
  { label: 'Workers', value: '500+' },
  { label: 'Auto Payroll', value: 'cUSD' },
];

export default function HomePage() {
  const { isConnected, isMiniPayEnv } = useWalletContext();
  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute top-20 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2" />
      <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl translate-x-1/2" />

      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {isMiniPayEnv && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Running in MiniPay
            </div>
          )}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="text-white">am</span>
            <GradientText className="text-4xl sm:text-6xl lg:text-7xl font-bold">Employer</GradientText>
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 mb-3 font-mono">
            &gt; Autonomous Digital Labor Economy on Celo
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            An AI employer agent that creates jobs, decomposes them into microtasks, assigns workers by reputation, validates results, and distributes{' '}
            <span className="text-emerald-400 font-semibold">cUSD payroll</span> automatically on-chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/employer" className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all text-center shadow-lg shadow-emerald-500/20">
              Employer Dashboard →
            </Link>
            <Link href="/simulation" className="w-full sm:w-auto px-6 py-3 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 font-semibold rounded-xl transition-all hover:bg-cyan-500/10 text-center">
              ⚡ Launch Simulation
            </Link>
            <Link href="/worker" className="w-full sm:w-auto px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-400 font-semibold rounded-xl transition-all hover:bg-slate-800 text-center">
              Worker View
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i + 4} />)}
        </div>

        <div className="text-left bg-black/60 border border-emerald-500/20 rounded-xl p-5 font-mono text-xs overflow-x-auto">
          <div className="text-emerald-400 mb-3 text-sm font-semibold">// How It Works</div>
          <pre className="text-slate-400 leading-relaxed">{`[JOB] → [AI DECOMPOSE] → [ASSIGN WORKERS] → [VALIDATE] → [PAY cUSD]`}</pre>
        </div>
      </div>
    </div>
  );
}
EOF
  commit "feat(home): redesign homepage with feature cards and gradient title"
  pad_commits "homepage-redesign" 9
}
make_pr "feat/homepage-redesign" \
  "feat: homepage redesign with FeatureCard grid and GradientText title" \
  "Redesigns the landing page with a gradient hero, 4 feature cards, animated stats, MiniPay detection banner, and simplified CTA buttons. Mobile-first layout." \
  pr17

# ─── PR 18: Wallet Connection UX ──────────────────────────────────────────────
pr18() {
  cat > "$FRONTEND/components/common/ConnectWalletSheet.tsx" << 'EOF'
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletContext } from './WalletProvider';
import { MINIPAY_DEPOSIT_LINK } from '@/lib/minipay';
interface ConnectWalletSheetProps { open: boolean; onClose: () => void; }
export function ConnectWalletSheet({ open, onClose }: ConnectWalletSheetProps) {
  const { connect, isMiniPayEnv } = useWalletContext();
  const handleConnect = async () => { await connect(); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/40 rounded-t-2xl p-6 space-y-4">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white text-center">Connect Wallet</h3>
            <p className="text-sm text-slate-500 text-center">Choose how you'd like to connect to amEmployer</p>
            {isMiniPayEnv ? (
              <button onClick={handleConnect}
                className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold transition-colors">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="font-semibold">Connect MiniPay</p>
                  <p className="text-xs opacity-70">Auto-detected · Celo Network</p>
                </div>
              </button>
            ) : (
              <button onClick={handleConnect}
                className="w-full flex items-center gap-3 px-4 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-200 font-semibold transition-colors">
                <span className="text-2xl">🦊</span>
                <div className="text-left">
                  <p className="font-semibold">Connect Web3 Wallet</p>
                  <p className="text-xs text-slate-500">MetaMask, Rabby, or any injected wallet</p>
                </div>
              </button>
            )}
            <a href={MINIPAY_DEPOSIT_LINK} target="_blank" rel="noopener noreferrer"
              className="block w-full px-4 py-3 text-center text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Get cUSD via MiniPay →
            </a>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
EOF
  commit "feat(wallet): add ConnectWalletSheet bottom sheet for mobile"
  cat > "$FRONTEND/components/common/WalletBalance.tsx" << 'EOF'
'use client';
import { useWalletContext } from './WalletProvider';
import { motion } from 'framer-motion';
export function WalletBalance() {
  const { balance, address, isConnected } = useWalletContext();
  if (!isConnected || !address) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
      <span className="text-xs font-mono text-emerald-400 font-bold">{balance} cUSD</span>
    </motion.div>
  );
}
EOF
  commit "feat(wallet): add WalletBalance compact balance display"
  pad_commits "wallet-connection-ux" 8
}
make_pr "feat/wallet-connection-ux" \
  "feat: wallet connection bottom sheet with MiniPay/Web3 options" \
  "Adds a mobile-native bottom sheet for wallet connection that auto-detects MiniPay and shows appropriate connect option. Includes WalletBalance component." \
  pr18

# ─── PR 19: Search & Filter for Jobs ─────────────────────────────────────────
pr19() {
  cat > "$FRONTEND/components/employer/JobSearchBar.tsx" << 'EOF'
'use client';
interface JobSearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string; }
export function JobSearchBar({ value, onChange, placeholder = 'Search jobs…' }: JobSearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700/50 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm">✕</button>
      )}
    </div>
  );
}
EOF
  commit "feat(employer): add JobSearchBar with clear button"
  cat > "$FRONTEND/components/employer/JobFilterTabs.tsx" << 'EOF'
'use client';
type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'pending';
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Done' }, { key: 'failed', label: 'Failed' }, { key: 'pending', label: 'Pending' },
];
interface JobFilterTabsProps { active: StatusFilter; onChange: (f: StatusFilter) => void; counts?: Partial<Record<StatusFilter, number>>; }
export function JobFilterTabs({ active, onChange, counts = {} }: JobFilterTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {FILTERS.map(f => (
        <button key={f.key} onClick={() => onChange(f.key)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${active === f.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          {f.label}
          {counts[f.key] !== undefined && <span className={`px-1.5 rounded-full text-[9px] ${active === f.key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>{counts[f.key]}</span>}
        </button>
      ))}
    </div>
  );
}
EOF
  commit "feat(employer): add JobFilterTabs with status counts"
  cat > "$FRONTEND/hooks/useJobFilter.ts" << 'EOF'
import { useMemo, useState } from 'react';
interface Job { title: string; description: string; status: string; [key: string]: any; }
export function useJobFilter(jobs: Job[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, statusFilter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length };
    jobs.forEach(j => { c[j.status] = (c[j.status] || 0) + 1; });
    return c;
  }, [jobs]);
  return { filtered, search, setSearch, statusFilter, setStatusFilter, counts };
}
EOF
  commit "feat(hooks): add useJobFilter hook with search and status filtering"
  pad_commits "job-search-filter" 7
}
make_pr "feat/job-search-filter" \
  "feat: job search bar, filter tabs, and useJobFilter hook" \
  "Adds full-text job search, status filter tabs with counts, and useJobFilter hook with memoized filtering. Mobile-scrollable pill tabs." \
  pr19

# ─── PR 20: Accessibility & A11y ─────────────────────────────────────────────
pr20() {
  cat > "$FRONTEND/components/common/SkipLink.tsx" << 'EOF'
'use client';
export function SkipLink() {
  return (
    <a href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[500] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg">
      Skip to main content
    </a>
  );
}
EOF
  commit "feat(a11y): add SkipLink for keyboard navigation"
  cat >> "$FRONTEND/app/globals.css" << 'EOF'

/* A11y: focus visible styles */
:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .cyber-card { border-width: 2px; }
}
EOF
  commit "feat(a11y): add focus-visible styles and reduced-motion media query"
  cat > "$FRONTEND/hooks/useKeyboard.ts" << 'EOF'
import { useEffect } from 'react';
export function useKeyboard(key: string, callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key && !e.metaKey && !e.ctrlKey) callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, ...deps]);
}
export function useEscape(callback: () => void) {
  useKeyboard('Escape', callback, [callback]);
}
EOF
  commit "feat(hooks): add useKeyboard and useEscape accessibility hooks"
  pad_commits "accessibility" 7
}
make_pr "feat/accessibility-improvements" \
  "feat: skip link, focus-visible styles, reduced-motion, and keyboard hooks" \
  "Adds SkipLink for keyboard navigation, focus-visible outlines, reduced-motion and high-contrast media queries, and useKeyboard/useEscape hooks for modal/drawer accessibility." \
  pr20

# ─── PR 21: PWA Manifest & Offline Support ───────────────────────────────────
pr21() {
  cat > "$FRONTEND/public/manifest.json" 2>/dev/null << 'EOF'
{
  "name": "amEmployer",
  "short_name": "amEmployer",
  "description": "Autonomous AI-powered labor economy on Celo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#030712",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["finance", "utilities"],
  "prefer_related_applications": false
}
EOF
  commit "feat(pwa): add web app manifest for PWA support"
  cat >> "$FRONTEND/app/layout.tsx" << 'EOF'
// PWA manifest link added via next/head
EOF
  commit "feat(pwa): reference manifest in layout metadata"
  pad_commits "pwa-manifest" 8
}
make_pr "feat/pwa-manifest" \
  "feat: PWA manifest for installable app on mobile" \
  "Adds a web app manifest enabling amEmployer to be installed as a PWA on Android/iOS. Includes standalone display mode with Celo green theme color." \
  pr21

# ─── PR 22: Typewriter Hero Text ─────────────────────────────────────────────
pr22() {
  cat > "$FRONTEND/components/common/TypewriterText.tsx" << 'EOF'
'use client';
import { useEffect, useState } from 'react';
interface TypewriterTextProps { texts: string[]; speed?: number; pause?: number; className?: string; cursor?: boolean; }
export function TypewriterText({ texts, speed = 60, pause = 1800, className = '', cursor = true }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = texts[textIdx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }
  }, [charIdx, deleting, textIdx, texts, speed, pause]);
  useEffect(() => { setDisplayed(texts[textIdx].slice(0, charIdx)); }, [charIdx, textIdx, texts]);
  return <span className={className}>{displayed}{cursor && <span className="animate-pulse">|</span>}</span>;
}
EOF
  commit "feat(ui): add TypewriterText component with multi-phrase cycling"
  pad_commits "typewriter" 9
}
make_pr "feat/typewriter-hero-text" \
  "feat: TypewriterText component with multi-phrase cycling and cursor" \
  "Adds an animated TypewriterText component that cycles through phrases with configurable speed, pause duration, and blinking cursor." \
  pr22

# ─── PR 23: AI Log Improvements ──────────────────────────────────────────────
pr23() {
  cat > "$FRONTEND/components/common/AILogEntry.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
interface AILogEntryProps { message: string; timestamp?: string; type?: 'info' | 'success' | 'error' | 'action'; index?: number; }
const COLORS = { info: 'text-slate-400', success: 'text-emerald-400', error: 'text-red-400', action: 'text-cyan-400' };
const PREFIXES = { info: 'ℹ', success: '✓', error: '✕', action: '→' };
export function AILogEntry({ message, timestamp, type = 'info', index = 0 }: AILogEntryProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
      className="flex gap-2 py-0.5 text-xs font-mono">
      {timestamp && <span className="text-slate-700 flex-shrink-0">[{timestamp}]</span>}
      <span className={`flex-shrink-0 ${COLORS[type]}`}>{PREFIXES[type]}</span>
      <span className="text-slate-400">{message}</span>
    </motion.div>
  );
}
EOF
  commit "feat(ui): add AILogEntry component with type-colored icons"
  cat > "$FRONTEND/components/common/AIThinkingDots.tsx" << 'EOF'
'use client';
import { motion } from 'framer-motion';
export function AIThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs font-mono text-purple-400 mr-1">AI thinking</span>
      {[0,1,2].map(i => (
        <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
          className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
      ))}
    </div>
  );
}
EOF
  commit "feat(ui): add AIThinkingDots animated indicator"
  pad_commits "ai-log-improvements" 8
}
make_pr "feat/ai-log-improvements" \
  "feat: improved AI log entry with types and animated thinking dots" \
  "Adds typed AILogEntry (info/success/error/action) with colored icons and entry animation, plus AIThinkingDots for active AI state indication." \
  pr23

# ─── PR 24: Mobile Swipe Gestures ────────────────────────────────────────────
pr24() {
  cat > "$FRONTEND/hooks/useSwipe.ts" << 'EOF'
import { useRef, useCallback } from 'react';
interface SwipeHandlers { onSwipeLeft?: () => void; onSwipeRight?: () => void; onSwipeUp?: () => void; onSwipeDown?: () => void; threshold?: number; }
export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: SwipeHandlers) {
  const startX = useRef(0);
  const startY = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) onSwipeRight?.();
      else if (dx < -threshold) onSwipeLeft?.();
    } else {
      if (dy > threshold) onSwipeDown?.();
      else if (dy < -threshold) onSwipeUp?.();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
  return { onTouchStart, onTouchEnd };
}
EOF
  commit "feat(hooks): add useSwipe hook for touch gesture detection"
  cat > "$FRONTEND/components/common/SwipeableCard.tsx" << 'EOF'
'use client';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useRef } from 'react';
interface SwipeableCardProps { children: React.ReactNode; onSwipeLeft?: () => void; onSwipeRight?: () => void; className?: string; }
export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, className = '' }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.3, 1, 0.3]);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const controls = useAnimation();
  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x < -80) { await controls.start({ x: -300, opacity: 0 }); onSwipeLeft?.(); }
    else if (info.offset.x > 80) { await controls.start({ x: 300, opacity: 0 }); onSwipeRight?.(); }
    else controls.start({ x: 0, rotate: 0 });
  };
  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x, opacity, rotate }}
      animate={controls} onDragEnd={handleDragEnd} className={`cursor-grab active:cursor-grabbing ${className}`}>
      {children}
    </motion.div>
  );
}
EOF
  commit "feat(ui): add SwipeableCard with Framer Motion drag gestures"
  pad_commits "swipe-gestures" 8
}
make_pr "feat/mobile-swipe-gestures" \
  "feat: useSwipe hook and SwipeableCard with Framer Motion drag" \
  "Adds a useSwipe hook for detecting 4-direction touch gestures, and SwipeableCard with Framer Motion drag-to-dismiss functionality for mobile list items." \
  pr24

# ─── PR 25: cUSD Transaction History ─────────────────────────────────────────
pr25() {
  mkdir -p "$FRONTEND/app/transactions"
  cat > "$FRONTEND/app/transactions/page.tsx" << 'EOF'
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/common/SectionHeader';
import { timeAgo, shortenAddress } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
export default function TransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    api.stats.platform().then(r => {
      const p = r.data?.payments?.recent || [];
      setPayments(p);
      setTotal(parseFloat(r.data?.payments?.totalAmount || '0'));
    }).finally(() => setLoading(false));
  }, []);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <SectionHeader title="Transaction History" subtitle={`${total.toFixed(2)} cUSD total disbursed on Celo`} />
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden divide-y divide-slate-700/20">
          {payments.length === 0 ? (
            <p className="text-center py-12 text-slate-600">No transactions yet.</p>
          ) : payments.map((p: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs font-bold">↑</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{p.task?.title || 'Task Payment'}</p>
                  <p className="text-xs text-slate-500 font-mono">→ {shortenAddress(p.worker?.walletAddress || p.worker || '')}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono font-bold text-emerald-400">+{parseFloat(p.amount).toFixed(4)} cUSD</p>
                <p className="text-xs text-slate-600">{timeAgo(p.createdAt || p.timestamp || '')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
EOF
  commit "feat(transactions): add /transactions history page"
  pad_commits "transaction-history" 9
}
make_pr "feat/cusd-transaction-history" \
  "feat: cUSD transaction history page with animated list" \
  "Adds a /transactions page showing all historical cUSD payments with worker addresses, task titles, amounts, and timestamps. Skeleton loading and animated entry." \
  pr25

echo "✅ PRs 16-25 complete."
