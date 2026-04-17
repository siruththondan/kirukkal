import { useTheme } from '../context/ThemeContext';

/** Animated SVG palm leaves — shown only in palm theme, positioned absolutely */
export function PalmLeaves({ position = 'top-right' }) {
  const { theme } = useTheme();
  if (theme !== 'palm') return null;

  const posStyles = {
    'top-right': { top: -20, right: -20, transform: 'rotate(25deg)', opacity: 0.12 },
    'top-left':  { top: -20, left: -20,  transform: 'rotate(-155deg)', opacity: 0.1 },
    'bottom-left': { bottom: -30, left: -10, transform: 'rotate(-30deg)', opacity: 0.09 },
  };

  return (
    <svg
      width="220" height="220"
      viewBox="0 0 220 220"
      style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0, ...posStyles[position] }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main leaf */}
      <path
        d="M110 200 C80 160, 30 120, 10 60 C40 90, 70 100, 110 200Z"
        fill="#3d6628" stroke="#5a8c3a" strokeWidth="0.8"
      />
      {/* Veins */}
      <path d="M110 200 C80 160, 30 120, 10 60" stroke="#4d7a30" strokeWidth="0.4" fill="none"/>
      <path d="M80 155 C70 135, 35 115, 20 85"  stroke="#4d7a30" strokeWidth="0.3" fill="none" opacity="0.7"/>
      <path d="M92 170 C82 150, 55 135, 40 110" stroke="#4d7a30" strokeWidth="0.3" fill="none" opacity="0.7"/>

      {/* Second leaf */}
      <path
        d="M110 200 C130 155, 175 120, 200 55 C170 88, 140 102, 110 200Z"
        fill="#2d5220" stroke="#4a7830" strokeWidth="0.8"
      />
      <path d="M110 200 C130 155, 175 120, 200 55" stroke="#3d6628" strokeWidth="0.4" fill="none"/>
      <path d="M135 158 C148 138, 172 118, 188 88" stroke="#3d6628" strokeWidth="0.3" fill="none" opacity="0.7"/>

      {/* Center frond */}
      <path
        d="M110 200 C108 150, 100 100, 110 20 C118 100, 112 150, 110 200Z"
        fill="#4a7030" stroke="#5c8c3a" strokeWidth="0.6"
      />
    </svg>
  );
}

/** Kolam dot pattern corner decoration */
export function KolamCorner({ size = 80 }) {
  const { theme } = useTheme();
  if (theme !== 'palm') return null;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      style={{ position: 'absolute', top: 8, right: 8, opacity: 0.3, pointerEvents: 'none', zIndex: 0 }}
    >
      {/* Kolam dots arranged in a pattern */}
      {[
        [10,10],[25,10],[40,10],[55,10],[70,10],
        [10,25],[25,25],[40,25],[55,25],[70,25],
        [10,40],[25,40],[40,40],[55,40],[70,40],
        [10,55],[25,55],[40,55],[55,55],[70,55],
        [10,70],[25,70],[40,70],[55,70],[70,70],
      ].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#c9952a" opacity="0.5"/>
      ))}
      {/* Connecting lines (kolam style) */}
      <path d="M10 10 L40 40 L70 10 M10 70 L40 40 L70 70 M10 10 L10 70 M70 10 L70 70" 
            stroke="#c9952a" strokeWidth="0.5" opacity="0.35" fill="none"/>
      <circle cx="40" cy="40" r="8" stroke="#c9952a" strokeWidth="0.8" opacity="0.4" fill="none"/>
      <circle cx="40" cy="40" r="4" fill="#c9952a" opacity="0.3"/>
    </svg>
  );
}

/** Horizontal ornamental divider — temple frieze style */
export function OrnamentDivider() {
  const { theme } = useTheme();

  return (
    <div className="kolam-divider my-2" aria-hidden="true" />
  );
}

/** Lotus bud icon for headings */
export function LotusIcon({ size = 20 }) {
  const { theme } = useTheme();
  const color = theme === 'palm' ? '#c9952a' : theme === 'light' ? '#b45309' : '#818cf8';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20 C8 16, 4 12, 6 7 C8 9, 10 12, 12 20Z" fill={color} opacity="0.7"/>
      <path d="M12 20 C16 16, 20 12, 18 7 C16 9, 14 12, 12 20Z" fill={color} opacity="0.7"/>
      <path d="M12 20 C10 15, 10 10, 12 4 C14 10, 14 15, 12 20Z" fill={color}/>
      <ellipse cx="12" cy="19" rx="3" ry="1.5" fill={color} opacity="0.4"/>
    </svg>
  );
}
