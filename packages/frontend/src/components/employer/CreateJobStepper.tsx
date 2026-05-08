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
