# 🎨 Tamil Scribble — Multiplayer Drawing & Guessing Game

## Overview 

**Tamil Scribble** is a real-time, serverless multiplayer game where players take turns drawing Tamil words while others guess in Tamil, Tanglish, or English.

- **Pure P2P**: No game server. Host's browser = game engine. Uses WebRTC.
- **Fuzzy Matching**: "udai" ≠ exact match for "குடை", but shows 🔥 "almost!"
- **Static Hints**: Hints revealed at deterministic times — all players see identical hints.
- **2 Themes**: Light (default) and Dark with instant switching.
- **Cloudflare Protected**: Optional security layer to protect the PeerJS signaling relay.

---

## Architecture Explained

```
Player A (Host)                  Player B (Client)              Player C (Client)
    Browser                          Browser                        Browser
       │                                │                               │
       ├─ GameEngine                     │                               │
       │  (runs here only)               │                               │
       │                                 │                               │
       ├─ Canvas (draws)                 ├─ Canvas (draws)              ├─ Canvas (reads)
       │                                 │                               │
       └─ React State                    └─ React State                 └─ React State
           (game, round, etc)                (synced via P2P)             (synced via P2P)
             │                                │                               │
             └──────────────────────────────────────────────────────────────
                                    P2P WebRTC
                              (via PeerJS library)
```

### Key Flows

#### 1. **Creating a Room** (Host)
```
Host clicks "Create Room"
  ↓
peerManager.createRoom()  ← Uses PeerJS to create peer with random ID
  ↓
GameEngine initialized   ← Game state machine (runs ONLY in host browser)
  ↓
Host added as first player
  ↓
Room code = Host's PeerJS ID (e.g. "k7mp2x")
  ↓
Host sees "Room created. Code: k7mp2x"
```

#### 2. **Joining a Room** (Client)
```
Client enters code "k7mp2x" + name
  ↓
peerManager.joinRoom("k7mp2x")  ← Connects to host's peer ID via PeerJS
  ↓
WebRTC handshake  ← Browser↔browser negotiation (STUN/TURN)
  ↓
pm.sendToHost({ type: 'JOIN', name })  ← Client announces itself
  ↓
Host receives JOIN → GameEngine.addPlayer(clientId, name)
  ↓
Host broadcasts updated STATE to all  ← Includes all player names/scores
  ↓
Clients receive STATE → React updates (now they see the new player)
```

#### 3. **Game Flow** (Drawing Round)
```
HOST (GameEngine)                           CLIENTS (React)
  │
  ├─ startGame({ rounds: 3, ... })
  │    └─ Pick first drawer (player A)
  │
  ├─ startRound()
  │    ├─ Clear canvas for everyone
  │    ├─ Set phase = 'choosing'
  │    ├─ Pick 3 word choices
  │    └─ Send WORD_CHOICES to drawer A
  │                                           Drawer A receives → shows overlay
  │                                           Other players → see "Drawer choosing..."
  │
  ├─ [Drawer A picks word]
  │
  ├─ drawerPickedWord()
  │    ├─ Phase = 'drawing'
  │    ├─ buildStaticHints()  ← Compute ONCE which graphemes to reveal & when
  │    ├─ Start timer (counts down)
  │    └─ broadcast(ROUND_START)
  │                                           All see: "A is drawing, 4 graphemes"
  │                                           Hint chars: ['_', '_', '_', '_']
  │
  ├─ Timer ticks every 1s
  │    ├─ timeLeft--
  │    ├─ applyHints(chars, revealOrder, thresholds, timeLeft)
  │    │   └─ Returns: ['_', 'ய', '_', 'ன'] (1 revealed based on time)
  │    └─ broadcast(TIMER_TICK, {timeLeft, hintChars})
  │                                           All see: Updated hint chars
  │
  ├─ [Client B guesses "udai"]
  │    └─ pm.sendToHost({ type: 'GUESS', text: 'udai' })
  │
  ├─ HOST receives GUESS message
  │    ├─ checkGuess('udai', word)
  │    │   ├─ Normalize: "udai"
  │    │   ├─ Fuse.js fuzzy: conf = 0.99 (1 edit from "kudai")
  │    │   ├─ But: leading char dropped ("k" missing from start)
  │    │   ├─ Apply penalty: conf *= 0.70 → 0.69
  │    │   └─ Return: {isMatch:false, isClose:true, conf:0.69}
  │    │
  │    └─ handleGuess: isClose=true
  │         └─ broadcast(WRONG_GUESS, {isClose:true, text:"udai"})
  │                                       Client B sees: 🔥 "udai — கிட்டத்தட்ட!"
  │
  ├─ [Client C guesses "kudai"]
  │    ├─ checkGuess('kudai', word)
  │    │   └─ Exact match → {isMatch:true, conf:1.0}
  │    │
  │    └─ handleGuess: isMatch=true
  │         ├─ Player C score += 100 points
  │         ├─ Drawer A score += 15 points
  │         ├─ Mark C as hasGuessed
  │         ├─ broadcast(CORRECT_GUESS)
  │         └─ broadcast(STATE)
  │                                       All see: "C got it! +100 points"
  │                                       Canvas continues drawing...
  │
  └─ When timeLeft = 0 or all guessed
       ├─ endRound()
       ├─ Show word reveal
       ├─ Wait 5 seconds
       └─ startRound() again (next drawer)
```

