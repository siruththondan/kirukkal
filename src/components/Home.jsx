import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import ThemeSwitcher from './ThemeSwitcher';
import { getEnvironmentWarning } from '../lib/peerManager';

export default function Home() {
  const { createRoom, joinRoom, connecting } = useGame();
  const [tab, setTab]         = useState('create');
  const [name, setName]       = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [envWarn, setEnvWarn] = useState(null);

  useEffect(() => { setEnvWarn(getEnvironmentWarning()); }, []);

  const handleCreate = (e) => { e.preventDefault(); if (name.trim()) createRoom(name.trim()); };
  const handleJoin   = (e) => { e.preventDefault(); if (name.trim() && roomCode.trim()) joinRoom(roomCode.trim(), name.trim()); };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg-root)' }}>

      {/* Theme switcher */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Env warning */}
      {envWarn && (
        <div className="w-full max-w-md mb-4 px-4 py-3 rounded-xl text-sm flex gap-2 animate-slide-up"
             style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)', color: '#92400e' }}>
          <span>⚠️</span><span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{envWarn}</span>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-8 animate-bounce-in">
        <div className="text-6xl mb-3">🎨</div>
        <h1 className="font-black gradient-text leading-tight"
            style={{ fontSize: 'clamp(2.2rem,6vw,3.5rem)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          தமிழ் Scribble
        </h1>
        <div style={{ height: 1, background: 'var(--border)', margin: '12px auto', width: 120 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 15, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          வரை · யூகி · வெல்லு
          <span className="block text-sm" style={{ color: 'var(--text-faint)', marginTop: 2 }}>
            Draw · Guess · Win with Tamil words
          </span>
        </p>
      </div>

      {/* Main card */}
      <div className="card card-ornate w-full max-w-md p-6 animate-slide-up" style={{ animationDelay: '0.08s' }}>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6 p-1 gap-1"
             style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
          {[
            { id: 'create', label: '🏠 அறை உருவாக்கு' },
            { id: 'join',   label: '🔗 அறையில் சேர்' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 px-3 rounded-lg transition-all text-sm font-bold"
              style={{
                background: tab === t.id ? 'var(--btn-primary-bg)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer',
                fontFamily: "'Noto Sans Tamil', sans-serif",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="உங்கள் பெயர்" sub="Your name">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="பெயர் உள்ளிடவும்..." maxLength={20}
                className="input-field" required autoFocus />
            </Field>
            <Btn loading={connecting} disabled={!name.trim()}>🚀 அறை உருவாக்கு</Btn>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <Field label="உங்கள் பெயர்" sub="Your name">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="பெயர் உள்ளிடவும்..." maxLength={20}
                className="input-field" required autoFocus />
            </Field>
            <Field label="அறை குறியீடு" sub="6-letter room code">
              <input type="text" value={roomCode}
                onChange={e => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))}
                placeholder="e.g. k7mp2x"
                className="input-field font-mono tracking-widest text-xl text-center"
                maxLength={6} required />
            </Field>
            <Btn loading={connecting} disabled={!name.trim() || roomCode.length < 4}>🎮 சேர்</Btn>
          </form>
        )}
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-6 animate-slide-up delay-2" style={{ maxWidth: 440 }}>
        {[
          { icon: '🔤', text: 'Tamil + Tanglish + English' },
          { icon: '🤝', text: 'Spelling mistakes ok!' },
          { icon: '📡', text: 'No server · Pure P2P' },
          { icon: '🔒', text: 'Cloudflare Protected' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs card"
               style={{ color: 'var(--text-muted)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            {f.icon} {f.text}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs animate-fade-in" style={{ color: 'var(--text-faint)' }}>
        Tamil Scribble · Open Source · Free Forever
      </p>
    </div>
  );
}

function Field({ label, sub, children }) {
  return (
    <div>
      <label className="flex items-baseline gap-2 mb-1.5">
        <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub}</span>
      </label>
      {children}
    </div>
  );
}

function Btn({ children, loading, disabled }) {
  return (
    <button type="submit" className="btn-primary w-full" disabled={loading || disabled}
            style={{ fontSize: 15, padding: '12px 22px' }}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          இணைக்கிறது...
        </span>
      ) : children}
    </button>
  );
}
