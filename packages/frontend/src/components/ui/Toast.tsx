'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
const COLORS: Record<string, string> = {
  success: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300',
  error: 'border-red-500/50 bg-red-900/30 text-red-300',
  info: 'border-cyan-500/50 bg-cyan-900/30 text-cyan-300',
  warning: 'border-yellow-500/50 bg-yellow-900/30 text-yellow-300',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm min-w-[260px] max-w-[340px] shadow-lg ${COLORS[t.type]}`}
          >
            <span className="text-base flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold">{t.title}</p>}
              <p className="text-xs opacity-80 mt-0.5">{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-xs opacity-60 hover:opacity-100 flex-shrink-0">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
