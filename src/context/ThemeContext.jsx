import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEMES = [
  { id: 'light', label: '☀️ Light', labelTa: 'பகல்' },
  { id: 'dark',  label: '🌙 Dark',  labelTa: 'இரவு' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('ts-theme') || 'light'; } catch { return 'light'; }
  });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('ts-theme', t); } catch {}
  }, []);

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
