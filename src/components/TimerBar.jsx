import { useGame } from '../context/GameContext';

export default function TimerBar() {
  const { timeLeft, drawTime, phase } = useGame();
  if (phase === 'choosing' || phase === 'lobby') return null;

  const pct     = drawTime > 0 ? Math.max(0, (timeLeft / drawTime) * 100) : 0;
  const urgent  = timeLeft <= 10;
  const warning = timeLeft <= 25;
  const barColor = urgent ? '#ef4444' : warning ? '#f97316' : 'var(--accent)';

  return (
    <div className="flex items-center gap-1.5 w-full">
      <span className="font-black text-sm md:text-base tabular-nums w-8 text-right"
            style={{
              color: urgent ? '#ef4444' : warning ? '#f97316' : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              animation: urgent ? 'pulse 0.6s infinite' : 'none',
            }}>
        {timeLeft}
      </span>
      
      <div className="flex-1 h-6 rounded-full overflow-hidden"
           style={{
             background: 'var(--bg-card2)',
             border: '1px solid var(--border)',
           }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${barColor}dd, ${barColor})`,
            boxShadow: urgent ? `0 0 8px ${barColor}` : 'none',
            transition: 'width 0.2s ease-out',
          }}
        />
      </div>
      
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>
        {urgent ? '⏰' : '⏱️'}
      </span>
    </div>
  );
}
