'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stats = [
  { label: 'AI-Powered', value: '100%' },
  { label: 'Celo Chain', value: 'LIVE' },
  { label: 'Workers Supported', value: '500+' },
  { label: 'cUSD Payroll', value: 'AUTO' },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto"
      >
        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
          <span className="text-white">am</span>
          <span className="text-emerald-400 text-glow-green">Employer</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 mb-4 font-mono">
          &gt; Autonomous Digital Labor Economy on Celo
        </p>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
          An AI employer agent that creates jobs, decomposes them into microtasks,
          assigns workers, validates results with AI, and distributes{' '}
          <span className="text-emerald-400">cUSD payroll</span> automatically on-chain.
          Supporting <span className="text-cyan-400">100+ concurrent workers</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link
            href="/employer"
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-all duration-200 shadow-cyber-green hover:shadow-[0_0_30px_rgba(0,255,136,0.6)]"
          >
            Employer Dashboard
          </Link>
          <Link
            href="/simulation"
            className="px-8 py-3 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 font-semibold rounded-lg transition-all duration-200 hover:bg-cyan-500/10"
          >
            Launch Simulation
          </Link>
          <Link
            href="/worker"
            className="px-8 py-3 border border-slate-600 hover:border-slate-500 text-slate-400 font-semibold rounded-lg transition-all duration-200 hover:bg-slate-800"
          >
            Worker View
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div
              key={s.label}
              className="cyber-card border border-slate-700/50 bg-slate-900/50 rounded-xl p-4 backdrop-blur"
            >
              <div className="text-2xl font-bold text-emerald-400 font-mono">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Architecture diagram (text-based) */}
        <div className="text-left bg-black/60 border border-emerald-500/20 rounded-xl p-6 font-mono text-sm">
          <div className="text-emerald-400 mb-3">// System Architecture</div>
          <pre className="text-slate-400 leading-relaxed">{`[JOB INPUT] → [AI EMPLOYER AGENT]
                       │
          ┌────────────┴────────────┐
          │      Decompose Job      │
          │   (Claude / OpenAI)     │
          └────────────┬────────────┘
                       │  microtasks[]
          ┌────────────▼────────────┐
          │    Task Assignment      │
          │  (reputation-weighted)  │
          └──────┬──────────┬───────┘
                 │          │
          [HUMAN]    [SCRIPTED]    [AI AGENT]
          WORKER      WALLET       PERSONA
                 │          │
          ┌──────▼──────────▼───────┐
          │   AI Validation Layer   │
          │  score >= 60 → APPROVE  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Auto cUSD Payment      │  ← Celo Blockchain
          │  (TaskManager.sol)      │
          └─────────────────────────┘`}</pre>
        </div>
      </motion.div>
    </div>
  );
}
