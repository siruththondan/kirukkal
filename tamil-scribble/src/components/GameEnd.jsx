import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];
const MEDALS  = ['🥇','🥈','🥉'];

function Confetti() {
  const colors = ['var(--accent)','var(--gold)','var(--green)','#f97316','#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute w-2 h-3 rounded-sm"
          style={{
            left: `${Math.random()*100}%`, top: '-10px',
            background: colors[i % colors.length],
            animation: `confFall ${2 + Math.random()*3}s ${Math.random()*2}s linear forwards`,
            transform: `rotate(${Math.random()*360}deg)`,
          }} />
      ))}
      <style>{`@keyframes confFall { to { transform: translateY(110vh) rotate(720deg); opacity:0; } }`}</style>
    </div>
  );
}

export default function GameEnd() {
  const { players, myId, resetGame, isHost, startGame, maxRounds, drawTime } = useGame();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const amWinner = winner?.id === myId;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4"
         style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}>
      <Confetti />
      <div className="card card-ornate palm-corner w-full max-w-lg p-8 z-20 animate-bounce-in">

        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{amWinner ? '🏆' : '🎮'}</div>
          <h2 className="font-black text-3xl gradient-text" style={{ fontFamily: "'Noto Sans Tamil', serif" }}>
            {amWinner ? 'நீங்கள் வென்றீர்கள்!' : 'விளையாட்டு முடிந்தது!'}
          </h2>
          {winner && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', serif" }}>
              🥇 <span className="font-bold" style={{ color: winner.color }}>{winner.name}</span> வென்றார்!
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {sorted.map((player, i) => (
            <div key={player.id} className="flex items-center gap-4 p-4 rounded-xl"
                 style={{
                   background: i === 0 ? 'rgba(232,184,75,0.1)' : i === 1 ? 'rgba(148,163,184,0.08)' : i === 2 ? 'rgba(180,83,9,0.08)' : 'var(--bg-card2)',
                   border: `1px solid ${i === 0 ? 'rgba(232,184,75,0.3)' : i === 1 ? 'rgba(148,163,184,0.2)' : i === 2 ? 'rgba(180,83,9,0.2)' : 'var(--border)'}`,
                   animationDelay: `${i*0.08}s`
                 }}>
              <span className="text-2xl w-8 text-center">{MEDALS[i] || `${i+1}.`}</span>
              <span className="text-xl">{AVATARS[players.findIndex(p => p.id === player.id) % AVATARS.length]}</span>
              <div className="flex-1">
                <div className="font-bold" style={{ color: player.color, fontFamily: "'Noto Sans Tamil', serif" }}>
                  {player.name}
                  {player.id === myId && <span className="text-xs ml-2" style={{ color: 'var(--text-accent)' }}>(நீங்கள்)</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>{player.score}</div>
                <div className="text-xs" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', serif" }}>மதிப்பெண்</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isHost ? (
            <>
              <button onClick={() => startGame({ rounds: maxRounds, drawTime })} className="btn-primary flex-1">
                🔄 மீண்டும் விளையாடு
              </button>
              <button onClick={resetGame} className="btn-secondary px-6">🏠</button>
            </>
          ) : (
            <>
              <div className="flex-1 text-center text-sm py-3" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', serif" }}>
                Host புதிய game தொடங்கலாம்...
              </div>
              <button onClick={resetGame} className="btn-secondary px-6">🏠 விட்டு செல்</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
