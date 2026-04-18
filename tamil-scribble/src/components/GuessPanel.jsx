import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];
const getEmoji = (players, id) => AVATARS[Math.max(0, players.findIndex(p => p.id === id)) % AVATARS.length];

export default function GuessPanel() {
  const { messages, sendGuess, amDrawing, phase, players, myId, wordChoices, pickWord } = useGame();
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const myPlayer = players.find(p => p.id === myId);
  const hasGuessed = myPlayer?.hasGuessed;
  const canGuess = !amDrawing && !hasGuessed && phase === 'drawing';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !canGuess) return;
    sendGuess(input.trim()); setInput('');
  };

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 200, position: 'relative' }}>

      {/* Word choice overlay */}
      {wordChoices && amDrawing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 rounded-2xl backdrop-blur-sm"
             style={{ background: 'var(--bg-overlay)' }}>
          <h3 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Noto Sans Tamil', serif" }}>
            ஒரு சொல்லை தேர்ந்தெடுக்கவும்!
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pick a word to draw</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {wordChoices.map(word => (
              <button key={word.id} onClick={() => pickWord(word)}
                className="card card-hover p-3 text-center cursor-pointer"
                style={{ border: '1px solid var(--border)' }}>
                <div className="font-black text-xl" style={{ color: 'var(--text-primary)', fontFamily: "'Noto Sans Tamil', serif" }}>
                  {word.tamil}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {word.english} · {word.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-accent)', fontFamily: "'Noto Sans Tamil', serif" }}>💬 சாட்</h3>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{messages.length}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm py-4" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', serif" }}>
            யூகிக்க தொடங்கவும்...
          </p>
        )}
        {messages.map(msg => <Msg key={msg.id} msg={msg} players={players} />)}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        {phase === 'drawing' ? (
          amDrawing ? (
            <div className="text-center text-sm rounded-xl p-3" style={{ color: 'var(--text-faint)', background: 'var(--bg-card2)', fontFamily: "'Noto Sans Tamil', serif" }}>
              🎨 நீங்கள் வரைகிறீர்கள்!
            </div>
          ) : hasGuessed ? (
            <div className="text-center text-sm rounded-xl p-3" style={{ color: 'var(--green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', fontFamily: "'Noto Sans Tamil', serif" }}>
              ✅ சரியாக கண்டுபிடித்தீர்கள்!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="யூகி... Tamil/Tanglish/English ok!"
                className="input-field flex-1 text-sm" maxLength={50} autoComplete="off" />
              <button type="submit" disabled={!input.trim()} className="btn-primary text-sm"
                      style={{ padding: '10px 14px' }}>↵</button>
            </form>
          )
        ) : (
          <div className="text-center text-sm py-2" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', serif" }}>
            {phase === 'choosing' ? '✏️ சொல் தேர்ந்தெடுக்கிறார்...' : '⏳ அடுத்த சுற்று...'}
          </div>
        )}
      </div>
    </div>
  );
}

function Msg({ msg, players }) {
  if (msg.type === 'system') {
    return (
      <div className="text-center chat-message">
        <span className="text-xs px-3 py-1 rounded-full" style={{ color: 'var(--text-faint)', background: 'var(--bg-card2)', fontFamily: "'Noto Sans Tamil', serif" }}>
          {msg.text}
        </span>
      </div>
    );
  }
  if (msg.type === 'correct') {
    return (
      <div className="chat-message">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <span>🎉</span>
          <span className="font-bold text-sm" style={{ color: 'var(--green)', fontFamily: "'Noto Sans Tamil', serif" }}>
            {msg.text}
          </span>
        </div>
      </div>
    );
  }
  const emoji = getEmoji(players, msg.playerId);
  return (
    <div className="chat-message flex items-start gap-2">
      <span className="text-base flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <span className="text-xs font-bold" style={{ color: msg.color || 'var(--text-accent)' }}>{msg.playerName}: </span>
        <span className="text-sm break-all" style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', serif" }}>{msg.text}</span>
      </div>
    </div>
  );
}
