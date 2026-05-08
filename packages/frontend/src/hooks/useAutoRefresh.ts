import { useEffect, useRef, useCallback } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs: number, enabled = true) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);

  const manualRefresh = useCallback(() => cbRef.current(), []);
  return manualRefresh;
}
