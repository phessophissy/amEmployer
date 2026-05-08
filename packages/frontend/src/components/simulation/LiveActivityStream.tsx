'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityEvent { id: string; type: string; message: string; timestamp: number; severity?: 'info' | 'success' | 'warning' | 'error'; }
interface LiveActivityStreamProps { events: ActivityEvent[]; maxItems?: number; }
const SEVERITY_COLORS = { info: 'text-cyan-400', success: 'text-emerald-400', warning: 'text-yellow-400', error: 'text-red-400' };
const SEVERITY_ICONS = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };
export function LiveActivityStream({ events, maxItems = 30 }: LiveActivityStreamProps) {
  return (
    <div className="bg-black/80 border border-emerald-500/10 rounded-xl overflow-hidden h-80 flex flex-col">
      <div className="px-4 py-2.5 border-b border-emerald-500/10 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">LIVE ACTIVITY STREAM</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {events.slice(-maxItems).reverse().map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex gap-2 ${SEVERITY_COLORS[e.severity || 'info']}`}>
              <span className="flex-shrink-0 opacity-60">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
              <span className="flex-shrink-0">{SEVERITY_ICONS[e.severity || 'info']}</span>
              <span className="text-slate-300">{e.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
