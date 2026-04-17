import { useTheme, THEMES } from '../context/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    // Tiny icon-only version for game header
    const current = THEMES.find(t => t.id === theme);
    const nextIdx = (THEMES.findIndex(t => t.id === theme) + 1) % THEMES.length;
    const next = THEMES[nextIdx];
    return (
      <button
        onClick={() => setTheme(next.id)}
        title={`Switch to ${next.label}`}
        className="theme-pill-btn active text-xs px-2 py-1"
        style={{ borderRadius: 8 }}
      >
        {current.label.split(' ')[0]}
      </button>
    );
  }

  return (
    <div className="theme-pill">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`theme-pill-btn ${theme === t.id ? 'active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
