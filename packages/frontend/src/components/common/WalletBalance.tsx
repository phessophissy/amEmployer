'use client';
import { useWalletContext } from './WalletProvider';
import { motion } from 'framer-motion';
export function WalletBalance() {
  const { balance, address, isConnected } = useWalletContext();
  if (!isConnected || !address) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
      <span className="text-xs font-mono text-emerald-400 font-bold">{balance} cUSD</span>
    </motion.div>
  );
}
