/** Thin fetch wrapper with retry, timeout, and typed errors. */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 2;

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  retries = MAX_RETRIES,
): Promise<T> {
  const url = `${BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  let lastError: Error = new Error('Unknown');
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, DEFAULT_TIMEOUT);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(res.status, data?.message || `HTTP ${res.status}`, data);
      return data as T;
    } catch (e: any) {
      lastError = e;
      if (e instanceof ApiError && e.status < 500) throw e; // don't retry 4xx
      if (attempt < retries) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}
// api-error module 5
// api-error module 6
// api-error module 7
