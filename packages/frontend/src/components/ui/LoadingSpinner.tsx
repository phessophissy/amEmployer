'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };

export function LoadingSpinner({ size = 'md', color = 'border-emerald-500', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`${sizes[size]} ${color} border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-xs text-slate-500 font-mono">{label}</p>}
    </div>
  );
}
