import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];

export default function PlayerList() {
  const { players, myId, drawerPeerId } = useGame();
  const sorted = [...players].sort((a,b) => b.score - a.score);
  const maxScore = Math.max(...players.map(p=>p.score), 1);

  return (
    <div className="card p-3 flex flex-col gap-2 overflow-y-auto" style={{ flex: 1 }}>
      <h3 className="font-bold text-xs tracking-wide mb-1"
          style={{ color: 'var(--text-muted)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
        🏆 மதிப்பெண்
      </h3>
      {sorted.map((player, i) => {
        const pct = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
        const isMe      = player.id === myId;
        const isDrawing = player.id === drawerPeerId;
        const emoji = AVATARS[players.findIndex(p=>p.id===player.id) % AVATARS.length];
        return (
          <div key={player.id} className="rounded-xl p-2"
               style={{
                 background: isMe ? 'var(--bg-card2)' : 'transparent',
                 border: isMe ? '1px solid var(--border-accent)' : '1px solid transparent',
                 outline: isDrawing ? `2px solid ${player.color}44` : 'none',
               }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs w-5 text-center">
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
              </span>
              <span className="text-sm">{emoji}</span>
              <span className="font-semibold text-xs flex-1 truncate"
                    style={{ color: player.color, fontFamily:"'Noto Sans Tamil',sans-serif" }}>
                {player.name}
                {isMe && <span className="ml-1 text-xs" style={{ color:'var(--text-accent)' }}>(நீ)</span>}
              </span>
              <div className="flex gap-0.5">
                {isDrawing && <span title="Drawing" style={{ fontSize:11 }}>✏️</span>}
                {player.hasGuessed && !isDrawing && <span title="Guessed" style={{ fontSize:11 }}>✅</span>}
              </div>
              <span className="font-black text-sm tabular-nums" style={{ color:'var(--text-primary)' }}>
                {player.score}
              </span>
            </div>
            <div className="timer-bar-track">
              <div className="score-bar-fill" style={{ width:`${pct}%`, background: player.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
