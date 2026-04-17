import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEMES = [
  { id: 'dark',  label: '🌙 Dark',       labelTa: 'இரவு' },
  { id: 'light', label: '☀️ Light',      labelTa: 'பகல்' },
  { id: 'palm',  label: '🌿 ஓலைச்சுவடி', labelTa: 'ஓலை' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('ts-theme') || 'dark'; } catch { return 'dark'; }
  });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('ts-theme', t); } catch {}
  }, []);

  // Apply on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
