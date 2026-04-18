import { useTheme, THEMES } from '../context/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const next = THEMES[(THEMES.findIndex(t => t.id === theme) + 1) % THEMES.length];
    const cur  = THEMES.find(t => t.id === theme);
    return (
      <button onClick={() => setTheme(next.id)} title={`Switch to ${next.label}`}
        className="theme-pill-btn active" style={{ borderRadius: 8, fontSize: 13 }}>
        {cur.label.split(' ')[0]}
      </button>
    );
  }

  return (
    <div className="theme-pill">
      {THEMES.map(t => (
        <button key={t.id} onClick={() => setTheme(t.id)}
          className={`theme-pill-btn ${theme === t.id ? 'active' : ''}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
