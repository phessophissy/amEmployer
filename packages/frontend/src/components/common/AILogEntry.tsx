'use client';
import { motion } from 'framer-motion';
interface AILogEntryProps { message: string; timestamp?: string; type?: 'info' | 'success' | 'error' | 'action'; index?: number; }
const COLORS = { info: 'text-slate-400', success: 'text-emerald-400', error: 'text-red-400', action: 'text-cyan-400' };
const PREFIXES = { info: 'ℹ', success: '✓', error: '✕', action: '→' };
export function AILogEntry({ message, timestamp, type = 'info', index = 0 }: AILogEntryProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
      className="flex gap-2 py-0.5 text-xs font-mono">
      {timestamp && <span className="text-slate-700 flex-shrink-0">[{timestamp}]</span>}
      <span className={`flex-shrink-0 ${COLORS[type]}`}>{PREFIXES[type]}</span>
      <span className="text-slate-400">{message}</span>
    </motion.div>
  );
}
