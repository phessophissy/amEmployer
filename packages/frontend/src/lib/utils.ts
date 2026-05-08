import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function formatCUSD(amount: string | number, decimals = 4): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${n.toFixed(decimals)} cUSD`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ASSIGNED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  SUBMITTED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  VERIFIED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
  PAID: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  PENDING: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  DECOMPOSING: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  COMPLETED: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  FAILED: 'text-red-400 bg-red-500/10 border-red-500/20',
};
// PR 37 iteration 2 - 1778273629
// PR 37 iteration 3 - 1778273629
// PR 37 iteration 4 - 1778273629
// PR 37 iteration 5 - 1778273629
// PR 37 iteration 6 - 1778273629
// PR 37 iteration 7 - 1778273629
// PR 37 iteration 8 - 1778273629
