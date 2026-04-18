import { useGame } from '../context/GameContext';

export default function CorrectGuessOverlay() {
  const { correctGuessEvent, myId } = useGame();
  if (!correctGuessEvent) return null;
  const isMe = correctGuessEvent.playerId === myId;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="absolute inset-0 animate-fade-in"
           style={{ background: isMe ? 'rgba(22,163,74,0.06)' : 'rgba(37,99,235,0.06)' }} />
      <div className="animate-bounce-in relative z-10 text-center px-10 py-6 rounded-2xl"
           style={{
             background: 'var(--bg-card)',
             border: `2px solid ${isMe ? 'rgba(22,163,74,0.5)' : 'var(--border-accent)'}`,
             boxShadow: `0 8px 40px ${isMe ? 'rgba(22,163,74,0.2)' : 'var(--accent-glow)'}`,
           }}>
        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>
          {isMe ? '🎉' : '✅'}
        </div>
        <div className="font-black text-xl" style={{ color:'var(--text-primary)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          {isMe ? 'நீங்கள் சரியாக சொன்னீர்கள்!' : `${correctGuessEvent.playerName} கண்டுபிடித்தார்!`}
        </div>
        <div className="font-black text-3xl mt-1"
             style={{ color: isMe ? 'var(--green)' : 'var(--accent)' }}>
          +{correctGuessEvent.points} மதிப்பெண்!
        </div>
      </div>
    </div>
  );
}
