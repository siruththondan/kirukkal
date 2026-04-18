# 🎨 Tamil Scribble — Quick Start Guide

## What is this?

A **real-time multiplayer drawing & guessing game** in Tamil. Pure P2P (no server), runs in browser.

- 🎨 One player draws a Tamil word
- 🤔 Others guess in Tamil/Tanglish/English
- ⏱️ 80 seconds per round, 3 rounds default
- 📱 Works on mobile, tablet, desktop
- ✨ Light/Dark theme toggle

---

## Setup (2 minutes)

### Option A: Quick Cloud Deploy (GitHub Pages)

1. Fork this repo to your GitHub
2. Enable GitHub Pages in repo Settings → Source = GitHub Actions
3. Go to `https://YOUR-USERNAME.github.io/tamil-scribble/`
4. Done! Share the link with friends

### Option B: Local Development

```bash
# Requirements: Node.js 16+

git clone https://github.com/YOUR-USERNAME/tamil-scribble.git
cd tamil-scribble

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### Option C: GitHub Codespace (Free)

1. Click "Code" → "Codespaces" → "Create Codespace"
2. Wait 2 min for environment setup
3. Terminal: `npm install && npm run dev`
4. VS Code → PORTS tab → Port 5173 → Make Public
5. Share the forwarded URL with friends (everyone must use the SAME URL for P2P)

---

## How to Play

### Creating a Game

1. Open the app
2. Click **"🏠 அறை உருவாக்கு"** (Create Room)
3. Enter your name → Game room created
4. You get a **6-letter room code** (e.g. `k7mp2x`)
5. Share the code with friends (or copy the link)
6. Settings:
   - **Rounds**: How many drawing turns each player takes (1-8)
   - **Time**: Seconds per drawing (30-180)
   - **Category**: All words, or filter by animal/food/objects/nature/body
7. Click **"🚀 விளையாட்டு தொடங்கு!"** once 2+ players joined

### Joining a Game

1. Open the app
2. Click **"🔗 அறையில் சேர்"** (Join Room)
3. Enter your name + the **6-letter code** (e.g. `k7mp2x`)
4. Wait for host to start

### During a Round

**If you're drawing (✏️):**
- See the **Tamil word** you must draw
- 12 colors + 4 brush sizes in toolbar
- Tools: Fill 🪣, Eraser 🧹, Clear 🗑️
- Others see your strokes in real-time
- Get +15 points when someone guesses correctly

**If you're guessing:**
- See hint letters reveal over time (e.g. `_ய_ ன்`)
- Type your guess in Tamil, Tanglish, or English
- ✅ **Correct** (exact/near-exact) → +points (100 base + time bonus)
- 🔥 **Close** (almost!) → See private hint
- No timer penalty, try as many times as you want until you guess correctly
- First correct guesser gets the most points

### Scoring

- **Guesser**: 100 pts (base) + time bonus (up to 50) = 150 max
- **Drawer**: +15 pts per guess
- **Time bonus**: Early guesses get more points

---

## File Structure

```
tamil-scribble/
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Error handling
│   ├── index.css             # ALL styles (light/dark theme)
│   ├── context/              # State management
│   │   ├── GameContext.jsx   # Game state + networking
│   │   └── ThemeContext.jsx  # Light/Dark toggle
│   ├── components/           # React components
│   │   ├── Home.jsx
│   │   ├── Lobby.jsx
│   │   ├── Game.jsx
│   │   ├── DrawCanvas.jsx
│   │   ├── GuessPanel.jsx
│   │   ├── WordDisplay.jsx
│   │   ├── PlayerList.jsx
│   │   ├── TimerBar.jsx
│   │   ├── GameEnd.jsx
│   │   └── ... (others)
│   └── lib/
│       ├── peerManager.js    # WebRTC wrapper
│       ├── gameEngine.js     # Game logic (host only)
│       ├── fuzzyMatch.js     # Guess matching
│       └── words.js          # 150+ Tamil words
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## Key Technical Details

### Architecture: P2P WebRTC

```
Host's Browser              Client's Browser
  ├─ GameEngine             └─ React State
  ├─ Game State              (synced via P2P)
  ├─ Canvas
  └─ React UI
        ↕ WebRTC (PeerJS)
```

**No backend server.** Game runs entirely in browsers.
- Host = "game master" (runs GameEngine)
- Clients = "players" (receive state updates)
- All communication is peer-to-peer via WebRTC

### How Guess Matching Works

When you type `"udai"` to match `"குடை"` (umbrella):

1. **Normalize**: Both → lowercase, trim, remove punctuation
2. **Exact match?** No
3. **Prefix match?** No (udai is not start of kudai)
4. **Fuzzy match (Fuse.js)?**
   - Find closest match in corpus (kudai, kodai, umbrella, etc)
   - Fuse score for "udai" vs "kudai" = 0.99 confidence (1 char edit)
   - BUT: "udai" is missing the 'k' at the START → **leading-char drop penalty**
   - Apply: 0.99 × 0.70 = 0.69 confidence
   - Result: **Close** (🔥 "almost!") NOT correct

**Why this matters:**
- "udai" ≈ "kudai" (umbrella) — user almost got it → encouragement
- Not "correct" because they actually typed the wrong word → keeps game honest
- Shows 🔥 emoji + private message: `"udai — கிட்டத்தட்ட!"` (almost!)

