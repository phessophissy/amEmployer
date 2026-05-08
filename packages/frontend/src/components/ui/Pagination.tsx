'use client';
interface PaginationProps { page: number; totalPages: number; onPage: (p: number) => void; }
export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, page - 2);
    return start + i;
  }).filter(p => p <= totalPages);
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPage(page-1)} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-colors">←</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)} className={"px-3 py-1.5 text-sm font-mono rounded-lg transition-colors " + (p===page ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page+1)} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-40 transition-colors">→</button>
    </div>
  );
}
