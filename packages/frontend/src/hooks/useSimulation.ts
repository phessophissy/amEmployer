import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface SimState { running: boolean; stats: { tasksCompleted: number; payoutsTotal: number; activeWorkers: number } | null; error: string; }

export function useSimulation() {
  const [state, setState] = useState<SimState>({ running: false, stats: null, error: '' });

  const launch = useCallback(async () => {
    setState(s => ({ ...s, running: true, error: '' }));
    try {
      await api.jobs.launchDemo();
      setState(s => ({ ...s, running: false }));
    } catch (e: any) {
      setState(s => ({ ...s, running: false, error: e.message || 'Failed to launch' }));
    }
  }, []);

  const reset = useCallback(() => setState({ running: false, stats: null, error: '' }), []);

  return { ...state, launch, reset };
}
