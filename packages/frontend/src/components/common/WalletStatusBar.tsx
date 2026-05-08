'use client';
import { useWalletContext } from './WalletProvider';

export function WalletStatusBar() {
  const { address, balance, isConnected, isMiniPayEnv, connect } = useWalletContext();

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-700/30 px-4 py-2 flex items-center justify-between text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-slate-500">{isMiniPayEnv ? 'MiniPay' : 'Web3'}</span>
      </div>
      {isConnected ? (
        <span className="text-emerald-400">{address?.slice(0,6)}…{address?.slice(-4)} · {balance} cUSD</span>
      ) : (
        <button onClick={connect} className="text-emerald-500 hover:text-emerald-300 transition-colors">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
