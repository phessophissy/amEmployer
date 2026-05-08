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
