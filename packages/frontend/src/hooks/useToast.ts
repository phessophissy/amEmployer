import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; title?: string; message: string; }

interface ToastStore {
  toasts: Toast[];
  show: (type: ToastType, message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (type, message, title, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set(s => ({ toasts: [...s.toasts, { id, type, title, message }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration);
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
