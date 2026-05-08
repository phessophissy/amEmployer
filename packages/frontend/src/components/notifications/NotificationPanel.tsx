'use client';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { relativeTime } from '@/lib/utils';
const TYPE_ICONS: Record<string, string> = { payment: '💸', task: '📋', job: '💼', system: 'ℹ' };
interface NotificationPanelProps { onClose: () => void; }
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markRead, markAllRead, clear } = useNotifications();
  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-11 z-50 w-80 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">All read</button>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors">✕</button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/20">
        {notifications.length === 0 ? (
          <p className="text-center text-slate-600 text-sm py-8">No notifications</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-slate-800/20' : ''}`}>
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</span>
              <div className="min-w-0">
                <p className={`text-sm ${n.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>{n.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{n.message}</p>
                <p className="text-xs text-slate-700 mt-0.5">{relativeTime(new Date(n.timestamp))}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700/30">
          <button onClick={clear} className="text-xs text-slate-600 hover:text-slate-400 transition-colors w-full text-center">Clear all</button>
        </div>
      )}
    </motion.div>
  );
}
