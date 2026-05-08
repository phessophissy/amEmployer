'use client';

interface NetworkBadgeProps {
  network?: 'celo' | 'alfajores' | 'unknown';
}

const NETWORK_CONFIG = {
  celo: { label: 'Celo Mainnet', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' },
  alfajores: { label: 'Alfajores Testnet', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', dot: 'bg-yellow-400 animate-pulse' },
  unknown: { label: 'Unknown Network', color: 'text-red-400 border-red-500/30 bg-red-500/10', dot: 'bg-red-400' },
};

export function NetworkBadge({ network = 'celo' }: NetworkBadgeProps) {
  const config = NETWORK_CONFIG[network];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
