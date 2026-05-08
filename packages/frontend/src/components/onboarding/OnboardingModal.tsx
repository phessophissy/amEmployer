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
