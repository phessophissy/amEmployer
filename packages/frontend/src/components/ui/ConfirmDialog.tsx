'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h3 className="font-semibold text-slate-200">{title}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-400">{message}</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">{cancelLabel}</button>
              <button onClick={onConfirm} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
