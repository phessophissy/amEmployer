'use client';
interface GradientTextProps { children: React.ReactNode; from?: string; to?: string; className?: string; }
export function GradientText({ children, from = 'from-emerald-400', to = 'to-cyan-400', className = '' }: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
