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
  const { isConnected, isMiniPayEnv, isLoading, connect } = useWalletContext();
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

          {!isConnected && (
            <div className="mx-auto mb-10 max-w-xl rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-mono text-slate-300 mb-3">
                Connect a wallet to start posting jobs and paying workers on Celo.
              </p>
              <button
                onClick={connect}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          )}

          {isConnected && (
            <p className="mb-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Wallet connected
            </p>
          )}
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
