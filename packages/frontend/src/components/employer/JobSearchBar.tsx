'use client';
interface JobSearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string; }
export function JobSearchBar({ value, onChange, placeholder = 'Search jobs…' }: JobSearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700/50 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm">✕</button>
      )}
    </div>
  );
}
