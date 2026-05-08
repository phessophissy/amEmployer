'use client';
type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'pending';
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Done' }, { key: 'failed', label: 'Failed' }, { key: 'pending', label: 'Pending' },
];
interface JobFilterTabsProps { active: StatusFilter; onChange: (f: StatusFilter) => void; counts?: Partial<Record<StatusFilter, number>>; }
export function JobFilterTabs({ active, onChange, counts = {} }: JobFilterTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {FILTERS.map(f => (
        <button key={f.key} onClick={() => onChange(f.key)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${active === f.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          {f.label}
          {counts[f.key] !== undefined && <span className={`px-1.5 rounded-full text-[9px] ${active === f.key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>{counts[f.key]}</span>}
        </button>
      ))}
    </div>
  );
}
