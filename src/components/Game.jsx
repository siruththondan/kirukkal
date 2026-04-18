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
  
  // Show word choice overlay ONLY when it's choosing AND you are the drawer
  const showChoiceOverlay = phase === 'choosing' && amDrawing;

  return (
    <div className="min-h-screen flex flex-col gap-2 p-2 md:p-3"
         style={{ maxWidth: 1400, margin: '0 auto', background: 'var(--bg-root)', height: '100vh' }}>

      {/* Top Bar */}
      <div className="card px-3 py-2 flex items-center gap-2 md:gap-3 flex-wrap flex-shrink-0">

        {/* Round */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎨</span>
          <span className="font-bold text-xs md:text-sm" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", color: 'var(--text-primary)' }}>
            சுற்று <span style={{ color: 'var(--accent)' }}>{round}</span>
            <span style={{ color: 'var(--text-faint)' }}>/{maxRounds}</span>
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Drawer */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm">✏️</span>
          <span className="text-xs md:text-sm" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", color: 'var(--text-muted)' }}>
            {amDrawing
              ? <span className="font-bold" style={{ color: 'var(--accent)' }}>நீங்கள் வரைகிறீர்கள்!</span>
              : <span>
                  <span className="font-bold" style={{ color: drawerPlayer?.color || 'var(--accent)' }}>
                    {drawerName || '...'}
                  </span>
                  <span> வரைகிறார்</span>
                </span>
            }
          </span>
        </div>

        {/* Timer */}
        <div className="flex-1 min-w-32"><TimerBar /></div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <code className="text-xs px-2 py-1 rounded hidden sm:inline"
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
      <div className="card px-3 py-2 md:py-3 flex-shrink-0">
        <WordDisplay />
      </div>

      {/* Main Area - Game Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 min-h-0 overflow-hidden">

        {/* Left: Player List (desktop only) */}
        <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 180 }}>
          <PlayerList />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          <DrawCanvas phase={phase} />
          
          {/* Word choice overlay (only show when choosing AND you are drawer) */}
          {showChoiceOverlay && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg"
                 style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              {/* This overlay is handled in GuessPanel now */}
            </div>
          )}
        </div>

        {/* Right: Chat Panel */}
        <div className="flex-shrink-0 flex flex-col w-full md:w-72 min-h-0">
          <GuessPanel />
        </div>
      </div>

      {/* Mobile Player Scores */}
      <div className="flex lg:hidden gap-1 overflow-x-auto card p-2 flex-shrink-0">
        {[...players].sort((a,b)=>b.score-a.score).map(p => (
          <div key={p.id} className="flex items-center gap-1 px-2 py-1.5 rounded-lg flex-shrink-0 text-xs"
               style={{
                 background: p.id===myId ? 'var(--bg-card2)' : 'transparent',
                 border: p.id===myId ? '1px solid var(--accent)' : '1px solid var(--border)',
               }}>
            {p.isDrawing && <span>✏️</span>}
            {p.hasGuessed && !p.isDrawing && <span>✅</span>}
            <span className="font-bold" style={{ color: p.color, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {p.name.slice(0,7)}
            </span>
            <span className="font-black" style={{ color: 'var(--accent)' }}>{p.score}</span>
          </div>
        ))}
      </div>

      {correctGuessEvent && <CorrectGuessOverlay />}
      {phase === 'gameEnd' && <GameEnd />}
    </div>
  );
}
