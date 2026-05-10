import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'payment';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  show: (type: ToastType, message: string, title?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  success: (message: string, title?: string) => void;
  error:   (message: string, title?: string) => void;
  info:    (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  payment: (amount: string, worker?: string) => void;
}

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],

  show: (type, message, title, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, type, title, message, duration, createdAt: Date.now() };
    set((s) => ({ toasts: [...s.toasts.slice(-4), toast] }));
    setTimeout(() => get().dismiss(id), duration);
    return id;
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  success: (message, title) => get().show('success', message, title),
  error:   (message, title) => get().show('error',   message, title, 6000),
  info:    (message, title) => get().show('info',    message, title),
  warning: (message, title) => get().show('warning', message, title, 5000),
  payment: (amount, worker) =>
    get().show('payment', worker ? `-> ${worker.slice(0, 8)}...` : 'On-chain payment confirmed', `+${amount} cUSD`, 5000),
}));
