import { useGame } from '../context/GameContext';

export default function WordDisplay() {
  const { amDrawing, myWord, hintChars, wordLength, drawerName, phase, roundEndWord } = useGame();

  if (phase === 'choosing') {
    return (
      <div className="flex items-center justify-center gap-2 py-1">
        <span className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} />
        <span className="text-sm" style={{ color:'var(--text-muted)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          {drawerName} சொல்லை தேர்ந்தெடுக்கிறார்...
        </span>
      </div>
    );
  }

  if (phase === 'roundEnd' && roundEndWord) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="text-xs" style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          சொல் இதுதான்:
        </span>
        <div className="flex items-baseline gap-3">
          <span className="font-black text-3xl animate-bounce-in gradient-text">
            {roundEndWord.tamil}
          </span>
          <span className="text-sm" style={{ color:'var(--text-faint)' }}>
            ({roundEndWord.english})
          </span>
        </div>
      </div>
    );
  }

  /* Drawer sees their word */
  if (amDrawing && myWord) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="text-xs" style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          நீங்கள் இதை வரையுங்கள்:
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-3xl animate-bounce-in"
                style={{ color:'var(--accent)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
            {myWord.tamil}
          </span>
          <span className="text-sm italic" style={{ color:'var(--text-faint)' }}>
            ({myWord.english})
          </span>
        </div>
      </div>
    );
  }

  /* Show "waiting for drawer to pick" for drawer before they pick word */
  if (amDrawing && !myWord && phase === 'drawing') {
    return (
      <div className="flex items-center justify-center gap-2 py-1">
        <span className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} />
        <span className="text-sm" style={{ color:'var(--text-muted)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          சொல் தேர்ந்தெடுக்கவும்...
        </span>
      </div>
    );
  }

  /* Guessers: hint letters */
  const chars = hintChars.length > 0 ? hintChars : Array(wordLength || 4).fill('_');

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <span className="text-xs" style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
        {drawerName} வரைகிறார் · {chars.length} எழுத்துகள் / graphemes
      </span>
      <div className="flex flex-wrap justify-center">
        {chars.map((ch, i) => (
          <span key={i} className={`hint-letter ${ch !== '_' ? 'revealed' : ''}`}>
            {ch === '_' ? '\u00A0' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
