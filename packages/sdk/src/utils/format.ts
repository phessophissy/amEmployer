/**
 * Format a bigint wei value to a human-readable decimal string.
 * Uses pure math — no ethers dependency required for display.
 */
export function formatUnits(value: bigint, decimals = 18): string {
  const str = value.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, str.length - decimals) || '0';
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** Format wei as a cUSD string e.g. "10.50 cUSD" */
export function formatCUSD(wei: bigint, decimals = 18): string {
  const raw = formatUnits(wei, decimals);
  const [int, frac = ''] = raw.split('.');
  return `${int}.${frac.slice(0, 2).padEnd(2, '0')} cUSD`;
}

/** Format a Unix timestamp (seconds) to locale date string */
export function formatTimestamp(unixSeconds: bigint | number): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleString();
}

/** Format a reputation score 0–100 with a label */
export function formatReputation(score: number): string {
  if (score >= 80) return `${score}/100 ★★★★★`;
  if (score >= 60) return `${score}/100 ★★★★`;
  if (score >= 40) return `${score}/100 ★★★`;
  return `${score}/100 ★★`;
}
