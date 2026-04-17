import { useGame } from '../context/GameContext';

export default function TimerBar() {
  const { timeLeft, drawTime, phase } = useGame();
  if (phase === 'choosing' || phase === 'lobby') return null;

  const pct = drawTime > 0 ? (timeLeft / drawTime) * 100 : 0;
  const urgent  = timeLeft <= 10;
  const warning = timeLeft <= 25;

  const barColor = urgent ? 'var(--red)' : warning ? '#f97316' : 'var(--accent)';

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="font-black text-xl tabular-nums w-9 text-right"
            style={{ color: urgent ? 'var(--red)' : warning ? '#f97316' : 'var(--text-primary)',
                     animation: urgent ? 'pulse 0.6s infinite' : 'none' }}>
        {timeLeft}
      </span>
      <div className="flex-1 timer-bar-track">
        <div className="timer-bar-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
          boxShadow: urgent ? `0 0 10px ${barColor}` : 'none',
        }} />
      </div>
      <span className="text-base">{urgent ? '⏰' : '⏱️'}</span>
    </div>
  );
}
