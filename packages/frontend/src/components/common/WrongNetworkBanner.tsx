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
    <div className="fixed top-14 left-0 right-0 z-50 bg-red-900/95 border-b border-red-500/40 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-red-400 text-base flex-shrink-0">⚠</span>
        <p className="text-xs font-mono text-red-200 truncate">
          Wrong network (chain {currentChainId}) — transactions will fail
        </p>
      </div>
      <button
        onClick={switchToCelo}
        className="flex-shrink-0 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Switch to Celo
      </button>
    </div>
  );
}
