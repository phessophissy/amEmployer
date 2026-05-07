'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/employer', label: 'Employer' },
  { href: '/worker', label: 'Workers' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/treasury', label: 'Treasury' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-emerald-500/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold font-mono">AM</span>
          </div>
          <span className="font-bold text-white">
            am<span className="text-emerald-400">Employer</span>
          </span>
          <span className="hidden sm:block px-2 py-0.5 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
            CELO MAINNET
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === link.href
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-slate-500">Alfajores</span>
        </div>
      </div>
    </nav>
  );
}
