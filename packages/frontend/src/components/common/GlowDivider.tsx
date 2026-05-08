'use client';
interface GlowDividerProps { color?: 'emerald' | 'cyan' | 'purple'; opacity?: number; }
const colors = { emerald: 'from-transparent via-emerald-500/40 to-transparent', cyan: 'from-transparent via-cyan-500/40 to-transparent', purple: 'from-transparent via-purple-500/40 to-transparent' };
export function GlowDivider({ color = 'emerald', opacity = 1 }: GlowDividerProps) {
  return <div className={`h-px bg-gradient-to-r ${colors[color]} my-6`} style={{ opacity }} />;
}
