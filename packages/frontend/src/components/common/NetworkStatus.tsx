'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  return (
    <AnimatePresence>
      {offline && (
        <motion.div initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }}
          className="fixed top-14 left-0 right-0 z-[150] flex items-center justify-center py-2 bg-red-900/90 border-b border-red-500/30 text-xs font-mono text-red-300">
          ⚠ No internet connection — some features may be unavailable
        </motion.div>
      )}
    </AnimatePresence>
  );
}
