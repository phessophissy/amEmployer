'use client';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
interface CopyButtonProps { value: string; label?: string; className?: string; }
export function CopyButton({ value, label = '', className = '' }: CopyButtonProps) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button onClick={() => copy(value)}
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300'} ${className}`}>
      {copied ? '✓ Copied' : `⎘ ${label || 'Copy'}`}
    </button>
  );
}
