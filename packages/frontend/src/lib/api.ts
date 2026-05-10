const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const api = {
  jobs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/api/jobs${qs}`);
    },
    get: (id: string) => apiFetch<any>(`/api/jobs/${id}`),
    create: (data: { title: string; description: string; totalBudget: number; employerAddress: string }) =>
      apiFetch<any>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    launchDemo: () => apiFetch<any>('/api/jobs/demo/launch', { method: 'POST' }),
    aiLogs: (id: string) => apiFetch<any>(`/api/jobs/${id}/ai-logs`),
  },

  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/api/tasks${qs}`);
    },
    get: (id: string) => apiFetch<any>(`/api/tasks/${id}`),
    submit: (id: string, data: { submission: string; workerAddress: string }) =>
      apiFetch<any>(`/api/tasks/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
    open: () => apiFetch<any>('/api/tasks/open'),
  },

  workers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/api/workers${qs}`);
    },
    get: (address: string) => apiFetch<any>(`/api/workers/${address}`),
    register: (data: { walletAddress: string; workerType?: string; personaName?: string }) =>
      apiFetch<any>('/api/workers/register', { method: 'POST', body: JSON.stringify(data) }),
    leaderboard: () => apiFetch<any>('/api/workers/leaderboard'),
  },

  simulation: {
    list: () => apiFetch<any>('/api/simulation'),
    get: (id: string) => apiFetch<any>(`/api/simulation/${id}`),
    start: (data: { walletCount: number; name: string }) =>
      apiFetch<any>('/api/simulation/start', { method: 'POST', body: JSON.stringify(data) }),
    queueStats: () => apiFetch<any>('/api/simulation/queues/stats'),
  },

  stats: {
    platform: () => apiFetch<any>('/api/stats'),
    activity: () => apiFetch<any>('/api/stats/activity'),
  },
};
