'use client';
import { useTheme } from '@/hooks/useTheme';
import { THEMES, type Theme } from '@/lib/theme';
import { useState } from 'react';

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-base"
        aria-label="Change theme"
        title="Change theme"
      >
        🎨
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl p-2 min-w-[160px]"
          onClick={() => setOpen(false)}>
          {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([key, t]) => (
            <button key={key} onClick={() => changeTheme(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${theme === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.primary }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
