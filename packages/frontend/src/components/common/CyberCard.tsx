'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'emerald' | 'cyan' | 'purple' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}
const glowClasses = {
  emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
  cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
  purple: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
  none: '',
};
export function CyberCard({ children, className, glow = 'emerald', onClick, hoverable = false }: CyberCardProps) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn('bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 transition-all duration-200 shadow-lg', glow !== 'none' && glowClasses[glow], hoverable && 'cursor-pointer hover:bg-slate-800/60', className)}
    >
      {children}
    </motion.div>
  );
}