### Static Hints (All Players See Same)

Tamil word `"வண்ணத்துப்பூச்சி"` (butterfly, 9 grapheme clusters):

1. **At start**: `_ _ _ _ _ _ _ _ _` (all hidden)
2. **At 60% time left**: `_ ண் _ _ _ _ _ _ _` (1 hint revealed)
3. **At 40% time left**: `_ ண் _ _ த் _ _ _ _` (2 hints)
4. **At 20% time left**: `வ ண் _ _ த் _ _ சி _` (4 hints)

All players see **exactly the same hints** because they're computed once when drawer picks the word, not recomputed each second (old bug: hints changed every tick, showing random chars).

### Floating Point Scoring

- **Confidence** ranges from 0 to 1.0
- Correct: confidence ≥ 0.80
- Close: 0.50 ≤ confidence < 0.80
- Wrong: confidence < 0.50

---

## Troubleshooting

### "Cannot connect to room"

**Problem**: WebRTC needs STUN/TURN servers to punch through NAT.

**Fixes**:
1. Try refreshing both tabs
2. Check if running in **same network** (same WiFi)
3. For GitHub Codespace: Both players MUST use the **same forwarded URL** (not localhost)
4. Optional: Add TURN credentials in `src/lib/peerManager.js` (see SETUP.md)

### "Canvas is blank but opponent sees drawing"

**Problem**: Host canvas not clearing between rounds, or canvas render is stale.

**Fixed**: Engine explicitly broadcasts `DRAW_CLEAR` at start of each round.

**If still broken**: 
- Check browser console for errors
- Try force-refresh (Ctrl+Shift+R)
- Clear localStorage: `localStorage.clear()`

### "Hints showing broken Tamil characters (ண்ண )"

**Problem**: Tamil vowel signs (matras) were getting separated from consonants.

**Fixed**: `splitTamilGraphemes()` now groups consonant + vowel sign as single unit.

### "Game stuck in 'choosing' phase"

**Problem**: Drawer didn't pick word, auto-pick timeout might have failed.

**Auto-pick**: System auto-picks first word after 15 seconds.

**Manual fix**: 
- If drawer is you: Word choice overlay should appear
- If drawer is someone else: Wait 15s or ask them to click

### "Score not updating"

**Problem**: GameEngine only runs on host. If host's browser crashes, game dies.

**Solution**: Host should use reliable browser tab (avoid closing mid-game).

---

## Customization

### Add More Words

Edit `src/lib/words.js`:

```javascript
{
  id: 'your-word-id',
  tamil: 'தமிழ்சொல்',
  tanglish: ['transliteration1', 'transliteration2'],
  english: 'English meaning',
  category: 'animals',  // animals, food, objects, nature, body
  difficulty: 'easy',   // easy, medium, hard
}
```

### Change Colors

Edit `src/index.css` — search for `[data-theme="light"]`:

```css
[data-theme="light"] {
  --bg-root: #f0f4f8;      /* Background */
  --accent: #2563eb;       /* Buttons, highlights */
  --text-primary: #1e293b; /* Main text */
  /* ... etc */
}
```

### Change Draw Time / Rounds

Settings are in Lobby. Also editable in `src/lib/gameEngine.js` defaults.

---

## Deployment

### GitHub Pages (Recommended)

```bash
git push origin main
# Auto-deploys via GitHub Actions → https://USERNAME.github.io/tamil-scribble/
```

### Self-Hosted (Nginx)

```bash
npm run build
# Upload dist/ to your server
# Set up SPA routing (all 404s → index.html)
```

### Docker

```bash
docker build -t tamil-scribble .
docker run -p 80:3000 tamil-scribble
```

---

## Security & Privacy

✅ **No backend server** — your game data never leaves your browser  
✅ **No login required** — room code is the "password"  
✅ **No tracking** — no analytics, no ads  
✅ **Open source** — audit the code yourself  

**Optional**: Add Cloudflare Worker relay to protect PeerJS signaling (see SECURITY.md).

---

## Mobile Support

Works great on mobile! 📱

- Touch drawing (just like any drawing app)
- Auto-responsive layout
- No special app needed (web browser works)
- 4G/5G or WiFi recommended for smooth P2P

---

## Contributing

Found a bug? Have an idea?

1. Open an issue on GitHub
2. Include device/browser + steps to reproduce
3. Pull requests welcome!

---

## License

**MIT** — Free to use, modify, share.

Made with ❤️ for Tamil learners worldwide.

---

## FAQ

**Q: Can I play offline?**  
A: No. Requires internet for WebRTC (even though it's P2P).

**Q: Can I save game replays?**  
A: Not built-in. Could add recording feature later.

**Q: Will hints work for non-Tamil players?**  
A: Yes! Guessing in English works too. Hints just show Tamil graphemes.

**Q: What if host disconnects?**  
A: Game ends. Host is critical. We could improve this in future.

**Q: Can I play on 2 tabs in same browser?**  
A: Not recommended. P2P might get confused. Use different devices/browsers.

---

## Support

- 📖 Full README: See `README.md`
- 🛠️ Setup guide: See `SETUP.md`
- 🔒 Security: See `SECURITY.md`
- 💻 Want to deploy? See `package.json` for commands

Enjoy! 🎉
