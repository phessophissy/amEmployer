'use client';
import { cn } from '@/lib/utils';
interface GlassCardProps { children: React.ReactNode; className?: string; variant?: 'default' | 'emerald' | 'cyan'; }
const variants = { default: 'glass', emerald: 'glass-emerald neon-shadow-green', cyan: 'glass-cyan neon-shadow-cyan' };
export function GlassCard({ children, className, variant = 'default' }: GlassCardProps) {
  return <div className={cn('rounded-2xl p-5', variants[variant], className)}>{children}</div>;
}
