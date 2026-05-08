'use client';
import { motion } from 'framer-motion';
export function AIThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs font-mono text-purple-400 mr-1">AI thinking</span>
      {[0,1,2].map(i => (
        <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
          className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
      ))}
    </div>
  );
}
