'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export function LiveWorkerCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    api.stats.platform().then(r => setCount(r.data?.workers?.active || 0)).catch(() => {});
    const id = setInterval(() => api.stats.platform().then(r => setCount(r.data?.workers?.active || 0)).catch(() => {}), 8000);
    return () => clearInterval(id);
  }, []);
  if (count === null) return null;
  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-xs font-mono">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-slate-400">{count} active</span>
    </div>
  );
}
