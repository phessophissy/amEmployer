'use client';
import Link from 'next/link';
import { Avatar } from '@/components/common/Avatar';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { StatusDot } from '@/components/common/StatusDot';
interface WorkerListItemProps { id: string; walletAddress: string; personaName?: string; reputation: number; totalEarnings: string; isActive: boolean; completedTasks: number; }
export function WorkerListItem({ id, walletAddress, personaName, reputation, totalEarnings, isActive, completedTasks }: WorkerListItemProps) {
  return (
    <Link href={`/worker/${id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
      <Avatar seed={walletAddress} size="md" label={personaName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">{personaName || walletAddress.slice(0,10)+'…'}</p>
          <StatusDot status={isActive ? 'online' : 'offline'} />
        </div>
        <p className="text-xs text-slate-500">{completedTasks} tasks</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <ReputationBadge score={reputation} />
        <span className="text-xs font-mono text-emerald-400">{parseFloat(totalEarnings).toFixed(2)} cUSD</span>
      </div>
    </Link>
  );
}
