'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletContext } from './WalletProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/employer', label: 'Employer', icon: '💼' },
  { href: '/worker', label: 'Workers', icon: '👷' },
  { href: '/simulation', label: 'Sim', icon: '⚡' },
  { href: '/treasury', label: 'Treasury', icon: '🏦' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isConnected } = useWalletContext();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-black/95 border-t border-emerald-500/10 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[9px] font-mono tracking-wide">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
