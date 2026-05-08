'use client';
import { useWalletContext } from './WalletProvider';
import { motion } from 'framer-motion';

export function CUSDBalanceWidget() {
  const { balance, isConnected, address } = useWalletContext();
  if (!isConnected) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
    >
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-sm font-mono font-bold text-emerald-400">{balance} cUSD</span>
    </motion.div>
  );
}
