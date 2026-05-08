'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>
      <AnimatePresence>{open && <NotificationPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}
