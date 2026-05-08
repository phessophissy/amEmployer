'use client';
import { timeAgo } from '@/lib/utils';
interface TimelineEvent { id: string; type: string; message: string; timestamp: string; icon?: string; }
interface JobTimelineProps { events: TimelineEvent[]; }
const TYPE_ICONS: Record<string,string> = { created:'📋', assigned:'👷', submitted:'📤', validated:'✅', paid:'💸', failed:'❌' };
export function JobTimeline({ events }: JobTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700/50" />
      <div className="space-y-4">
        {events.map((e,i) => (
          <div key={e.id} className="flex gap-4 relative">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm flex-shrink-0 relative z-10">
              {TYPE_ICONS[e.type] || '●'}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm text-slate-200">{e.message}</p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">{timeAgo(e.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
