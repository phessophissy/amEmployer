'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import type { Toast } from '@/hooks/useToast';
import type { PanInfo } from 'framer-motion';

type ToastCfg = { border: string; bg: string; text: string; icon: React.ReactNode };

const CONFIG: Record<string, ToastCfg> = {
  success: {
    border: 'border-emerald-500/40', bg: 'bg-emerald-950/80', text: 'text-emerald-300',
    icon: (<svg viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="w-4 h-4"><circle cx="10" cy="10" r="8"/><path d="m6 10 3 3 5-5"/></svg>),
  },
  error: {
    border: 'border-red-500/40', bg: 'bg-red-950/80', text: 'text-red-300',
    icon: (<svg viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" className="w-4 h-4"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 13h.01" strokeWidth="2.5"/></svg>),
  },
  info: {
    border: 'border-cyan-500/40', bg: 'bg-cyan-950/80', text: 'text-cyan-300',
    icon: (<svg viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" className="w-4 h-4"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7h.01" strokeWidth="2.5"/></svg>),
  },
  warning: {
    border: 'border-yellow-500/40', bg: 'bg-yellow-950/80', text: 'text-yellow-300',
    icon: (<svg viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="w-4 h-4"><path d="M10 2 2 17h16L10 2Z"/><path d="M10 8v4M10 13h.01" strokeWidth="2.5"/></svg>),
  },
  payment: {
    border: 'border-emerald-400/50', bg: 'bg-slate-900/90', text: 'text-emerald-400',
    icon: (<svg viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="w-4 h-4"><rect x="2" y="5" width="16" height="11" rx="2"/><path d="M2 9h16"/><circle cx="10" cy="13" r="1" fill="currentColor" stroke="none"/></svg>),
  },
};

function ProgressBar({ duration, createdAt }: { duration: number; createdAt: number }) {
  const [width, setWidth] = useState(100);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const remaining = Math.max(0, 1 - (Date.now() - createdAt) / duration);
      setWidth(remaining * 100);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, createdAt]);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 rounded-b-xl overflow-hidden">
      <div className="h-full bg-current opacity-40 rounded-b-xl" style={{ width: `${width}%`, transition: 'none' }} />
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast();
  const c = CONFIG[toast.type] ?? CONFIG.info;
  const handleDragEnd = (_: unknown, info: PanInfo) => { if (Math.abs(info.offset.x) > 80) dismiss(toast.id); };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 80 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={`relative pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md min-w-[260px] max-w-[min(340px,90vw)] shadow-lg cursor-grab active:cursor-grabbing overflow-hidden ${c.border} ${c.bg} ${c.text}`}
    >
      <span className="flex-shrink-0 mt-0.5">{c.icon}</span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold truncate">{toast.title}</p>}
        <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity p-0.5 touch-manipulation" aria-label="Dismiss">
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
      </button>
      <ProgressBar duration={toast.duration} createdAt={toast.createdAt} />
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  return (
    <>
      <div className="fixed top-16 right-3 z-[200] hidden sm:flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">{toasts.map((t) => <ToastItem key={t.id} toast={t} />)}</AnimatePresence>
      </div>
      <div className="fixed left-3 right-3 z-[200] flex flex-col gap-2 pointer-events-none sm:hidden" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="popLayout">{toasts.map((t) => <ToastItem key={t.id} toast={t} />)}</AnimatePresence>
      </div>
    </>
  );
}
