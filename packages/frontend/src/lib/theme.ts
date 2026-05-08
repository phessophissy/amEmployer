export type Theme = 'cyber' | 'matrix' | 'ocean' | 'sunset';

export const THEMES: Record<Theme, { name: string; primary: string; secondary: string; bg: string; border: string }> = {
  cyber: { name: 'Cyber Green', primary: '#10b981', secondary: '#06b6d4', bg: '#030712', border: '#10b981' },
  matrix: { name: 'Matrix', primary: '#00ff41', secondary: '#00cc33', bg: '#000300', border: '#00ff41' },
  ocean: { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4', bg: '#020b18', border: '#3b82f6' },
  sunset: { name: 'Sunset', primary: '#f97316', secondary: '#ec4899', bg: '#0d0505', border: '#f97316' },
};

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const t = THEMES[theme];
  document.documentElement.style.setProperty('--color-primary', t.primary);
  document.documentElement.style.setProperty('--color-secondary', t.secondary);
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('aE-theme', theme);
}

export function getSavedTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'cyber';
  return (localStorage.getItem('aE-theme') as Theme) || 'cyber';
}
