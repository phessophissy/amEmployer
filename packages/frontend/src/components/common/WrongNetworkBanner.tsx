'use client';
import { useWalletContext } from './WalletProvider';

/**
 * Sticky banner shown when the connected wallet is on the wrong chain.
 * Gives users a one-tap button to switch to Celo Mainnet (chainId 42220).
 * Hidden inside MiniPay (always Celo) and when on the correct network.
 */
export function WrongNetworkBanner() {
  const { isWrongNetwork, currentChainId, switchToCelo } = useWalletContext();

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-red-950/95 border-b border-red-500/30 backdrop-blur-sm px-3 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0 text-red-400" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2L2 17h16L10 2Z" />
          <path strokeLinecap="round" d="M10 8v4M10 14h.01" strokeWidth="1.75" />
        </svg>
        <p className="text-xs font-mono text-red-300 truncate">
          <span className="hidden sm:inline">Wrong network (chain {currentChainId}) — </span>Switch to Celo
        </p>
      </div>
      <button
        onClick={switchToCelo}
        className="flex-shrink-0 px-3 py-1.5 bg-red-500/90 hover:bg-red-400 active:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors touch-manipulation"
      >
        Switch
      </button>
    </div>
  );
}
