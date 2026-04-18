import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];
const getEmoji = (players, id) => AVATARS[Math.max(0, players.findIndex(p=>p.id===id)) % AVATARS.length];

export default function GuessPanel() {
  const { messages, sendGuess, amDrawing, phase, players, myId, wordChoices, pickWord } = useGame();
  const [input, setInput] = useState('');
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  const myPlayer   = players.find(p => p.id === myId);
  const hasGuessed = myPlayer?.hasGuessed ?? false;
  const canGuess   = !amDrawing && !hasGuessed && phase === 'drawing';

  // Auto-scroll chat
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Auto-focus input when it becomes available
  useEffect(() => {
    if (canGuess) inputRef.current?.focus();
  }, [canGuess]);

  const submit = (e) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || !canGuess) return;
    sendGuess(t);
    setInput('');
  };

  // Word choice overlay: shown when drawer (host or client) is in choosing phase
  const showChoices = amDrawing && phase === 'choosing' && wordChoices?.length > 0;

  return (
    <div className="card flex flex-col" style={{ height:'100%', minHeight:260, position:'relative' }}>

      {/* Word choice overlay */}
      {showChoices && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 rounded-2xl"
             style={{ background:'var(--bg-overlay)', backdropFilter:'blur(4px)' }}>
          <p className="font-black text-base mb-1"
             style={{ color:'var(--text-primary)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            ஒரு சொல்லை தேர்ந்தெடுக்கவும்!
          </p>
          <p className="text-xs mb-4" style={{ color:'var(--text-muted)' }}>Pick a word to draw</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {wordChoices.map(word => (
              <button key={word.id} onClick={() => pickWord(word)}
                className="card card-hover p-3 text-center"
                style={{ border:'1px solid var(--border)', cursor:'pointer' }}>
                <div className="font-black text-xl"
                     style={{ color:'var(--text-primary)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
                  {word.tamil}
                </div>
                <div className="text-xs mt-0.5" style={{ color:'var(--text-faint)' }}>
                  {word.english} · {word.difficulty}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 flex-shrink-0"
           style={{ borderBottom:'1px solid var(--border)' }}>
        <h3 className="font-bold text-sm" style={{ color:'var(--text-accent)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          💬 சாட்
        </h3>
        <span className="text-xs" style={{ color:'var(--text-faint)' }}>{messages.length}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-center py-6 text-sm"
             style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            யூகிக்க தொடங்கவும்...
          </p>
        )}
        {messages.map(msg => <ChatMsg key={msg.id} msg={msg} players={players} />)}
        <div ref={endRef} />
      </div>

      {/* Input footer */}
      <div className="p-3 flex-shrink-0" style={{ borderTop:'1px solid var(--border)' }}>
        {phase === 'drawing' ? (
          amDrawing ? (
            <div className="text-center text-sm rounded-xl p-3"
                 style={{ color:'var(--text-muted)', background:'var(--bg-card2)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
              🎨 நீங்கள் வரைகிறீர்கள்!
            </div>
          ) : hasGuessed ? (
            <div className="text-center text-sm rounded-xl p-3"
                 style={{ color:'var(--green)', background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
              ✅ சரியாக கண்டுபிடித்தீர்கள்!
            </div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                placeholder="யூகி... Tamil / Tanglish / English ok!"
                className="input-field flex-1 text-sm" maxLength={50} autoComplete="off" />
              <button type="submit" disabled={!input.trim()} className="btn-primary"
                      style={{ padding:'9px 14px', fontSize:14 }}>↵</button>
            </form>
          )
        ) : (
          <div className="text-center text-sm py-2"
               style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            {phase==='choosing' ? '✏️ சொல் தேர்ந்தெடுக்கிறார்...' : '⏳ அடுத்த சுற்று...'}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMsg({ msg, players }) {
  // System message (centered pill)
  if (msg.type === 'system') {
    return (
      <div className="text-center chat-message">
        <span className="text-xs px-3 py-1 rounded-full inline-block"
              style={{ color:'var(--text-faint)', background:'var(--bg-card2)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          {msg.text}
        </span>
      </div>
    );
  }

  // Correct guess
  if (msg.type === 'correct') {
    return (
      <div className="chat-message">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
             style={{ background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)' }}>
          <span>🎉</span>
          <span className="font-bold text-sm"
                style={{ color:'var(--green)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            {msg.text}
          </span>
        </div>
      </div>
    );
  }

  // Close guess (🔥 private or public)
  if (msg.type === 'close') {
    return (
      <div className="chat-message">
        <div className="flex items-start gap-2 rounded-xl px-3 py-2"
             style={{ background:'rgba(234,179,8,0.07)', border:'1px solid rgba(234,179,8,0.2)' }}>
          <span>🔥</span>
          <div className="text-sm" style={{ color:'#92400e', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            {msg.playerName ? (
              <>
                <span className="font-bold" style={{ color: msg.color || 'var(--text-accent)' }}>{msg.playerName}: </span>
                <span>{msg.text}</span>
                <span className="ml-1 italic text-xs">— கிட்டத்தட்ட!</span>
              </>
            ) : msg.text}
          </div>
        </div>
      </div>
    );
  }

  // Normal guess
  const em = getEmoji(players, msg.playerId);
  return (
    <div className="chat-message flex items-start gap-2">
      <span className="flex-shrink-0 text-base">{em}</span>
      <div className="min-w-0">
        <span className="text-xs font-bold" style={{ color: msg.color || 'var(--text-accent)' }}>
          {msg.playerName}:{' '}
        </span>
        <span className="text-sm break-all"
              style={{ color:'var(--text-muted)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          {msg.text}
        </span>
      </div>
    </div>
  );
}
