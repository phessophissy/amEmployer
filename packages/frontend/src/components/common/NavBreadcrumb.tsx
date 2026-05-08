'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '': 'Home', employer: 'Employer', worker: 'Workers', simulation: 'Simulation', treasury: 'Treasury',
};

export function NavBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 mb-4">
      <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={href} className="flex items-center gap-1.5">
            <span>/</span>
            <Link href={href} className="hover:text-slate-400 transition-colors capitalize">
              {PATH_LABELS[seg] || seg}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
