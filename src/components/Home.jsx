import { useState } from 'react';
import { useGame } from '../context/GameContext';
import ThemeSwitcher from './ThemeSwitcher';
import { PalmLeaves, KolamCorner, OrnamentDivider } from './Decorations';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { createRoom, joinRoom, connecting } = useGame();
  const { theme } = useTheme();
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createRoom(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim(), name.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <PalmLeaves position="top-right" />
      <PalmLeaves position="top-left" />
      <PalmLeaves position="bottom-left" />

      <div className="fixed top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Hero */}
      <div className="text-center mb-8 animate-bounce-in relative z-10">
        {theme === 'palm' && (
          <div className="flex items-center justify-center mb-3 opacity-60">
            <span style={{ color: 'var(--text-accent)', fontSize: 11, letterSpacing: '0.3em' }}>
              ✦ ஓலைச்சுவடி விளையாட்டு ✦
            </span>
          </div>
        )}
        <div className="relative inline-block mb-3">
          <div className="text-6xl" style={{
            filter: theme === 'palm' ? 'drop-shadow(0 0 20px rgba(201,149,42,0.45))' :
                    theme === 'light' ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' :
                    'drop-shadow(0 0 20px rgba(99,102,241,0.5))'
          }}>🎨</div>
        </div>
        <h1 className="font-black gradient-text leading-tight"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontFamily: "'Noto Sans Tamil', serif" }}>
          தமிழ் Scribble
        </h1>
        <OrnamentDivider />
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 15, fontFamily: "'Noto Sans Tamil', serif" }}>
          வரை &nbsp;·&nbsp; யூகி &nbsp;·&nbsp; வெல்லு
          <span className="block text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Draw · Guess · Win with Tamil words
          </span>
        </p>
      </div>

      {/* Main Card */}
      <div className="card card-ornate palm-corner w-full max-w-md p-7 animate-slide-up relative z-10" style={{ animationDelay: '0.1s' }}>
        <KolamCorner />

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', padding: 4, gap: 4 }}>
          {[
            { id: 'create', icon: '🏠', label: 'அறை உருவாக்கு' },
            { id: 'join',   icon: '🔗', label: 'அறையில் சேர்' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 px-3 rounded-lg transition-all"
              style={{
                background: tab === t.id ? 'var(--btn-primary-bg)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer',
                fontFamily: "'Noto Sans Tamil', serif", fontWeight: 700, fontSize: 13,
              }}>
              {t.icon} {t.label}
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
            <Field label="அறை குறியீடு" sub="Room code">
              <input type="text" value={roomCode} onChange={e => setRoomCode(e.target.value)}
                placeholder="Code ஒட்டவும்..."
                className="input-field font-mono tracking-widest text-lg text-center" required />
            </Field>
            <Btn loading={connecting} disabled={!name.trim() || !roomCode.trim()}>🎮 சேர்</Btn>
          </form>
        )}
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap justify-center gap-3 mt-6 animate-slide-up delay-2 relative z-10" style={{ maxWidth: 460 }}>
        {[
          { icon: '🔤', text: 'Tamil + Tanglish + English' },
          { icon: '🤝', text: 'Spelling mistakes ok!' },
          { icon: '📡', text: 'No server · Pure P2P' },
          { icon: '🔒', text: 'Cloudflare Protected' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'Noto Sans Tamil', serif" }}>
            {f.icon} {f.text}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs animate-fade-in relative z-10"
         style={{ color: 'var(--text-faint)', letterSpacing: '0.05em', fontFamily: "'Noto Sans Tamil', serif" }}>
        {theme === 'palm' ? '✦ ஓலை மீது எழுதப்பட்டது ✦' : 'Tamil Scribble · Open Source · Free Forever'}
      </p>
    </div>
  );
}

function Field({ label, sub, children }) {
  return (
    <div>
      <label className="flex items-baseline gap-2 mb-1.5">
        <span style={{ fontFamily: "'Noto Sans Tamil', serif", fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub}</span>
      </label>
      {children}
    </div>
  );
}

function Btn({ children, loading, disabled }) {
  return (
    <button type="submit" className="btn-primary w-full" disabled={loading || disabled}
            style={{ fontSize: 15, padding: '13px 24px' }}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          இணைக்கிறது...
        </span>
      ) : children}
    </button>
  );
}