#### 4. **Drawing Sync** (P2P, Host Relays)
```
DRAWER (Host or Client)
  │
  ├─ Moves pen → onPointerMove event
  │    ├─ Draw locally on canvas
  │    ├─ Batch strokes with requestAnimationFrame (RAF)
  │    ├─ After 16ms of RAF: flush to sendStroke()
  │    │    └─ If host: broadcast({type:'DRAW_STROKE', stroke: [seg1, seg2, ...]})
  │    │    └─ If client: pm.sendToHost({type:'STROKE', stroke: [...]})
  │    │
  │    └─ HOST receives STROKE → broadcast to non-drawers
  │
  ├─ Remote players receive DRAW_STROKE
  │    ├─ subscribeToStrokes callback fires
  │    └─ drawSeg/drawDot on their canvas
  │         (they see drawer's strokes in real-time)
  │
  └─ Clear button
       ├─ sendClearCanvas()
       ├─ HOST broadcasts DRAW_CLEAR
       └─ All receive → clear their canvas
```

---

## Project Structure

```
tamil-scribble/
├── index.html                  # Entry HTML (light theme default)
├── package.json                # Dependencies
├── vite.config.js              # Build config (GitHub Pages path)
├── tailwind.config.js          # Tailwind setup
├── postcss.config.js           # PostCSS (Tailwind compiler)
├── .gitignore
├── README.md                   # This file
├── SETUP.md                    # Deployment guide
├── SECURITY.md                 # Cloudflare Worker setup
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Root app component (error handling)
│   ├── index.css               # ALL styles (3-theme, no Tailwind imports)
│   │
│   ├── context/
│   │   ├── GameContext.jsx     # Game state machine (useGame hook)
│   │   └── ThemeContext.jsx    # Theme toggle (useTheme hook)
│   │
│   ├── components/
│   │   ├── Home.jsx            # Landing (create/join)
│   │   ├── Lobby.jsx           # Waiting room (settings)
│   │   ├── Game.jsx            # Main game layout
│   │   ├── DrawCanvas.jsx      # Canvas (12 colors, 4 sizes, tools)
│   │   ├── GuessPanel.jsx      # Chat + input (drawer word choice overlay)
│   │   ├── WordDisplay.jsx     # Hint letters + word reveal
│   │   ├── PlayerList.jsx      # Scoreboard (desktop only)
│   │   ├── TimerBar.jsx        # Countdown (color-coded)
│   │   ├── CorrectGuessOverlay.jsx  # 🎉 flash on correct
│   │   ├── GameEnd.jsx         # Winner screen + confetti
│   │   ├── ThemeSwitcher.jsx   # Light/Dark toggle
│   │   └── Decorations.jsx     # Stubs (palm leaf removed)
│   │
│   └── lib/
│       ├── peerManager.js      # WebRTC wrapper (PeerJS)
│       ├── gameEngine.js       # Game state (HOST ONLY)
│       ├── fuzzyMatch.js       # Guess matching (with leading-char penalty)
│       └── words.js            # 150+ Tamil words + categories
│
├── public/
│   ├── 404.html                # GitHub Pages SPA redirect
│   └── favicon.svg
│
└── .github/
    └── workflows/
        └── deploy.yml          # Auto-deploy to GitHub Pages

```

---

## How Each Component Works

### **GameContext.jsx** (The Brain)

This is the **central state machine** that connects P2P networking to React.

**State (useGame hook returns):**
- `phase`: 'lobby' | 'choosing' | 'drawing' | 'roundEnd' | 'gameEnd'
- `players`: array of {id, name, score, isDrawing, hasGuessed, color}
- `timeLeft`, `hintChars`, `messages`, etc.
- `myWord`, `wordChoices` (drawer only)

**Actions:**
- `createRoom(name)` → Initializes GameEngine, becomes host
- `joinRoom(roomCode, name)` → Connects to host, sends JOIN message
- `sendGuess(text)` → If host: calls engine.handleGuess; if client: sends to host
- `sendStroke(data)` → Batches via RAF, broadcasts/sends to host
- `subscribeToStrokes(fn)` → Canvas registers to receive remote strokes
- `subscribeToClear(fn)` → Canvas registers to receive clear commands

