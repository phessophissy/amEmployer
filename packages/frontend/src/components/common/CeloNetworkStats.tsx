'use client';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
const client = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
export function CeloNetworkStats() {
  const [block, setBlock] = useState<bigint | null>(null);
  useEffect(() => {
    client.getBlockNumber().then(setBlock).catch(() => {});
    const id = setInterval(() => client.getBlockNumber().then(setBlock).catch(() => {}), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-slate-500">Celo</span>
      {block && <span className="text-emerald-400">#{block.toString()}</span>}
    </div>
  );
}
