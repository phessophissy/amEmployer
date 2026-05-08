'use client';
import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function RefreshButton({ onRefresh, className = '' }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);
  const handleClick = async () => {
    setSpinning(true);
    try { await onRefresh(); } finally { setTimeout(() => setSpinning(false), 600); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={spinning}
      className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 ${className}`}
      aria-label="Refresh"
    >
      <span className={`inline-block text-base ${spinning ? 'animate-spin' : ''}`}>↻</span>
    </button>
  );
}
