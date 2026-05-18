'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWalletContext } from '@/components/common/WalletProvider';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmployerSubNav } from '@/components/common/EmployerSubNav';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';

const STORAGE_KEY = 'amemployer-employer-settings';

export default function EmployerSettingsPage() {
  const { address } = useWalletContext();
  const [notifications, setNotifications] = useState(true);
  const [autoValidate, setAutoValidate] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.notifications === 'boolean') setNotifications(parsed.notifications);
      if (typeof parsed.autoValidate === 'boolean') setAutoValidate(parsed.autoValidate);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ notifications, autoValidate }),
    );
  }, [notifications, autoValidate]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <EmployerSubNav />
      <SectionHeader title="Settings" subtitle="Employer preferences and configuration" />
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Wallet</h3>
        <div className="bg-slate-800/60 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500 mb-1">Connected Address</p>
          <p className="text-xs font-mono text-emerald-400 break-all">{address || 'Not connected'}</p>
        </div>
      </div>
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Preferences</h3>
        {[
          { label: 'Payment Notifications', value: notifications, set: setNotifications },
          { label: 'Auto-validate submissions', value: autoValidate, set: setAutoValidate },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{s.label}</span>
            <button onClick={() => s.set(v => !v)}
              className={"w-12 h-6 rounded-full transition-all relative " + (s.value ? 'bg-emerald-600' : 'bg-slate-700')}>
              <span className={"absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow " + (s.value ? 'left-7' : 'left-1')} />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Theme</h3>
        <ThemeSwitcher />
      </div>
    </motion.div>
  );
}
