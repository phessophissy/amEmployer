import { useEffect, useState } from 'react';
import { type Theme, applyTheme, getSavedTheme } from '@/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('cyber');

  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const changeTheme = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  return { theme, changeTheme };
}
