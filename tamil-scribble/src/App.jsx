import { GameProvider, useGame } from './context/GameContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

function AppInner() {
  const { appPhase, error, resetGame } = useGame();
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-root)', color: 'var(--text-primary)', transition: 'background 0.4s, color 0.4s' }}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-3 rounded-xl backdrop-blur-sm flex items-center gap-3 animate-bounce-in"
             style={{ background: 'rgba(127,29,29,0.95)', border: '1px solid var(--red)' }}>
          <span>⚠️</span>
          <span style={{ fontFamily: "'Noto Sans Tamil', serif" }}>{error}</span>
          <button onClick={resetGame} className="ml-2 underline text-sm" style={{ color: 'var(--red)' }}>Home</button>
        </div>
      )}
      {appPhase === 'home'  && <Home />}
      {appPhase === 'lobby' && <Lobby />}
      {appPhase === 'game'  && <Game />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <AppInner />
      </GameProvider>
    </ThemeProvider>
  );
}
