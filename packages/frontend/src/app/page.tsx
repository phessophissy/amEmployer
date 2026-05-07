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
    <div className="relative flex flex-col items-center justify-center px-4 py-10 overflow-x-hidden min-h-[calc(100vh-7rem)]">
      {/* Background glow — contained so they never push layout width */}
      <div className="pointer-events-none absolute top-1/4 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2" />
      <div className="pointer-events-none absolute bottom-1/4 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl mx-auto text-center"
      >
        {/* Title — scales from 2.5rem on 360px up to 4.5rem on desktop */}
        <h1 className="text-[2.5rem] leading-tight sm:text-6xl lg:text-7xl font-bold tracking-tight mb-3">
          <span className="text-white">am</span>
          <span className="text-emerald-400 text-glow-green">Employer</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-400 mb-3 font-mono truncate sm:whitespace-normal">
          &gt; Autonomous Digital Labor Economy on Celo
        </p>

        <p className="text-sm text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
          An AI employer agent that creates jobs, decomposes them into microtasks,
          assigns workers, validates results with AI, and distributes{' '}
          <span className="text-emerald-400">cUSD payroll</span> automatically on-chain.
          Supporting <span className="text-cyan-400">100+ concurrent workers</span>.
        </p>

        {/* CTA Buttons — stack on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/employer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-all duration-200 text-center shadow-cyber-green"
          >
            Employer Dashboard
          </Link>
          <Link
            href="/simulation"
            className="w-full sm:w-auto px-6 py-3 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 font-semibold rounded-lg transition-all duration-200 hover:bg-cyan-500/10 text-center"
          >
            Launch Simulation
          </Link>
          <Link
            href="/worker"
            className="w-full sm:w-auto px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-400 font-semibold rounded-lg transition-all duration-200 hover:bg-slate-800 text-center"
          >
            Worker View
          </Link>
        </div>

        {/* Stats — 2-col grid, no overflow */}
        <div className="grid grid-cols-2 gap-3 mb-10">
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

        {/* Architecture — scrollable pre, no page overflow */}
        <div className="text-left bg-black/60 border border-emerald-500/20 rounded-xl p-4 font-mono text-xs overflow-x-auto">
          <div className="text-emerald-400 mb-2 text-sm">// System Architecture</div>
          <pre className="text-slate-400 leading-relaxed whitespace-pre">{`[JOB INPUT] → [AI EMPLOYER AGENT]
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
       [HUMAN]   [SCRIPTED]   [AI AGENT]
              │          │
       ┌──────▼──────────▼───────┐
       │   AI Validation Layer   │
       │  score >= 60 → APPROVE  │
       └────────────┬────────────┘
                    │
       ┌────────────▼────────────┐
       │  Auto cUSD Payment      │ ← Celo
       │  (TaskManager.sol)      │
       └─────────────────────────┘`}</pre>
        </div>
      </motion.div>
    </div>
  );
}
