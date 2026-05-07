import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'green' | 'cyan' | 'purple' | 'orange' | 'blue';
  icon?: React.ReactNode;
  className?: string;
}

const colorMap = {
  green: 'text-emerald-400 border-emerald-500/20 shadow-cyber-green',
  cyan: 'text-cyan-400 border-cyan-500/20 shadow-cyber-cyan',
  purple: 'text-purple-400 border-purple-500/20 shadow-cyber-purple',
  orange: 'text-orange-400 border-orange-500/20',
  blue: 'text-blue-400 border-blue-500/20',
};

const glowMap = {
  green: 'bg-emerald-500/5',
  cyan: 'bg-cyan-500/5',
  purple: 'bg-purple-500/5',
  orange: 'bg-orange-500/5',
  blue: 'bg-blue-500/5',
};

export function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'green',
  icon,
  className,
}: MetricsCardProps) {
  return (
    <div
      className={cn(
        'cyber-card rounded-xl border p-5 backdrop-blur-sm',
        glowMap[color],
        colorMap[color].split(' ').filter((c) => c.startsWith('border')).join(' '),
        'bg-slate-900/50',
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">{title}</p>
        {icon && <span className={colorMap[color].split(' ')[0]}>{icon}</span>}
      </div>
      <div
        className={cn(
          'text-3xl font-bold font-mono',
          colorMap[color].split(' ')[0]
        )}
      >
        {value}
      </div>
      {(subtitle || trendValue) && (
        <div className="mt-2 flex items-center gap-2">
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
          {trendValue && (
            <span
              className={cn(
                'text-xs font-mono',
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
              )}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
