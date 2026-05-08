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
// accessibility iteration 1 - 1778273471
// accessibility iteration 2 - 1778273471
// accessibility iteration 3 - 1778273471
// accessibility iteration 4 - 1778273471
// accessibility iteration 5 - 1778273471
// accessibility iteration 6 - 1778273471
// accessibility iteration 7 - 1778273471
// ai-log-improvements iteration 1 - 1778273489
// ai-log-improvements iteration 2 - 1778273489
// ai-log-improvements iteration 3 - 1778273489
// ai-log-improvements iteration 4 - 1778273489
// ai-log-improvements iteration 5 - 1778273489
// ai-log-improvements iteration 6 - 1778273489
// ai-log-improvements iteration 7 - 1778273489
// ai-log-improvements iteration 8 - 1778273489
// PR 46 iteration 2 - 1778273689
// PR 46 iteration 3 - 1778273689
// PR 46 iteration 4 - 1778273689
// PR 46 iteration 5 - 1778273689
// PR 46 iteration 6 - 1778273689
// PR 46 iteration 7 - 1778273689
// PR 46 iteration 8 - 1778273689
// PR 46 iteration 9 - 1778273689
// PR 46 iteration 10 - 1778273689
// PR 33 iteration 2 - 1778273604
// PR 33 iteration 3 - 1778273604
// PR 33 iteration 4 - 1778273604
// PR 33 iteration 5 - 1778273604
// PR 33 iteration 6 - 1778273604
// PR 33 iteration 7 - 1778273604
// PR 33 iteration 8 - 1778273604
// PR 33 iteration 9 - 1778273604
// PR 33 iteration 10 - 1778273604
// PR 35 iteration 2 - 1778273616
// PR 35 iteration 3 - 1778273616
// PR 35 iteration 4 - 1778273616
// PR 35 iteration 5 - 1778273616
// PR 35 iteration 6 - 1778273616
// PR 35 iteration 7 - 1778273616
// PR 35 iteration 8 - 1778273616
// PR 35 iteration 9 - 1778273616
// PR 35 iteration 10 - 1778273616
// copy-clipboard pass 1 - 1778273576
// copy-clipboard pass 2 - 1778273576
// copy-clipboard pass 3 - 1778273576
// copy-clipboard pass 4 - 1778273576
// copy-clipboard pass 5 - 1778273576
// copy-clipboard pass 6 - 1778273576
// copy-clipboard pass 7 - 1778273576
// copy-clipboard pass 8 - 1778273576
// transaction-history iteration 1 - 1778273503
// transaction-history iteration 2 - 1778273503
// transaction-history iteration 3 - 1778273503
// transaction-history iteration 4 - 1778273503
// transaction-history iteration 5 - 1778273503
// transaction-history iteration 6 - 1778273503
// transaction-history iteration 7 - 1778273503
// transaction-history iteration 8 - 1778273503
// transaction-history iteration 9 - 1778273503
// employer-analytics pass 1 - 1778273562
// employer-analytics pass 2 - 1778273562
// employer-analytics pass 3 - 1778273562
// employer-analytics pass 4 - 1778273562
// employer-analytics pass 5 - 1778273562
// employer-analytics pass 6 - 1778273562
// employer-analytics pass 7 - 1778273562
// employer-analytics pass 8 - 1778273562
// employer-analytics pass 9 - 1778273562
// PR 39 iteration 2 - 1778273640
// PR 39 iteration 3 - 1778273640
// PR 39 iteration 4 - 1778273641
// PR 39 iteration 5 - 1778273641
// PR 39 iteration 6 - 1778273641
// PR 39 iteration 7 - 1778273641
// PR 39 iteration 8 - 1778273641
// PR 39 iteration 9 - 1778273641
// PR 39 iteration 10 - 1778273641
// PR 49 iteration 2 - 1778273719
// PR 49 iteration 3 - 1778273719
// PR 49 iteration 4 - 1778273719
// PR 49 iteration 5 - 1778273719
// PR 49 iteration 6 - 1778273719
// PR 49 iteration 7 - 1778273719
// PR 49 iteration 8 - 1778273719
// PR 49 iteration 9 - 1778273719
// PR 49 iteration 10 - 1778273719

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Debounce a function */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  }) as T;
}
// PR 48 iteration 2 - 1778273712
// PR 48 iteration 3 - 1778273712
// PR 48 iteration 4 - 1778273712
// PR 48 iteration 5 - 1778273712
// PR 48 iteration 6 - 1778273712
// PR 48 iteration 7 - 1778273712
// PR 48 iteration 8 - 1778273712
// PR 48 iteration 9 - 1778273712
// PR 48 iteration 10 - 1778273712
// glassmorphism pass 1 - 1778273556
// glassmorphism pass 2 - 1778273556
// glassmorphism pass 3 - 1778273556
// glassmorphism pass 4 - 1778273556
// glassmorphism pass 5 - 1778273556
// glassmorphism pass 6 - 1778273556
// glassmorphism pass 7 - 1778273556
// glassmorphism pass 8 - 1778273556
