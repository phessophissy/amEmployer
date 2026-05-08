'use client';
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, duration = 800, decimals = 0, suffix = '', className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();

    const update = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(start + (end - start) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(update);
      else { setDisplay(end); prevRef.current = end; }
    };
    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  return (
    <span className={className}>{display.toFixed(decimals)}{suffix}</span>
  );
}
