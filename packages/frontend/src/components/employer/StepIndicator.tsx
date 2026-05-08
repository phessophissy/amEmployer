'use client';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`flex flex-col items-center ${i < steps.length - 1 ? 'mr-0' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 transition-all duration-300 ${
              i < current ? 'bg-emerald-500 border-emerald-500 text-black'
              : i === current ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
              : 'border-slate-600 text-slate-600'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 font-mono whitespace-nowrap ${i === current ? 'text-emerald-400' : 'text-slate-600'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-0 mb-5 transition-all duration-300 ${i < current ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
