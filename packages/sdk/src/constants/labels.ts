/** Map on-chain task status index to a human-readable label. */
export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'OPEN',
  1: 'ASSIGNED',
  2: 'SUBMITTED',
  3: 'VERIFIED',
  4: 'REJECTED',
  5: 'PAID',
};

/** Map on-chain worker type index to a human-readable label. */
export const WORKER_TYPE_LABELS: Record<number, string> = {
  0: 'HUMAN',
  1: 'SCRIPTED',
  2: 'AI_AGENT',
};

export function taskStatusLabel(status: number): string {
  return TASK_STATUS_LABELS[status] ?? 'UNKNOWN';
}

export function workerTypeLabel(typeIndex: number): string {
  return WORKER_TYPE_LABELS[typeIndex] ?? 'UNKNOWN';
}
