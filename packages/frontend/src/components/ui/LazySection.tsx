'use client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { motion } from 'framer-motion';
interface LazySectionProps { children: React.ReactNode; className?: string; }
export function LazySection({ children, className = '' }: LazySectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      ) : <div className="min-h-[100px]" />}
    </div>
  );
}
