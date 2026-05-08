'use client';
import { useWalletContext } from './WalletProvider';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/': 'amEmployer', '/employer': 'Employer', '/worker': 'Workers', '/simulation': 'Simulation', '/treasury': 'Treasury',
};

export function MobileHeader() {
  const pathname = usePathname();
  const { isConnected, balance } = useWalletContext();
  const title = PAGE_TITLES[pathname] || 'amEmployer';
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-700/20 bg-slate-900/30">
      <h1 className="text-base font-bold text-white">
        {title === 'amEmployer' ? <><span className="text-white">am</span><span className="text-emerald-400">Employer</span></> : title}
      </h1>
      {isConnected && (
        <span className="text-xs font-mono text-emerald-400">{parseFloat(balance || '0').toFixed(2)} cUSD</span>
      )}
    </div>
  );
}
