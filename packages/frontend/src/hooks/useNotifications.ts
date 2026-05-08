import { create } from 'zustand';
type NotifType = 'payment' | 'task' | 'job' | 'system';
interface Notification { id: string; type: NotifType; title: string; message: string; timestamp: number; read: boolean; }
interface NotifStore {
  notifications: Notification[];
  unreadCount: number;
  add: (type: NotifType, title: string, message: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}
export const useNotifications = create<NotifStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  add: (type, title, message) => {
    const n: Notification = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, title, message, timestamp: Date.now(), read: false };
    set(s => ({ notifications: [n, ...s.notifications].slice(0, 50), unreadCount: s.unreadCount + 1 }));
  },
  markRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) })),
  markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
// notification util 6
// notification util 7
// notification util 8
// notification util 9
