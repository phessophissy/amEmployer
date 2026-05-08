'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface ConfettiProps { show: boolean; }
const COLORS = ['#10b981','#06b6d4','#8b5cf6','#f59e0b','#ec4899'];
export function PaymentConfetti({ show }: ConfettiProps) {
  const particles = Array.from({length: 20}, (_,i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: COLORS[i % COLORS.length], size: 6 + Math.random() * 6,
  }));
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[500] pointer-events-none overflow-hidden">
          {particles.map(p => (
            <motion.div key={p.id}
              initial={{ opacity: 1, y: '40vh', x: `${p.x}vw`, rotate: 0, scale: 1 }}
              animate={{ opacity: 0, y: '-20vh', rotate: 360, scale: 0.5 }}
              transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
              style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: 2, background: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
