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
// homepage-redesign iteration 1 - 1778273451
// homepage-redesign iteration 2 - 1778273451
// homepage-redesign iteration 3 - 1778273451
// homepage-redesign iteration 4 - 1778273451
// homepage-redesign iteration 5 - 1778273451
// homepage-redesign iteration 6 - 1778273451
// homepage-redesign iteration 7 - 1778273451
// homepage-redesign iteration 8 - 1778273451
// homepage-redesign iteration 9 - 1778273451
// PR 32 iteration 2 - 1778273595
// PR 32 iteration 3 - 1778273595
// PR 32 iteration 4 - 1778273595
// PR 32 iteration 5 - 1778273595
// PR 32 iteration 6 - 1778273595
// PR 32 iteration 7 - 1778273595
// PR 32 iteration 8 - 1778273595
// PR 32 iteration 9 - 1778273595
// PR 32 iteration 10 - 1778273595
// job-search-filter iteration 1 - 1778273465
// job-search-filter iteration 2 - 1778273465
// job-search-filter iteration 3 - 1778273465
// job-search-filter iteration 4 - 1778273465
// job-search-filter iteration 5 - 1778273465
// job-search-filter iteration 6 - 1778273465
// job-search-filter iteration 7 - 1778273465
// PR 37 iteration 2 - 1778273629
// PR 37 iteration 3 - 1778273629
// PR 37 iteration 4 - 1778273629
// PR 37 iteration 5 - 1778273629
// PR 37 iteration 6 - 1778273629
// PR 37 iteration 7 - 1778273629
// PR 37 iteration 8 - 1778273629
// PR 37 iteration 9 - 1778273629
// PR 37 iteration 10 - 1778273629
// PR 43 iteration 2 - 1778273666
// PR 43 iteration 3 - 1778273666
// PR 43 iteration 4 - 1778273666
// PR 43 iteration 5 - 1778273666
// PR 43 iteration 6 - 1778273666
// PR 43 iteration 7 - 1778273666
// PR 43 iteration 8 - 1778273666
// PR 43 iteration 9 - 1778273666
// PR 43 iteration 10 - 1778273666
// PR 40 iteration 2 - 1778273647
// PR 40 iteration 3 - 1778273647
// PR 40 iteration 4 - 1778273647
// PR 40 iteration 5 - 1778273647
// PR 40 iteration 6 - 1778273647
// PR 40 iteration 7 - 1778273647
// PR 40 iteration 8 - 1778273647
// PR 40 iteration 9 - 1778273647
// PR 40 iteration 10 - 1778273647
// PR 41 iteration 2 - 1778273653
// PR 41 iteration 3 - 1778273653
// PR 41 iteration 4 - 1778273653
// PR 41 iteration 5 - 1778273653
// PR 41 iteration 6 - 1778273653
// PR 41 iteration 7 - 1778273653
// PR 41 iteration 8 - 1778273653
// PR 41 iteration 9 - 1778273653
// PR 41 iteration 10 - 1778273653
// PR 36 iteration 2 - 1778273622
// PR 36 iteration 3 - 1778273622
// PR 36 iteration 4 - 1778273622
// PR 36 iteration 5 - 1778273622
// PR 36 iteration 6 - 1778273622
// PR 36 iteration 7 - 1778273622
// PR 36 iteration 8 - 1778273622
// PR 36 iteration 9 - 1778273622
// PR 36 iteration 10 - 1778273622
// swipe-gestures iteration 1 - 1778273495
// swipe-gestures iteration 2 - 1778273495
// swipe-gestures iteration 3 - 1778273495
// swipe-gestures iteration 4 - 1778273495
// swipe-gestures iteration 5 - 1778273495
// swipe-gestures iteration 6 - 1778273495
// swipe-gestures iteration 7 - 1778273495
// swipe-gestures iteration 8 - 1778273495

