'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NavIcon } from './NavIcon';

type NavName = 'home' | 'employer' | 'worker' | 'simulate' | 'treasury' | 'transactions';

const navLinks: { href: string; label: string; icon: NavName }[] = [
  { href: '/',             label: 'Home',     icon: 'home'         },
  { href: '/employer',     label: 'Jobs',     icon: 'employer'     },
  { href: '/worker',       label: 'Workers',  icon: 'worker'       },
  { href: '/simulation',   label: 'Simulate', icon: 'simulate'     },
  { href: '/treasury',     label: 'Treasury', icon: 'treasury'     },
];

/**
 * Bottom navigation bar — shown only on mobile (< lg).
 * Provides thumb-friendly navigation for MiniPay and mobile browsers.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-500/10 bg-black/95 backdrop-blur-xl rounded-t-xl shadow-neon-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16">
        {navLinks.map((link) => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <motion.div
              key={link.href}
              className="flex-1"
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Link
                href={link.href}
                className={`relative flex flex-col items-center justify-center gap-1 h-full w-full transition-colors duration-150 ${
                  active ? 'text-emerald-400' : 'text-slate-500 active:text-slate-300'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active background pill */}
                {active && (
                  <motion.span
                    layoutId="nav-active-bg"
                    className="absolute inset-x-1 inset-y-2 rounded-xl bg-emerald-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}

                <NavIcon name={link.icon} active={active} />

                <span className={`text-[9px] font-mono leading-none tracking-tight z-10 ${
                  active ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {link.label}
                </span>

                {/* Active indicator dot */}
                {active && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
