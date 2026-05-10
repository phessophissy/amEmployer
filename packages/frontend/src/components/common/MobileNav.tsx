'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/employer', label: 'Employer', icon: '🤖' },
  { href: '/worker', label: 'Workers', icon: '👥' },
  { href: '/simulation', label: 'Simulate', icon: '⚡' },
  { href: '/treasury', label: 'Treasury', icon: '💰' },
];

/**
 * Bottom navigation bar — shown only on mobile (< lg).
 * Provides thumb-friendly navigation for MiniPay and mobile browsers.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-500/10 bg-black/95 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch h-16">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-center transition-all duration-150 ${
                active
                  ? 'text-emerald-400'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              <span className="text-[10px] font-mono leading-none">
                {link.label}
              </span>
              {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
