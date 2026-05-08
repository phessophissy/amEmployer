'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletContext } from './WalletProvider';
import { MINIPAY_DEPOSIT_LINK } from '@/lib/minipay';
interface ConnectWalletSheetProps { open: boolean; onClose: () => void; }
export function ConnectWalletSheet({ open, onClose }: ConnectWalletSheetProps) {
  const { connect, isMiniPayEnv } = useWalletContext();
  const handleConnect = async () => { await connect(); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/40 rounded-t-2xl p-6 space-y-4">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white text-center">Connect Wallet</h3>
            <p className="text-sm text-slate-500 text-center">Choose how you'd like to connect to amEmployer</p>
            {isMiniPayEnv ? (
              <button onClick={handleConnect}
                className="w-full flex items-center gap-3 px-4 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold transition-colors">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="font-semibold">Connect MiniPay</p>
                  <p className="text-xs opacity-70">Auto-detected · Celo Network</p>
                </div>
              </button>
            ) : (
              <button onClick={handleConnect}
                className="w-full flex items-center gap-3 px-4 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-200 font-semibold transition-colors">
                <span className="text-2xl">🦊</span>
                <div className="text-left">
                  <p className="font-semibold">Connect Web3 Wallet</p>
                  <p className="text-xs text-slate-500">MetaMask, Rabby, or any injected wallet</p>
                </div>
              </button>
            )}
            <a href={MINIPAY_DEPOSIT_LINK} target="_blank" rel="noopener noreferrer"
              className="block w-full px-4 py-3 text-center text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Get cUSD via MiniPay →
            </a>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
