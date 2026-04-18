import { useGame } from '../context/GameContext';
import DrawCanvas from './DrawCanvas';
import GuessPanel from './GuessPanel';
import PlayerList from './PlayerList';
import TimerBar from './TimerBar';
import WordDisplay from './WordDisplay';
import GameEnd from './GameEnd';
import CorrectGuessOverlay from './CorrectGuessOverlay';
import ThemeSwitcher from './ThemeSwitcher';

export default function Game() {
  const { phase, round, maxRounds, drawerName, amDrawing, players, myId, roomCode, resetGame, correctGuessEvent } = useGame();
  const drawerPlayer = players.find(p => p.isDrawing);

  return (
    <div className="min-h-screen flex flex-col gap-2 p-2 md:p-3"
         style={{ maxWidth: 1400, margin: '0 auto', background: 'var(--bg-root)' }}>

      {/* Top Bar */}
      <div className="card px-4 py-2 flex items-center gap-3 flex-wrap">

        {/* Round */}
        <div className="flex items-center gap-1.5">
          <span>🎨</span>
          <span className="font-bold text-sm" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", color: 'var(--text-primary)' }}>
            சுற்று <span style={{ color: 'var(--accent)' }}>{round}</span>
            <span style={{ color: 'var(--text-faint)' }}>/{maxRounds}</span>
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

        {/* Drawer */}
        <div className="flex items-center gap-1.5">
          <span>✏️</span>
          <span className="text-sm" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", color: 'var(--text-muted)' }}>
            {amDrawing
              ? <span className="font-bold" style={{ color: 'var(--accent)' }}>நீங்கள் வரைகிறீர்கள்!</span>
              : <>
                  <span className="font-bold" style={{ color: drawerPlayer?.color || 'var(--accent)' }}>
                    {drawerName || '...'}
                  </span>
                  <span> வரைகிறார்</span>
                </>
            }
          </span>
        </div>

        {/* Timer */}
        <div className="flex-1 min-w-32"><TimerBar /></div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <code className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--text-faint)', background: 'var(--bg-card2)', fontFamily: 'monospace' }}>
            {roomCode}
          </code>
          <ThemeSwitcher compact />
          <button onClick={resetGame} title="Leave game"
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-faint)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
            ✕
          </button>
        </div>
      </div>

      {/* Word Display */}
      <div className="card px-4 py-3">
        <WordDisplay />
      </div>

      {/* Main Area */}
      <div className="flex gap-2" style={{ flex: 1, minHeight: 0 }}>

        {/* Player List — desktop */}
        <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 195 }}>
          <PlayerList />
        </div>

        {/* Canvas */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <DrawCanvas />

          {/* Choosing phase overlay on canvas */}
          {phase === 'choosing' && !amDrawing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm pointer-events-none"
                 style={{ background: 'var(--bg-overlay)' }}>
              <div className="text-center">
                <div className="text-4xl mb-2 animate-bounce">✏️</div>
                <p className="font-bold" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", color: 'var(--text-primary)' }}>
                  {drawerName} சொல்லை தேர்ந்தெடுக்கிறார்...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guess/Chat Panel */}
        <div className="flex-shrink-0 flex flex-col" style={{ width: 265, minHeight: 300 }}>
          <GuessPanel />
        </div>
      </div>

      {/* Mobile scorebar */}
      <div className="flex lg:hidden gap-1.5 overflow-x-auto card p-2">
        {[...players].sort((a,b)=>b.score-a.score).map(p => (
          <div key={p.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg flex-shrink-0"
               style={{
                 background: p.id===myId ? 'var(--bg-card2)' : 'transparent',
                 border: p.id===myId ? '1px solid var(--border-accent)' : '1px solid transparent',
               }}>
            {p.isDrawing && <span className="text-xs">✏️</span>}
            {p.hasGuessed && !p.isDrawing && <span className="text-xs">✅</span>}
            <span className="text-xs font-bold" style={{ color: p.color, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {p.name.slice(0,8)}
            </span>
            <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{p.score}</span>
          </div>
        ))}
      </div>

      {correctGuessEvent && <CorrectGuessOverlay />}
      {phase === 'gameEnd'  && <GameEnd />}
    </div>
  );
}
