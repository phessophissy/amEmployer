/** Returns true if the string looks like a valid 20-byte Ethereum address. */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/** Returns the zero address constant. */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Returns true if the address is the zero address. */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

/** Shorten an address for display: 0x1234...abcd */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
