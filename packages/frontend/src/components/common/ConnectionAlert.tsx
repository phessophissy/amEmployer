'use client';
import { useWalletContext } from './WalletProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionAlert() {
  const { isMiniPayEnv, isConnected } = useWalletContext();
  if (isMiniPayEnv || isConnected) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 px-4 py-2.5 bg-yellow-900/20 border border-yellow-500/30 rounded-xl flex items-center gap-3"
      >
        <span className="text-yellow-400 text-base flex-shrink-0">⚠</span>
        <div>
          <p className="text-xs font-semibold text-yellow-300">Wallet not connected</p>
          <p className="text-xs text-slate-500">Open in MiniPay or connect a Web3 wallet to use full features.</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
