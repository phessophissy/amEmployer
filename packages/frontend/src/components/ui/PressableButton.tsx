'use client';
import { motion } from 'framer-motion';
interface PressableButtonProps { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; className?: string; }
const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/10 backdrop-blur-sm',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600',
  danger: 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
};
export function PressableButton({ children, onClick, variant = 'primary', disabled, className = '' }: PressableButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      className={"px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 " + variants[variant] + ' ' + className}
    >
      {children}
    </motion.button>
  );
}
