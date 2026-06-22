'use client';
import { motion } from 'framer-motion';
interface FABProps { icon: string; label: string; onClick: () => void; color?: string; }
export function FloatingActionButton({ icon, label, onClick, color = 'bg-emerald-600 hover:bg-emerald-500' }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-20 right-4 z-40 lg:bottom-6 flex items-center gap-2 px-4 py-3 ${color} text-white font-semibold rounded-2xl shadow-neon-md ring-1 ring-emerald-500/10 transition-colors backdrop-blur-sm`}
      aria-label={label}
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm hidden sm:block">{label}</span>
    </motion.button>
  );
}
