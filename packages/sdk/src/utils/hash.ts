/** Encode a string to a fixed 32-byte hex (right-padded with nulls). */
export function toBytes32(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input.slice(0, 32));
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return '0x' + Array.from(padded).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Decode a 0x-prefixed bytes32 hex string to a UTF-8 string (strips null bytes). */
export function fromBytes32(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return new TextDecoder().decode(bytes).replace(/\0/g, '');
}
