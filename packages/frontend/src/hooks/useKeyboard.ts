import { useEffect } from 'react';
export function useKeyboard(key: string, callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key && !e.metaKey && !e.ctrlKey) callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, ...deps]);
}
export function useEscape(callback: () => void) {
  useKeyboard('Escape', callback, [callback]);
}
