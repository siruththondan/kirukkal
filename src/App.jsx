import { GameProvider, useGame } from './context/GameContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

function AppInner() {
  const { appPhase, error, resetGame } = useGame();
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-root)', color:'var(--text-primary)', transition:'background 0.3s,color 0.3s' }}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl animate-bounce-in"
             style={{ background:'var(--bg-card)', border:'1px solid var(--red)', boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
          <span>⚠️</span>
          <span style={{ fontFamily:"'Noto Sans Tamil',sans-serif", color:'var(--text-primary)', fontSize:14 }}>{error}</span>
          <button onClick={resetGame}
            style={{ color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontSize:13, textDecoration:'underline' }}>
            Home
          </button>
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