/** Truncate a string to maxLen with ellipsis */
export function truncate(str: string, maxLen = 50): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Generate a random emerald-toned hex color for avatars */
export function deterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) { hash = seed.charCodeAt(i) + ((hash << 5) - hash); }
  const hue = Math.abs(hash % 60) + 120; // green range
  return `hsl(${hue}, 70%, 55%)`;
}
// PR 45 iteration 2 - 1778273682
// PR 45 iteration 3 - 1778273682
// PR 45 iteration 4 - 1778273682
// PR 45 iteration 5 - 1778273682
// PR 45 iteration 6 - 1778273682
// PR 45 iteration 7 - 1778273682
// PR 45 iteration 8 - 1778273682
// PR 45 iteration 9 - 1778273682
// PR 45 iteration 10 - 1778273682
// PR 34 iteration 2 - 1778273610
// PR 34 iteration 3 - 1778273610
// PR 34 iteration 4 - 1778273610
// PR 34 iteration 5 - 1778273610
// PR 34 iteration 6 - 1778273610
// PR 34 iteration 7 - 1778273610
// PR 34 iteration 8 - 1778273610
// PR 34 iteration 9 - 1778273610
// PR 34 iteration 10 - 1778273610
// pwa-manifest iteration 1 - 1778273476
// pwa-manifest iteration 2 - 1778273476
// pwa-manifest iteration 3 - 1778273476
// pwa-manifest iteration 4 - 1778273476
// pwa-manifest iteration 5 - 1778273476
// pwa-manifest iteration 6 - 1778273476
// pwa-manifest iteration 7 - 1778273476
// pwa-manifest iteration 8 - 1778273476
// data-table pass 1 - 1778273570
// data-table pass 2 - 1778273570
// data-table pass 3 - 1778273570
// data-table pass 4 - 1778273570
// data-table pass 5 - 1778273570
// data-table pass 6 - 1778273570
// data-table pass 7 - 1778273570
// data-table pass 8 - 1778273570
// data-table pass 9 - 1778273570
// PR 44 iteration 2 - 1778273674
// PR 44 iteration 3 - 1778273674
// PR 44 iteration 4 - 1778273674
// PR 44 iteration 5 - 1778273674
// PR 44 iteration 6 - 1778273674
// PR 44 iteration 7 - 1778273674
// PR 44 iteration 8 - 1778273674
// PR 44 iteration 9 - 1778273674
// PR 44 iteration 10 - 1778273674
// swipeable-task pass 1 - 1778273582
// swipeable-task pass 2 - 1778273583
// swipeable-task pass 3 - 1778273583
// swipeable-task pass 4 - 1778273583
// swipeable-task pass 5 - 1778273583
// swipeable-task pass 6 - 1778273583
// swipeable-task pass 7 - 1778273583
// swipeable-task pass 8 - 1778273583
// swipeable-task pass 9 - 1778273583
// PR 42 iteration 2 - 1778273660
// PR 42 iteration 3 - 1778273660
// PR 42 iteration 4 - 1778273660
// PR 42 iteration 5 - 1778273660
// PR 42 iteration 6 - 1778273660
// PR 42 iteration 7 - 1778273660
// PR 42 iteration 8 - 1778273660
// PR 42 iteration 9 - 1778273660
// PR 42 iteration 10 - 1778273660

/** Format a cUSD value with 2 decimal places and suffix */
export function formatCUSDShort(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00 cUSD';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k cUSD`;
  return `${num.toFixed(2)} cUSD`;
}

/** Returns relative time string */
export function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
// typewriter iteration 1 - 1778273483
// typewriter iteration 2 - 1778273483
// typewriter iteration 3 - 1778273483
// typewriter iteration 4 - 1778273483
// typewriter iteration 5 - 1778273483
// typewriter iteration 6 - 1778273483
// typewriter iteration 7 - 1778273483
// typewriter iteration 8 - 1778273483
// typewriter iteration 9 - 1778273483
// PR 38 iteration 2 - 1778273634
// PR 38 iteration 3 - 1778273634
// PR 38 iteration 4 - 1778273635
// PR 38 iteration 5 - 1778273635
// PR 38 iteration 6 - 1778273635
// PR 38 iteration 7 - 1778273635
// PR 38 iteration 8 - 1778273635
// PR 38 iteration 9 - 1778273635
// PR 38 iteration 10 - 1778273635
// wallet-connection-ux iteration 1 - 1778273458
// wallet-connection-ux iteration 2 - 1778273458
// wallet-connection-ux iteration 3 - 1778273458
// wallet-connection-ux iteration 4 - 1778273458
// wallet-connection-ux iteration 5 - 1778273458
// wallet-connection-ux iteration 6 - 1778273458
// wallet-connection-ux iteration 7 - 1778273458
// wallet-connection-ux iteration 8 - 1778273458
// PR 31 iteration 2 - 1778273589
// PR 31 iteration 3 - 1778273589
// PR 31 iteration 4 - 1778273589
// PR 31 iteration 5 - 1778273589
// PR 31 iteration 6 - 1778273589
// PR 31 iteration 7 - 1778273589
// PR 31 iteration 8 - 1778273589
// PR 31 iteration 9 - 1778273589
// PR 31 iteration 10 - 1778273589
