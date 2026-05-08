import { useState, useEffect } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch { return initialValue; }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    const val = value instanceof Function ? value(stored) : value;
    setStored(val);
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
  };
  return [stored, setValue] as const;
}
