import { useRef, useCallback } from 'react';
interface SwipeHandlers { onSwipeLeft?: () => void; onSwipeRight?: () => void; onSwipeUp?: () => void; onSwipeDown?: () => void; threshold?: number; }
export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: SwipeHandlers) {
  const startX = useRef(0);
  const startY = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) onSwipeRight?.();
      else if (dx < -threshold) onSwipeLeft?.();
    } else {
      if (dy > threshold) onSwipeDown?.();
      else if (dy < -threshold) onSwipeUp?.();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
  return { onTouchStart, onTouchEnd };
}
