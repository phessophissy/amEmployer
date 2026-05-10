import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'green' | 'cyan' | 'purple' | 'orange' | 'blue';
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
  animate?: boolean;
}

const colorMap = {
  green:  { text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'hover-glow-green', bg: 'bg-emerald-500/5' },
  cyan:   { text: 'text-cyan-400',    border: 'border-cyan-500/20',    glow: 'hover-glow-cyan',  bg: 'bg-cyan-500/5' },
  purple: { text: 'text-purple-400',  border: 'border-purple-500/20',  glow: 'hover-glow-purple', bg: 'bg-purple-500/5' },
  orange: { text: 'text-orange-400',  border: 'border-orange-500/20',  glow: '',                  bg: 'bg-orange-500/5' },
  blue:   { text: 'text-blue-400',    border: 'border-blue-500/20',    glow: '',                  bg: 'bg-blue-500/5' },
};

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up')   return <span className="text-emerald-400">↑</span>;
  if (trend === 'down') return <span className="text-red-400">↓</span>;
  return <span className="text-slate-500">→</span>;
}

/** Numeric value display with optional count-up animation */
function AnimatedValue({ value, animate, color }: { value: string | number; animate: boolean; color: string }) {
  const isNum = typeof value === 'number' || (!isNaN(Number(value)) && value !== '');
  const num = isNum ? Number(value) : 0;
  const decimals = String(value).includes('.') ? (String(value).split('.')[1]?.length ?? 0) : 0;
  const animated = useCountUp(animate && isNum ? num : num, { duration: 900, decimals });
  const display = animate && isNum ? animated : String(value);
  return <span className={color}>{display}</span>;
}

export function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'green',
  icon,
  className,
  compact = false,
  animate = true,
}: MetricsCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={cn(
        'cyber-card rounded-xl border backdrop-blur-sm transition-all duration-200',
        c.bg, c.border, c.glow,
        'bg-slate-900/50',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className={cn('font-mono uppercase tracking-wider text-slate-500', compact ? 'text-[9px]' : 'text-[10px]')}>
          {title}
        </p>
        {icon && <span className={cn(c.text, 'opacity-70', compact ? 'text-sm' : 'text-base')}>{icon}</span>}
      </div>

      <div className={cn('font-bold font-mono', compact ? 'text-xl' : 'text-2xl sm:text-3xl')}>
        <AnimatedValue value={value} animate={animate} color={c.text} />
      </div>

      {(subtitle || trendValue) && (
        <div className={cn('flex items-center gap-1.5 mt-1.5', compact ? 'text-[10px]' : 'text-xs')}>
          {trendValue && trend && (
            <span className="font-mono">
              <TrendIcon trend={trend} />
              <span className={cn('ml-0.5', trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500')}>
                {trendValue}
              </span>
            </span>
          )}
          {subtitle && <p className="text-slate-600 truncate">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
