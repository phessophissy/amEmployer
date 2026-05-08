'use client';
import { motion } from 'framer-motion';
interface FeatureCardProps { icon: string; title: string; description: string; index?: number; }
export function FeatureCard({ icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="bg-slate-900/50 border border-slate-700/30 hover:border-emerald-500/30 rounded-xl p-4 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}
