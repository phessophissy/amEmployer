'use client';
import { cn } from '@/lib/utils';
const STAGES = ['Created','Decomposing','Assigning','In Progress','Validating','Paying','Complete'];
interface JobProgressTrackerProps { currentStage: number; }
export function JobProgressTracker({ currentStage }: JobProgressTrackerProps) {
  return (
    <div className="overflow-x-auto py-2">
      <div className="flex items-center min-w-max gap-0">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all', i < currentStage ? 'bg-emerald-500 border-emerald-500 text-black' : i === currentStage ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' : 'border-slate-600 text-slate-600')}>
                {i < currentStage ? '✓' : i + 1}
              </div>
              <span className={cn('text-[9px] mt-1 whitespace-nowrap font-mono', i === currentStage ? 'text-emerald-400' : i < currentStage ? 'text-slate-400' : 'text-slate-600')}>{stage}</span>
            </div>
            {i < STAGES.length-1 && <div className={cn('w-6 h-0.5 mb-4', i < currentStage ? 'bg-emerald-500' : 'bg-slate-700')} />}
          </div>
        ))}
      </div>
    </div>
  );
}
