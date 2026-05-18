'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { ReputationGauge } from '@/components/reputation/ReputationGauge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/common/Avatar';
import { timeAgo } from '@/lib/utils';
export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const address = String(id);
    Promise.all([
      api.workers.get(address).catch(() => null),
      api.workers.earnings(address).catch(() => null),
    ])
      .then(([workerRes, earningsRes]) => {
        const profile = workerRes?.data;
        if (profile) {
          setWorker({ ...profile, earningsDetail: earningsRes?.data });
        } else {
          return api.workers.list({ limit: '200' }).then((r) => {
            const found = (r.data || []).find((w: any) => w.id === id || w.walletAddress === id);
            setWorker(found ? { ...found, earningsDetail: earningsRes?.data } : null);
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="max-w-lg mx-auto px-4 py-6 space-y-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;
  if (!worker) return <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-500">Worker not found</div>;
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-5">
          <Avatar seed={worker.walletAddress} size="lg" label={worker.personaName} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{worker.personaName || 'Worker'}</h1>
            <p className="text-xs font-mono text-slate-500 truncate mt-0.5">{worker.walletAddress}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <ReputationBadge score={worker.reputation} showLabel />
              <span className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-400 font-mono">{worker.workerType}</span>
            </div>
          </div>
          <ReputationGauge score={worker.reputation} size={64} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Completed', value: worker.completedTasks, color: 'text-emerald-400' },
            { label: 'Failed', value: worker.failedTasks, color: 'text-red-400' },
            { label: 'Earnings', value: `${parseFloat(worker.totalEarnings || '0').toFixed(2)}`, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-3">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Activity</p>
        <p className="text-xs text-slate-600">Joined {timeAgo(worker.createdAt)}</p>
        <p className="text-xs text-slate-600 mt-1">{worker.isActive ? '● Active now' : '○ Offline'}</p>
      </div>
    </div>
  );
}
