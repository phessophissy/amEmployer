'use client';
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
      className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-4xl mb-5">
        {ill.emoji}
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{ill.title}</h3>
      <p className="text-sm text-slate-600 max-w-xs leading-relaxed">{ill.subtitle}</p>
      {action && (
        <button onClick={action.onClick} className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors">
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
