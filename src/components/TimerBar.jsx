import { useGame } from '../context/GameContext';

export default function TimerBar() {
  const { timeLeft, drawTime, phase } = useGame();
  if (phase === 'choosing' || phase === 'lobby') return null;

  const pct     = drawTime > 0 ? Math.max(0, (timeLeft / drawTime) * 100) : 0;
  const urgent  = timeLeft <= 10;
  const warning = timeLeft <= 25;
  const barColor = urgent ? 'var(--red)' : warning ? 'var(--orange)' : 'var(--accent)';

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="font-black text-lg tabular-nums w-8 text-right"
            style={{ color: urgent ? 'var(--red)' : warning ? 'var(--orange)' : 'var(--text-primary)',
                     fontVariantNumeric: 'tabular-nums',
                     animation: urgent ? 'pulse 0.6s infinite' : 'none' }}>
        {timeLeft}
      </span>
      <div className="flex-1 timer-bar-track">
        <div className="timer-bar-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg,${barColor}99,${barColor})`,
          boxShadow: urgent ? `0 0 8px ${barColor}` : 'none',
        }} />
      </div>
      <span style={{ fontSize: 16 }}>{urgent ? '⏰' : '⏱️'}</span>
    </div>
  );
}
