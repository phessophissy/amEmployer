'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/employer', label: 'Dashboard' },
  { href: '/employer/analytics', label: 'Analytics' },
  { href: '/employer/settings', label: 'Settings' },
  { href: '/transactions', label: 'Transactions' },
];

export function EmployerSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6" aria-label="Employer sections">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
