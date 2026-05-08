'use client';
import { useWalletContext } from './WalletProvider';

export function MiniPayBanner() {
  const { isMiniPayEnv } = useWalletContext();
  if (!isMiniPayEnv) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-900/95 border-t border-emerald-500/40 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
      <span className="text-xs font-mono text-emerald-400">● Running in MiniPay</span>
      <span className="text-xs text-emerald-300">Celo Network · cUSD</span>
    </div>
  );
}
