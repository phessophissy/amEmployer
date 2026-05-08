'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES = [
  { path: '/employer', label: 'Employer Dashboard', keywords: ['jobs', 'create', 'budget'] },
  { path: '/worker', label: 'Worker Dashboard', keywords: ['reputation', 'tasks', 'leaderboard'] },
  { path: '/treasury', label: 'Treasury', keywords: ['payments', 'cUSD', 'earnings'] },
  { path: '/simulation', label: 'Simulation', keywords: ['demo', 'launch', 'ai'] },
];

export function NavSearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const results = query.length > 1
    ? ROUTES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()) || r.keywords.some(k => k.includes(query.toLowerCase())))
    : [];

  const go = useCallback((path: string) => { router.push(path); setQuery(''); setOpen(false); }, [router]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs font-mono text-slate-500 w-36 hover:border-emerald-500/30 transition-all cursor-text"
        onClick={() => setOpen(true)}>
        <span className="opacity-60">⌕</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search…"
          className="bg-transparent outline-none w-full text-slate-300 placeholder-slate-600"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-9 left-0 z-50 w-56 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
          {results.map(r => (
            <button key={r.path} onClick={() => go(r.path)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-800 text-sm text-slate-300 transition-colors">
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
