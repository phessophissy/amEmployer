/** Returns true if the Unix timestamp (seconds) deadline has already passed. */
export function isDeadlinePassed(deadlineUnix: bigint | number): boolean {
  return Number(deadlineUnix) < Math.floor(Date.now() / 1000);
}

/** Returns seconds remaining until the deadline (negative if already passed). */
export function secondsUntilDeadline(deadlineUnix: bigint | number): number {
  return Number(deadlineUnix) - Math.floor(Date.now() / 1000);
}

/**
 * Format seconds remaining as a human-readable string.
 * Examples: "Expired", "45s", "12m", "3h", "2d"
 */
export function formatTimeRemaining(deadlineUnix: bigint | number): string {
  const secs = secondsUntilDeadline(deadlineUnix);
  if (secs <= 0) return 'Expired';
  if (secs < 60) return `${secs}s`;
  if (secs < 3_600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86_400) return `${Math.floor(secs / 3_600)}h`;
  return `${Math.floor(secs / 86_400)}d`;
}
