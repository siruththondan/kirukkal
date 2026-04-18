import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];

export default function PlayerList() {
  const { players, myId, drawerPeerId } = useGame();
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...players.map(p => p.score), 1);

  return (
    <div className="card p-3 h-full overflow-y-auto">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-1"
          style={{ color: 'var(--text-accent)', fontFamily: "'Noto Sans Tamil', serif" }}>
        🏆 மதிப்பெண்
      </h3>
      <div className="space-y-2">
        {sorted.map((player, i) => (
          <PlayerRow key={player.id} player={player} rank={i}
            isMe={player.id === myId} isDrawing={player.id === drawerPeerId}
            maxScore={maxScore}
            emoji={AVATARS[players.findIndex(p => p.id === player.id) % AVATARS.length]} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player, rank, isMe, isDrawing, maxScore, emoji }) {
  const pct = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
  return (
    <div className="rounded-xl p-2.5 transition-all"
         style={{
           background: isMe ? 'var(--bg-card2)' : 'transparent',
           border: isMe ? '1px solid var(--border-accent)' : '1px solid transparent',
           outline: isDrawing ? '1px solid rgba(232,184,75,0.4)' : 'none'
         }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs w-5 text-center" style={{ color: 'var(--text-faint)' }}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank+1}.`}
        </span>
        <span className="text-base">{emoji}</span>
        <span className="font-semibold text-sm flex-1 truncate"
              style={{ color: player.color, fontFamily: "'Noto Sans Tamil', serif" }}>
          {player.name}
          {isMe && <span className="text-xs ml-1" style={{ color: 'var(--text-accent)' }}>(நீங்கள்)</span>}
        </span>
        <div className="flex items-center gap-1">
          {isDrawing && <span title="Drawing" className="text-xs">✏️</span>}
          {player.hasGuessed && !isDrawing && <span title="Guessed" className="text-xs">✅</span>}
        </div>
        <span className="font-bold text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {player.score}
        </span>
      </div>
      <div className="timer-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: player.color }} />
      </div>
    </div>
  );
}
