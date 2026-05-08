'use client';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { cn, STATUS_COLORS, timeAgo } from '@/lib/utils';
interface SwipeableTaskCardProps {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: string;
  createdAt: string;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}
export function SwipeableTaskCard({ id, title, description, reward, status, createdAt, onComplete, onSkip }: SwipeableTaskCardProps) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-120, 0, 120], ['rgba(239,68,68,0.15)', 'transparent', 'rgba(16,185,129,0.15)']);
  const controls = useAnimation();
  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 80) { await controls.start({ x: 300, opacity: 0 }); onComplete?.(id); }
    else if (info.offset.x < -80) { await controls.start({ x: -300, opacity: 0 }); onSkip?.(id); }
    else controls.start({ x: 0 });
  };
  return (
    <div className="relative overflow-hidden rounded-xl mb-2">
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <span className="text-emerald-400 font-bold text-sm opacity-60">✓ Complete</span>
        <span className="text-red-400 font-bold text-sm opacity-60">Skip ✕</span>
      </div>
      <motion.div drag="x" dragConstraints={{ left: -5, right: 5 }} dragElastic={0.8}
        style={{ x, backgroundColor: bg }} animate={controls} onDragEnd={handleDragEnd}
        className="relative bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{title}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
            <p className="text-xs text-slate-600 mt-2 font-mono">{timeAgo(createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', STATUS_COLORS[status])}>{status}</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{parseFloat(reward).toFixed(3)} cUSD</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
