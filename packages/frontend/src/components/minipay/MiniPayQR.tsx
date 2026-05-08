'use client';
import { useState } from 'react';

interface MiniPayQRProps {
  address: string;
  amount?: string;
}

export function MiniPayQR({ address, amount }: MiniPayQRProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-900 border border-emerald-500/20 rounded-xl">
      <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
        <span className="text-slate-900 text-xs font-mono text-center px-2">QR: {address.slice(0,8)}…</span>
      </div>
      {amount && (
        <p className="text-emerald-400 font-mono text-sm font-bold">{amount} cUSD</p>
      )}
      <button
        onClick={handleCopy}
        className="w-full py-2 text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-all"
      >
        {copied ? '✓ Copied!' : 'Copy Address'}
      </button>
    </div>
  );
}
