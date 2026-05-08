'use client';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
interface CodeBlockProps { code: string; language?: string; title?: string; }
export function CodeBlock({ code, language = 'text', title }: CodeBlockProps) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <div className="bg-black/70 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/30">
        <span className="text-xs font-mono text-slate-500">{title || language}</span>
        <button onClick={() => copy(code)} className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}
