'use client';
import { deterministicColor } from '@/lib/utils';
interface AvatarProps { seed: string; size?: 'sm' | 'md' | 'lg'; label?: string; }
const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
export function Avatar({ seed, size = 'md', label }: AvatarProps) {
  const color = deterministicColor(seed);
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold font-mono flex-shrink-0`} style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}>
      {(label || seed).slice(0, 2).toUpperCase()}
    </div>
  );
}
