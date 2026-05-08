import { useState, useCallback } from 'react';
interface AsyncState<T> { data: T | null; loading: boolean; error: string; }
export function useAsyncAction<T = void>(fn: (...args: any[]) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: false, error: '' });
  const execute = useCallback(async (...args: any[]) => {
    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fn(...args);
      setState({ data, loading: false, error: '' });
      return data;
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message || 'An error occurred' }));
      throw e;
    }
  }, [fn]);
  const reset = useCallback(() => setState({ data: null, loading: false, error: '' }), []);
  return { ...state, execute, reset };
}
