import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 (or previous value) to `target` over `duration` ms.
 * Returns the current animated value as a string formatted with `decimals`.
 */
export function useCountUp(
  target: number,
  options: { duration?: number; decimals?: number; prefix?: string; suffix?: string } = {}
): string {
  const { duration = 800, decimals = 0, prefix = '', suffix = '' } = options;
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = target;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return `${prefix}${display.toFixed(decimals)}${suffix}`;
}