**Message Router (handleMessage):**
Receives ALL peer messages and dispatches:
- `STATE` → Full state sync from host
- `TIMER_TICK` → Timer update
- `ROUND_START`, `ROUND_END`, `GAME_END` → Phase changes
- `CORRECT_GUESS`, `WRONG_GUESS` → Guess feedback
- `DRAW_STROKE`, `DRAW_CLEAR` → Canvas updates
- `JOIN`, `GUESS`, `STROKE`, etc. (host only) → Delegates to GameEngine

### **GameEngine.js** (The Game Logic)

Runs **ONLY** in the host's browser. Implements the game state machine.

**Key Methods:**
- `startGame(settings)` → Initialize rounds + players
- `startRound()` → Pick drawer, clear canvas, show word choices
- `drawerPickedWord(word)` → Start drawing phase, build static hints, start timer
- `_startTimer()` → Countdown (1s ticks), apply hints, check win condition
- `handleGuess(peerId, text)` → Run checkGuess(), update scores
- `handleDrawStroke(fromPeerId, stroke)` → Relay strokes only from drawer
- `_endRound()` → Reveal word, next drawer
- `_endGame()` → Show leaderboard

**Broadcasting:**
- `_broadcastState()` → Sends full public state to all clients every frame
- `_addMsg()` → Chat message (system/correct/wrong)
- Individual `broadcast()` calls for strokes, timers, etc.

### **fuzzyMatch.js** (The Judge)

Determines if a guess is **correct**, **close** ("almost!"), or **wrong**.

**Algorithm (3-tier):**
1. **Exact match** on any variant (Tamil, English, Tanglish)
2. **Prefix match** if input covers ≥80% of candidate AND ≤1 char difference
3. **Fuse.js fuzzy**:
   - Confidence ≥ 0.80 AND length ratio ≥ 0.80 → **correct** (isMatch=true)
   - BUT if the missing characters are at the START (leading drop), apply 0.70 penalty
     - "udai" vs "kudai" → Fuse conf=0.99 → 0.99×0.70=0.69 → **close** (isClose=true)
   - Confidence ≥ 0.50 → **close** (shows 🔥)
   - Else → **wrong**

**Static Hints:**
- `buildStaticHints(word, drawTime)` → Called once when word is picked
  - Splits word into grapheme clusters (e.g. "குடை" → ["கு", "டை"])
  - Picks ~40% of graphemes to reveal (deterministic shuffle using word as seed)
  - Creates reveal thresholds (times at which hints unlock)
  - Returns {chars, revealOrder, thresholds}
- `applyHints(chars, revealOrder, thresholds, timeLeft)` → Called every timer tick
  - Returns same-length array: "_" for hidden, grapheme for revealed
  - All clients get identical result because they use identical metadata

### **peerManager.js** (The Network)

Wraps PeerJS WebRTC library.

**Host Flow:**
```javascript
createRoom() 
  → new Peer(PEER_CONFIG)
  → generateLowercaseRoomCode() 
  → Peer ID = "k7mp2x"
  → Listen on peer.on('connection', conn => ...)
  → Return "k7mp2x" as room code
```

**Client Flow:**
```javascript
joinRoom(roomCode)
  → new Peer(PEER_CONFIG)  // gets random ID
  → peer.connect(roomCode) // connect to host's ID
  → WebRTC negotiation (ICE candidates via STUN/TURN)
  → Data channel opens
  → Return client's random ID
```

**Rate Limiting (in GameContext):**
- Both host & client call `setHandlers()` once on connection
- Messages bubble up to GameContext via `handleMessage()`
- No authentication — room code is the "password"

### **DrawCanvas.jsx** (The Canvas)

HTML5 canvas with tools: pen, eraser, fill, clear.

**Pointer Flow:**
1. `onPointerDown` → Start drawing, show dot
2. `onPointerMove` → Draw line segment (60fps)
3. `onPointerUp` → Stop drawing

**Batching (RAF):**
```javascript
const pendingRef = useRef([]);  // collect strokes
const rafRef = useRef(null);    // animation frame ID

sendStroke(stroke) {
  pendingRef.current.push(stroke);
  if (!rafRef.current) {
    rafRef.current = requestAnimationFrame(flushStrokes);
  }
}

flushStrokes() {
  // Sends ~60 strokes/sec in one batch → 1 message/frame
  pm.broadcast({ type: 'DRAW_STROKE', stroke: [...] });
}
```

