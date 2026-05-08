'use client';

interface ReviewStepProps {
  title: string;
  description: string;
  totalBudget: string;
  employerAddress: string;
}

export function ReviewStep({ title, description, totalBudget, employerAddress }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Review before submitting</p>
      {[
        { label: 'Job Title', value: title || '—' },
        { label: 'Budget', value: totalBudget ? `${totalBudget} cUSD` : '—' },
        { label: 'Employer', value: employerAddress ? `${employerAddress.slice(0,10)}…` : '—' },
      ].map(row => (
        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-700/30 last:border-0">
          <span className="text-xs text-slate-500 font-mono">{row.label}</span>
          <span className="text-sm text-slate-200 text-right font-medium">{row.value}</span>
        </div>
      ))}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <p className="text-xs font-mono text-slate-500 mb-2">Description</p>
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{description || '—'}</p>
      </div>
      <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 text-xs font-mono text-emerald-400">
        ⚡ AI will auto-decompose this job into microtasks, assign workers, validate results, and distribute cUSD payroll on Celo.
      </div>
    </div>
  );
}
