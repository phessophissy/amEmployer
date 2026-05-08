'use client';
import { AIActivityLog } from '@/components/common/AIActivityLog';
interface AILogSidebarProps { logs: any[]; }
export function AILogSidebar({ logs }: AILogSidebarProps) {
  return (
    <div className="bg-slate-900/50 border border-emerald-500/10 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-emerald-500/10 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">AI AGENT LOG</span>
      </div>
      <AIActivityLog logs={logs} maxHeight="400px" />
    </div>
  );
}
