/**
 * Retry an async function up to `maxAttempts` times with exponential back-off.
 * Useful for transient RPC errors when calling smart contracts.
 *
 * @example
 * const result = await withRetry(() => contract.getTask(id), 3, 500);
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
      }
    }
  }
  throw lastError;
}
