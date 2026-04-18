import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];
const getEmoji = (players, id) => AVATARS[Math.max(0, players.findIndex(p=>p.id===id)) % AVATARS.length];

export default function GuessPanel() {
  const { messages, sendGuess, amDrawing, phase, players, myId, wordChoices, pickWord } = useGame();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const myPlayer   = players.find(p => p.id === myId);
  const hasGuessed = myPlayer?.hasGuessed ?? false;
  const canGuess   = !amDrawing && !hasGuessed && phase === 'drawing';

  // Auto-scroll chat (only scroll if already at bottom)
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Auto-focus input when available
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

  // Word choice overlay
  const showChoices = amDrawing && phase === 'choosing' && wordChoices?.length > 0;

  return (
    <div className="card flex flex-col h-full"
         style={{ display: 'flex', flexDirection: 'column', minHeight: 300, maxHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-center justify-between p-2 md:p-3 flex-shrink-0"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-accent)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
          💬 சாட்
        </h3>
        <span className="text-xs px-2 py-1 rounded"
              style={{ color: 'var(--text-faint)', background: 'var(--bg-card2)' }}>
          {messages.length}
        </span>
      </div>

      {/* Messages - Scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1.5 min-h-0"
           style={{ scrollBehavior: 'smooth' }}>
        {messages.length === 0 && (
          <p className="text-center py-6 text-xs md:text-sm"
             style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
            யூகிக்க தொடங்கவும்...
          </p>
        )}
        {messages.map(msg => <ChatMsg key={msg.id} msg={msg} players={players} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Word Choice Overlay */}
      {showChoices && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 rounded-lg"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-4 max-w-xs">
            <p className="font-black text-base mb-1"
               style={{ color: 'var(--text-primary)', fontFamily: "'Noto Sans Tamil',sans-serif", textAlign: 'center' }}>
              ஒரு சொல்லை தேர்ந்தெடுக்கவும்!
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Pick a word
            </p>
            <div className="flex flex-col gap-2 w-full">
              {wordChoices.map(word => (
                <button key={word.id} onClick={() => pickWord(word)}
                  className="card card-hover p-3 text-center"
                  style={{
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'var(--bg-card)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <div className="font-black text-lg"
                       style={{ color: 'var(--text-primary)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
                    {word.tamil}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                    {word.english} • {word.difficulty}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input footer */}
      <div className="p-2 md:p-3 flex-shrink-0"
           style={{ borderTop: '1px solid var(--border)' }}>
        {phase === 'drawing' ? (
          amDrawing ? (
            <div className="text-center text-xs md:text-sm rounded-lg p-2"
                 style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
              🎨 நீங்கள் வரைகிறீர்கள்!
            </div>
          ) : hasGuessed ? (
            <div className="text-center text-xs md:text-sm rounded-lg p-2"
                 style={{
                   color: 'var(--green)',
                   background: 'rgba(22,163,74,0.08)',
                   border: '1px solid rgba(22,163,74,0.2)',
                   fontFamily: "'Noto Sans Tamil',sans-serif"
                 }}>
              ✅ சரியாக கண்டுபிடித்தீர்கள்!
            </div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="யூகி... Tamil/Tanglish/English"
                className="input-field flex-1 text-xs md:text-sm"
                maxLength={50}
                autoComplete="off"
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="btn-primary"
                style={{
                  padding: '8px 12px',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  opacity: input.trim() ? 1 : 0.5,
                }}>
                ↵
              </button>
            </form>
          )
        ) : (
          <div className="text-center text-xs md:text-sm py-2"
               style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
            {phase === 'choosing' ? '✏️ சொல் தேர்ந்தெடுக்கிறார்...' : '⏳ அடுத்த சுற்று...'}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMsg({ msg, players }) {
  // System message
  if (msg.type === 'system') {
    return (
      <div className="text-center chat-message">
        <span className="text-xs px-2 py-1 rounded-full inline-block"
              style={{
                color: 'var(--text-faint)',
                background: 'var(--bg-card2)',
                fontFamily: "'Noto Sans Tamil',sans-serif"
              }}>
          {msg.text}
        </span>
      </div>
    );
  }

  // Correct guess
  if (msg.type === 'correct') {
    return (
      <div className="chat-message">
        <div className="flex items-center gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs"
             style={{
               background: 'rgba(22,163,74,0.08)',
               border: '1px solid rgba(22,163,74,0.2)'
             }}>
          <span>🎉</span>
          <span className="font-bold"
                style={{
                  color: 'var(--green)',
                  fontFamily: "'Noto Sans Tamil',sans-serif"
                }}>
            {msg.text}
          </span>
        </div>
      </div>
    );
  }

  // Close guess (almost)
  if (msg.type === 'close') {
    return (
      <div className="chat-message">
        <div className="flex items-start gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs"
             style={{
               background: 'rgba(234,179,8,0.07)',
               border: '1px solid rgba(234,179,8,0.2)'
             }}>
          <span>🔥</span>
          <div style={{ color: '#92400e', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
            {msg.playerName ? (
              <>
                <span className="font-bold" style={{ color: msg.color || 'var(--text-accent)' }}>
                  {msg.playerName}
                </span>
                <span>: {msg.text}</span>
                <span className="ml-1 italic text-xs opacity-75"> — கிட்டத்தட்ட!</span>
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
    <div className="chat-message flex items-start gap-1.5 text-xs">
      <span className="flex-shrink-0 text-sm">{em}</span>
      <div className="min-w-0">
        <span className="font-bold" style={{ color: msg.color || 'var(--text-accent)' }}>
          {msg.playerName}
        </span>
        <span className="ml-1 break-all"
              style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil',sans-serif" }}>
          {msg.text}
        </span>
      </div>
    </div>
  );
}
