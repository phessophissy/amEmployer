'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const LOG_COLORS: Record<string, string> = {
  JOB_DECOMPOSITION: 'text-cyan-400',
  TASK_ASSIGNMENT: 'text-yellow-400',
  VALIDATION: 'text-purple-400',
  PAYMENT_TRIGGER: 'text-emerald-400',
  WORKER_REGISTRATION: 'text-blue-400',
  ERROR: 'text-red-400',
  SYSTEM: 'text-slate-400',
};

const LOG_PREFIXES: Record<string, string> = {
  JOB_DECOMPOSITION: '[DECOMPOSE]',
  TASK_ASSIGNMENT: '[ASSIGN]  ',
  VALIDATION: '[VALIDATE]',
  PAYMENT_TRIGGER: '[PAY]     ',
  WORKER_REGISTRATION: '[WORKER]  ',
  ERROR: '[ERROR]   ',
  SYSTEM: '[SYSTEM]  ',
};

interface AIActivityLogProps {
  logs: LogEntry[];
  maxHeight?: string;
  title?: string;
}

export function AIActivityLog({
  logs,
  maxHeight = '400px',
  title = 'AI Agent Activity Feed',
}: AIActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-black/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-xs font-mono text-slate-600">{logs.length} events</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed p-4 space-y-1 bg-black/60"
        style={{ maxHeight }}
      >
        {logs.length === 0 && (
          <div className="text-slate-600 text-center py-8">
            <div className="terminal-cursor">Waiting for AI activity</div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => {
            const color = LOG_COLORS[log.type] || 'text-slate-400';
            const prefix = LOG_PREFIXES[log.type] || '[LOG]     ';
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <motion.div
                key={`${log.timestamp}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2 group"
              >
                <span className="text-slate-700 flex-shrink-0 group-hover:text-slate-600 transition-colors">
                  {time}
                </span>
                <span className={`flex-shrink-0 ${color}`}>{prefix}</span>
                <span className="text-slate-300 group-hover:text-white transition-colors break-all">
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
