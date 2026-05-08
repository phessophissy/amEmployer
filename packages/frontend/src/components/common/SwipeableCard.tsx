'use client';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useRef } from 'react';
interface SwipeableCardProps { children: React.ReactNode; onSwipeLeft?: () => void; onSwipeRight?: () => void; className?: string; }
export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, className = '' }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.3, 1, 0.3]);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const controls = useAnimation();
  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x < -80) { await controls.start({ x: -300, opacity: 0 }); onSwipeLeft?.(); }
    else if (info.offset.x > 80) { await controls.start({ x: 300, opacity: 0 }); onSwipeRight?.(); }
    else controls.start({ x: 0, rotate: 0 });
  };
  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x, opacity, rotate }}
      animate={controls} onDragEnd={handleDragEnd} className={`cursor-grab active:cursor-grabbing ${className}`}>
      {children}
    </motion.div>
  );
}
