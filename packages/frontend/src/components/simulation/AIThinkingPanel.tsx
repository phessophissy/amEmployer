'use client';
import { motion, AnimatePresence } from 'framer-motion';
interface AIThinkingPanelProps { thinking: boolean; lastAction?: string; }
export function AIThinkingPanel({ thinking, lastAction }: AIThinkingPanelProps) {
  return (
    <div className="bg-black/60 border border-purple-500/20 rounded-xl p-4 min-h-[80px] flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full border-2 border-purple-500/40 flex items-center justify-center ${thinking ? 'animate-pulse' : ''}`}>
          <span className="text-lg">🤖</span>
        </div>
        <AnimatePresence>
          {thinking && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
          )}
        </AnimatePresence>
      </div>
      <div>
        <p className="text-xs font-mono text-purple-400">{thinking ? 'AI Agent thinking…' : 'AI Agent idle'}</p>
        {lastAction && <p className="text-xs text-slate-400 mt-1 truncate max-w-[220px]">{lastAction}</p>}
      </div>
      {thinking && (
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          ))}
        </div>
      )}
    </div>
  );
}
