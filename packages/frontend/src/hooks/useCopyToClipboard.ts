import { useState, useCallback } from 'react';
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedValue(text);
      setTimeout(() => { setCopied(false); setCopiedValue(null); }, timeout);
      return true;
    } catch { return false; }
  }, [timeout]);
  return { copy, copied, copiedValue };
}
