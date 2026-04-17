import { useGame } from '../context/GameContext';

export default function CorrectGuessOverlay() {
  const { correctGuessEvent, myId } = useGame();
  if (!correctGuessEvent) return null;
  const isMe = correctGuessEvent.playerId === myId;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="absolute inset-0" style={{
        background: isMe ? 'rgba(52,211,153,0.07)' : 'rgba(99,102,241,0.06)',
        animation: 'fadeIn 0.3s ease-out',
      }} />
      <div className="animate-bounce-in relative z-10 text-center px-10 py-6 rounded-2xl"
           style={{
             background: isMe
               ? 'linear-gradient(135deg, rgba(6,78,59,0.95), rgba(4,120,87,0.95))'
               : 'linear-gradient(135deg, rgba(30,27,75,0.95), rgba(46,16,101,0.95))',
             border: `2px solid ${isMe ? 'rgba(52,211,153,0.5)' : 'var(--border-accent)'}`,
             boxShadow: `0 0 60px ${isMe ? 'rgba(52,211,153,0.25)' : 'var(--accent-glow)'}`,
           }}>
        <div className="text-5xl mb-2">{isMe ? '🎉' : '✅'}</div>
        <div className="font-black text-xl" style={{ color: '#fff', fontFamily: "'Noto Sans Tamil', serif" }}>
          {isMe ? 'நீங்கள் சரியாக சொன்னீர்கள்!' : `${correctGuessEvent.playerName} கண்டுபிடித்தார்!`}
        </div>
        <div className="font-black text-3xl mt-1.5"
             style={{ color: isMe ? 'var(--green)' : 'var(--text-accent)' }}>
          +{correctGuessEvent.points} மதிப்பெண்!
        </div>
      </div>
    </div>
  );
}
