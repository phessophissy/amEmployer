'use client';
import { motion } from 'framer-motion';

interface PullToRefreshIndicatorProps {
  pullY: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullY, refreshing, threshold = 72 }: PullToRefreshIndicatorProps) {
  const progress = Math.min(1, pullY / threshold);
  if (pullY === 0 && !refreshing) return null;
  return (
    <motion.div
      style={{ height: refreshing ? 48 : pullY }}
      className="flex items-center justify-center overflow-hidden"
    >
      <div className={`w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`}
        style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
      />
    </motion.div>
  );
}
