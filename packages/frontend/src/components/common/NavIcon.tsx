import { cn } from '@/lib/utils';

interface NavIconProps {
  name: 'home' | 'employer' | 'worker' | 'simulate' | 'treasury' | 'transactions';
  active?: boolean;
  className?: string;
}

const ICON_PATHS: Record<NavIconProps['name'], JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  employer: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="12" cy="14" r="2" />
      <path d="M10 16.5c0-.83.67-1.5 2-1.5s2 .67 2 1.5" />
    </svg>
  ),
  worker: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M13.5 20a4.5 4.5 0 0 1 7 0" />
    </svg>
  ),
  simulate: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  treasury: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  ),
};

export function NavIcon({ name, active = false, className }: NavIconProps) {
  return (
    <span
      className={cn(
        'block w-[22px] h-[22px] transition-all duration-150',
        active ? 'stroke-emerald-400' : 'stroke-slate-500',
        className
      )}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </span>
  );
}
