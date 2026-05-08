'use client';
import { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(s => !s)}
    >
      {children}
      {show && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-mono bg-slate-800 text-slate-200 border border-slate-600 rounded-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
}