**Remote Rendering:**
```javascript
useEffect(() => {
  const unsub = subscribeToStrokes((raw) => {
    // raw = { type: 'SEG', fx, fy, tx, ty, color, width }
    // or { type: 'DOT', x, y, color, width }
    // or { type: 'FILL', x, y, color }
    // Apply to canvas
  });
  return unsub;
}, [subscribeToStrokes]);
```

**Clear Sync:**
```javascript
subscribeToClear(clearCanvas)  // Subscribe to DRAW_CLEAR messages
sendClearCanvas()              // Broadcast to all
```

### **GuessPanel.jsx** (The Chat)

Messages (4 types):
- **system**: Center-aligned pill (join notifications)
- **correct**: Green with 🎉 emoji
- **close**: Amber with 🔥 emoji (user's personal "almost" message)
- **guess**: Regular message (name: text)

**Word Choice Overlay:**
- Shows when `amDrawing && phase === 'choosing' && wordChoices`
- Blocks interaction with guess input below
- Calls `pickWord(selectedWord)` → Triggers `drawerPickedWord()` on host

### **ThemeContext.jsx** (The Styling)

Lightweight theme switcher using CSS variables.

```javascript
const [theme, setTheme] = useState(() => localStorage.getItem('ts-theme') || 'light');

// Apply to <html>
document.documentElement.setAttribute('data-theme', 'light' | 'dark');
```

**CSS:**
```css
:root, [data-theme="light"] { --bg-root: #f0f4f8; --text-primary: #1e293b; ... }
[data-theme="dark"]         { --bg-root: #0f172a; --text-primary: #e2e8f0; ... }
```

All components use `var(--bg-card)`, `var(--accent)`, etc. → Switch themes instantly.

---

## Bug Fixes Applied

| Issue | Root Cause | Fix |
|---|---|---|
| "udai" matches "குடை" as correct | Fuse.js 1-char edit scored too high | Added leading-char-drop penalty: conf × 0.70 if first char missing |
| Timer stuck on host | `broadcastState()` called every 1s, overwrites timeLeft | Use `onStateUpdate()` directly for timer, not `broadcastState()` |
| Host canvas blank on first turn | myWord not set for host | Engine calls `onHostWord(word, null)` for host drawer |
| Canvas not cleared between rounds | No DRAW_CLEAR sent at startRound | Send broadcast(DRAW_CLEAR) explicitly |
| Non-drawer could draw | No validation in handleDrawStroke | Check `player.isDrawing` before relaying |
| Hints showed split Tamil chars | No grapheme clustering | Use `Intl.Segmenter` + manual fallback |
| Hints changed every second | Hints recomputed fresh each timer tick | Compute once at startRound, apply deterministically |
| Room codes uppercase (broken PeerJS) | UUID used as room code | Generate 6-char lowercase alphanumeric, never .toUpperCase() |
| Palm leaf theme confusing UI | Was occupying 1/3 of theme options | Removed entirely, stubs only |
| CorrectGuessOverlay invisible in light mode | Hardcoded dark RGBA values | Use CSS variable --bg-card |
| GameEnd showing at wrong times | No phase guard | Add if (phase !== 'gameEnd') return null |

---

## Security Notes

**P2P Security:**
- Room code = PeerJS peer ID (impossible to guess, ~36 bits entropy)
- No auth tokens — connection is the auth
- Can optionally add Cloudflare Worker relay (see SECURITY.md)

**No Backend:**
- Game state never leaves the host's browser
- No database = no data breaches
- No API keys = no exposure risk

**Rate Limiting (Optional Cloudflare):**
- Protect PeerJS signaling from bot abuse
- Block non-browser User-Agents
- Limit 60 new rooms/IP/hour

---

## Deployment

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:5173/
```

### GitHub Pages (Production)
1. Create public repo named `tamil-scribble`
2. In `.github/workflows/deploy.yml`, set `VITE_BASE_PATH=/tamil-scribble/`
3. Enable GitHub Pages source: Actions
4. `git push` → auto-deploys in 2 min
5. Live at: `https://USERNAME.github.io/tamil-scribble/`

### Codespace (Development)
```bash
npm install
npm run dev
# Port 5173 forwarded automatically
# Get public URL from VS Code PORTS panel
# Share with friends (both use same forwarded URL for P2P to work)
```

---

## Future Improvements

- [ ] Persistent leaderboard (optional backend)
- [ ] Elo ranking system
- [ ] Voice chat (Twilio)
- [ ] Custom word lists per game
- [ ] Drawing undo/redo
- [ ] Spectator mode (read-only)
- [ ] Mobile app (React Native)
- [ ] Language translations (Hindi, Kannada, etc)

---

## License

MIT — Free to use, modify, share.

**Made with ❤️ for Tamil language learners everywhere.**

