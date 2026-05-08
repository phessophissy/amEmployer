'use client';
import Link from 'next/link';
export function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-black/40 mt-16 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">am<span className="text-emerald-400">Employer</span></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">CELO</span>
          </div>
          <nav className="flex gap-4 flex-wrap justify-center">
            {[['/',  'Home'],  ['/employer','Employer'],  ['/worker','Workers'],  ['/treasury','Treasury']].map(([href,label]) => (
              <Link key={href} href={href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
            ))}
          </nav>
          <p className="text-xs text-slate-700 font-mono">Built on Celo · cUSD Payments</p>
        </div>
      </div>
    </footer>
  );
}
