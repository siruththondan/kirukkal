import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];
const MEDALS  = ['🥇','🥈','🥉'];

function Confetti() {
  const colors = ['var(--accent)','var(--gold)','var(--green)','var(--orange)','#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({length:35}).map((_,i)=>(
        <div key={i} style={{
          position:'absolute', width:8, height:12, borderRadius:2,
          left:`${Math.random()*100}%`, top:'-10px',
          background: colors[i%colors.length],
          animation:`confFall ${2+Math.random()*3}s ${Math.random()*2}s linear forwards`,
          transform:`rotate(${Math.random()*360}deg)`,
        }} />
      ))}
    </div>
  );
}

export default function GameEnd() {
  const { players, myId, resetGame, isHost, startGame, maxRounds, drawTime, phase } = useGame();
  if (phase !== 'gameEnd') return null;

  const sorted = [...players].sort((a,b)=>b.score-a.score);
  const winner = sorted[0];
  const amWinner = winner?.id === myId;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4"
         style={{ background:'var(--bg-overlay)', backdropFilter:'blur(8px)' }}>
      <Confetti />
      <div className="card card-ornate w-full max-w-lg p-8 z-20 animate-bounce-in">

        <div className="text-center mb-6">
          <div style={{ fontSize:56, lineHeight:1, marginBottom:10 }}>
            {amWinner ? '🏆' : '🎮'}
          </div>
          <h2 className="font-black text-3xl gradient-text"
              style={{ fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            {amWinner ? 'நீங்கள் வென்றீர்கள்!' : 'விளையாட்டு முடிந்தது!'}
          </h2>
          {winner && (
            <p className="mt-1 text-sm" style={{ color:'var(--text-muted)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
              🥇 <span className="font-bold" style={{ color:winner.color }}>{winner.name}</span> வென்றார்!
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          {sorted.map((player, i) => (
            <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl animate-slide-up"
                 style={{
                   background: i===0 ? 'rgba(217,119,6,0.08)' : i===1 ? 'rgba(100,116,139,0.06)' : i===2 ? 'rgba(180,83,9,0.06)' : 'var(--bg-card2)',
                   border:`1px solid ${i===0?'rgba(217,119,6,0.25)':i===1?'rgba(100,116,139,0.15)':i===2?'rgba(180,83,9,0.15)':'var(--border)'}`,
                   animationDelay:`${i*0.07}s`
                 }}>
              <span style={{ fontSize:20, width:28, textAlign:'center' }}>{MEDALS[i]||`${i+1}.`}</span>
              <span style={{ fontSize:20 }}>{AVATARS[players.findIndex(p=>p.id===player.id)%AVATARS.length]}</span>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color:player.color, fontFamily:"'Noto Sans Tamil',sans-serif" }}>
                  {player.name}
                  {player.id===myId && <span className="text-xs ml-1" style={{ color:'var(--text-accent)' }}>(நீங்கள்)</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl" style={{ color:'var(--text-primary)' }}>{player.score}</div>
                <div className="text-xs" style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>மதிப்பெண்</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isHost ? (
            <>
              <button onClick={()=>startGame({rounds:maxRounds,drawTime})} className="btn-primary flex-1">
                🔄 மீண்டும் விளையாடு
              </button>
              <button onClick={resetGame} className="btn-secondary px-6">🏠</button>
            </>
          ) : (
            <>
              <p className="flex-1 text-center text-sm py-3"
                 style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
                Host புதிய game தொடங்கலாம்...
              </p>
              <button onClick={resetGame} className="btn-secondary px-6">🏠 விட்டு செல்</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
