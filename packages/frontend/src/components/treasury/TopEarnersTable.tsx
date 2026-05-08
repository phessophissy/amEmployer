'use client';
import { shortenAddress } from '@/lib/utils';
interface Worker { walletAddress: string; personaName?: string; totalEarnings: string; completedTasks: number; }
interface TopEarnersTableProps { workers: Worker[]; }
export function TopEarnersTable({ workers }: TopEarnersTableProps) {
  const sorted = [...workers].sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings)).slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/30">
            {['Rank', 'Worker', 'Tasks', 'Earned'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/20">
          {sorted.map((w, i) => (
            <tr key={w.walletAddress} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{i + 1}</td>
              <td className="px-3 py-2.5">
                <p className="text-slate-200">{w.personaName || shortenAddress(w.walletAddress)}</p>
                <p className="text-xs text-slate-600 font-mono">{w.walletAddress.slice(0,8)}…</p>
              </td>
              <td className="px-3 py-2.5 font-mono text-slate-400">{w.completedTasks}</td>
              <td className="px-3 py-2.5 font-mono font-bold text-emerald-400">{parseFloat(w.totalEarnings).toFixed(2)} cUSD</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
