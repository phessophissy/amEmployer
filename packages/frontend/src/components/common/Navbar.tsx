'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useWalletContext } from './WalletProvider';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/employer', label: 'Employer' },
  { href: '/worker', label: 'Workers' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/treasury', label: 'Treasury' },
];

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { address, balance, isConnected, isWrongNetwork, isLoading, connect } = useWalletContext();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 border-b border-emerald-500/10 bg-black/90 backdrop-blur-xl transition-shadow duration-200 ${scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.5)]' : ''}`}>
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold font-mono">aE</span>
          </div>
          <span className="font-bold text-white text-sm">
            am<span className="text-emerald-400">Employer</span>
          </span>
          <span className="hidden sm:block px-2 py-0.5 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
            CELO
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
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
          {isConnected ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isWrongNetwork ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${isWrongNetwork ? 'bg-red-400' : 'bg-emerald-400'}`} />
              <span className="text-xs font-mono text-emerald-400 hidden sm:block">
                {shortenAddr(address!)}
              </span>
              <span className="text-xs font-mono text-slate-400 hidden md:block">
                {isWrongNetwork ? <span className="text-red-400">Wrong Network</span> : `${balance} cUSD`}
              </span>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor">
              <motion.line
                x1="3" y1="6" x2="21" y2="6"
                animate={menuOpen ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 3, y1: 6, x2: 21, y2: 6 }}
                transition={{ duration: 0.2 }}
              />
              <motion.line
                x1="3" y1="12" x2="21" y2="12"
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.line
                x1="3" y1="18" x2="21" y2="18"
                animate={menuOpen ? { x1: 5, y1: 19, x2: 19, y2: 5 } : { x1: 3, y1: 18, x2: 21, y2: 18 }}
                transition={{ duration: 0.2 }}
              />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="lg:hidden border-t border-emerald-500/10 bg-black/95 px-4 py-3 space-y-1"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isConnected && (
            <div className="pt-2 border-t border-slate-800 mt-2">
              <p className="text-xs font-mono text-slate-500 px-4 mb-1">Connected Wallet</p>
              <p className="text-xs font-mono text-emerald-400 px-4 break-all">{address}</p>
              <p className="text-xs font-mono text-slate-400 px-4 mt-0.5">{balance} cUSD</p>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
}
