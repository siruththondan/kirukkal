import { useState } from 'react';
import { useGame } from '../context/GameContext';
import ThemeSwitcher from './ThemeSwitcher';
import { CATEGORIES } from '../lib/words';

const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐸','🦋','🦅','🐙','🦜','🐉'];

export default function Lobby() {
  const { players, isHost, roomCode, myId, startGame, resetGame } = useGame();
  const [rounds,   setRounds]   = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [category, setCategory] = useState('all');
  const [copied,   setCopied]   = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(roomCode); }
    catch { const el=document.createElement('textarea'); el.value=roomCode; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    if (navigator.share) await navigator.share({ title: 'Tamil Scribble', url });
    else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  const canStart = isHost && players.length >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg-root)' }}>
      <div className="fixed top-4 right-4 z-20"><ThemeSwitcher /></div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 animate-bounce-in">
          <h1 className="font-black gradient-text text-3xl" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            🎮 விளையாட்டு அறை
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            நண்பர்களை அழைக்கவும் · Invite friends
          </p>
        </div>

        {/* Room Code */}
        <div className="card card-ornate p-5 mb-4 glow-accent animate-slide-up">
          <p className="text-xs text-center mb-3 font-bold tracking-widest"
             style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            ROOM CODE · அறை குறியீடு
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl p-4 font-mono text-center"
                 style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
              <span className="text-2xl font-black tracking-widest" style={{ color: 'var(--accent)' }}>
                {roomCode}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={copy} className={copied ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
              <button onClick={share} className="btn-secondary px-4 py-2 text-sm">📤 Share</button>
            </div>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            நண்பர்களுக்கு அனுப்பவும் · Share with friends
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Players */}
          <div className="card p-5 animate-slide-up delay-1">
            <h3 className="font-bold mb-3 text-sm flex items-center gap-2"
                style={{ color: 'var(--text-accent)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              👥 வீரர்கள்
              <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>({players.length})</span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
                     style={{
                       background: 'var(--bg-card2)',
                       border: p.id === myId ? '1px solid var(--border-accent)' : '1px solid transparent'
                     }}>
                  <span className="text-lg">{AVATARS[i % AVATARS.length]}</span>
                  <span className="font-bold flex-1 text-sm truncate"
                        style={{ color: p.color, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    {p.name}
                  </span>
                  {p.id === myId && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-badge)', color: 'var(--text-accent)' }}>
                      நீங்கள்
                    </span>
                  )}
                  {i === 0 && <span>👑</span>}
                </div>
              ))}
              {players.length < 2 && (
                <p className="text-xs text-center py-3"
                   style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  குறைந்தது 2 பேர் வேண்டும்…
                </p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="card p-5 animate-slide-up delay-2">
            <h3 className="font-bold mb-4 text-sm"
                style={{ color: 'var(--text-accent)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              ⚙️ அமைப்புகள்
            </h3>
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-2"
                       style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  வகை / Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => isHost && setCategory(cat.id)}
                      disabled={!isHost}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: category===cat.id ? 'var(--btn-primary-bg)' : 'var(--bg-card2)',
                        color: category===cat.id ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${category===cat.id ? 'transparent' : 'var(--border)'}`,
                        cursor: isHost ? 'pointer' : 'default',
                        fontFamily: "'Noto Sans Tamil', sans-serif",
                      }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="சுற்றுகள் / Rounds"   value={rounds}   min={1} max={8}   onChange={setRounds}   disabled={!isHost} />
              <Slider label="வரையும் நேரம் / Time" value={drawTime} min={30} max={180} step={10} suffix="s" onChange={setDrawTime} disabled={!isHost} />
              {!isHost && (
                <p className="text-xs text-center py-2 rounded-lg"
                   style={{ color: 'var(--text-faint)', background: 'var(--bg-card2)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  Host மட்டுமே settings மாற்றலாம்
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2">
              {isHost ? (
                <>
                  <button onClick={() => startGame({ rounds, drawTime, category })}
                    disabled={!canStart} className="btn-primary w-full"
                    style={{ fontSize: 14, padding: '12px' }}>
                    {canStart ? '🚀 விளையாட்டு தொடங்கு!' : 'குறைந்தது 2 பேர் வேண்டும்'}
                  </button>
                  <button onClick={resetGame} className="btn-secondary w-full text-sm">🏠 Home</button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                    <span className="text-sm" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                      Host ஆரம்பிக்கும் வரை...
                    </span>
                  </div>
                  <button onClick={resetGame} className="btn-secondary w-full text-sm">🏠 விட்டு செல்</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-3 mt-4 animate-slide-up delay-3">
          <p className="text-xs text-center" style={{ color: 'var(--text-faint)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            💡 வரைபவர் சொல்லை வரைவார் · Tamil / Tanglish / English யூகிக்கலாம் · முதல் சுற்றில் எளிய சொற்கள், பிறகு கடினமாகும்!
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step=1, suffix='', onChange, disabled }) {
  return (
    <div>
      <label className="flex justify-between mb-1 text-xs"
             style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="font-bold" style={{ color: 'var(--accent)' }}>{value}{suffix}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} disabled={disabled}
        className="w-full" style={{ accentColor: 'var(--accent)' }} />
      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}
