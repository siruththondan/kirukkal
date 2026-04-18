# 🏗️ Tamil Scribble — Complete Architecture Explanation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser-Based Architecture                   │
└─────────────────────────────────────────────────────────────────┘

          Host Player                    Client Player(s)
        ┌──────────────┐               ┌──────────────────┐
        │   Browser    │               │    Browser       │
        ├──────────────┤               ├──────────────────┤
        │              │               │                  │
        │ ┌──────────┐ │               │ ┌──────────────┐ │
        │ │ GameEngine│ │               │ │  React UI    │ │
        │ │ (Host)    │ │               │ │ (Client)     │ │
        │ └──────────┘ │               │ └──────────────┘ │
        │      │       │               │        │         │
        │      ├────────────────────────────────┤         │
        │      │   WebRTC P2P (PeerJS)          │         │
        │      └────────────────────────────────┘         │
        │                                                  │
        │ Broadcasting:                Broadcasting:      │
        │  - STATE                     - GameContext      │
        │  - DRAW_STROKE               - subscribeStrokes │
        │  - TIMER_TICK                - subscribeClear   │
        │  - GUESS results                                │
        │                                                  │
        └──────────────┘               └──────────────────┘
```

---

## Core Concepts

### 1. **One-To-Many Architecture**

- **Host** (first player): GameEngine runs only here
- **Clients** (other players): React UI only, no game logic

All clients **trust host's decisions**. No validation needed client-side.

### 2. **State Flow**

```
GameEngine State          P2P Network           Client State
(HOST ONLY)               (Broadcast)           (CLIENTS)
    │
    ├─ phase              ─────────────────────→ phase
    ├─ players            ─────────────────────→ players  
    ├─ timeLeft           ─────────────────────→ timeLeft
    ├─ hintChars          ─────────────────────→ hintChars
    ├─ currentWord        ✗ NEVER sent          currentWord
    ├─ round              ─────────────────────→ round
    └─ messages           ─────────────────────→ messages
```

**Key rule**: `currentWord` (the answer) is **never sent** to clients.

### 3. **Message Types**

| Message | From | To | Purpose |
|---------|------|-----|---------|
| `JOIN` | Client | Host | Player connected |
| `GUESS` | Client | Host | Player made guess |
| `STROKE` | Client | Host | Drawing data (relayed to others) |
| `PICK_WORD` | Client | Host | Drawer picked word from choices |
| `STATE` | Host | All | Full game state sync |
| `TIMER_TICK` | Host | All | Time update + hint chars |
| `DRAW_STROKE` | Host | All | Canvas data to draw |
| `ROUND_START` | Host | All | Drawing phase started |
| `CORRECT_GUESS` | Host | All | Someone got it right |
| `GAME_END` | Host | All | Game finished |

---

## Detailed Component Flows

### A. Creating & Joining a Room

```
┌─────────────────────────────────┐        ┌─────────────────────┐
│ Host Clicks "Create Room"       │        │ Client Joins Room   │
└────────────┬────────────────────┘        └─────────┬───────────┘
             │                                       │
             ├─ peerManager.createRoom()             ├─ peerManager.joinRoom(code)
             │  └─ new Peer(config)                  │  └─ new Peer(config)
             │                                       │     └─ peer.connect(code)
             │  └─ Gets random ID                    │        └─ WebRTC handshake
             │     (e.g. 'abc123def456')             │           (STUN/TURN)
             │                                       │
             ├─ generateRoomCode()                   ├─ Returns own peer ID
             │  └─ Returns 6-char code               │
             │     e.g. 'k7mp2x'                     ├─ pm.sendToHost({type:'JOIN'})
             │                                       │
             ├─ GameEngine initialized               ├─ GameContext receives
             │  └─ addPlayer(hostId, name)           │  └─ Updates React state
             │                                       │     (add self to players)
             └─ React shows "Room ready: k7mp2x"    └─ React shows "Joined!"
```

### B. Game Lifecycle

```
startGame()
  │
  ├─ Reset: round=1, drawerIndex=0, scores=0
  ├─ Create drawerQueue: [player1, player2, player3]
  └─ startRound()
       │
       ├─ Pick drawer: drawerQueue[drawerIndex % length]
       ├─ Phase = 'choosing'
       ├─ Clear canvas: broadcast(DRAW_CLEAR)
       ├─ Pick 3 word choices: getRandomWords(category, 3, difficulty)
       ├─ Send to drawer: pm.sendTo(drawerId, {type:'WORD_CHOICES', choices})
       │
       └─ [Drawer picks word]
            │
            ├─ drawerPickedWord(word)
            │  ├─ Phase = 'drawing'
            │  ├─ buildStaticHints(word)
            │  │  ├─ Split word into grapheme clusters
            │  │  ├─ Pick ~40% to reveal
            │  │  ├─ Create reveal times/thresholds
            │  │  └─ Return {chars, revealOrder, thresholds}
            │  │
            │  ├─ startTimer()
            │  │  └─ Every 1s:
            │  │     ├─ timeLeft--
            │  │     ├─ applyHints(chars, revealOrder, thresholds, timeLeft)
            │  │     ├─ broadcast(TIMER_TICK, {timeLeft, hintChars})
            │  │     └─ onStateUpdate({timeLeft, hintChars})
            │  │
            │  └─ broadcast(ROUND_START, {drawerId, wordLength})
            │
            └─ [Players guess or time runs out]
                 │
                 ├─ handleGuess(peerId, text)
                 │  ├─ checkGuess(text, word)
                 │  │  ├─ Normalize
                 │  │  ├─ Try exact match
                 │  │  ├─ Try prefix match
                 │  │  └─ Try Fuse.js fuzzy + penalty
                 │  │
                 │  ├─ if isMatch:
                 │  │  ├─ Award points
                 │  │  ├─ broadcast(CORRECT_GUESS)
                 │  │  └─ checkAllGuessed()
                 │  │
                 │  └─ else if isClose:
                 │     └─ broadcast(WRONG_GUESS, {isClose:true})
                 │
                 └─ When all guessed OR timeLeft=0:
                      │
                      ├─ endRound()
                      │  ├─ Phase = 'roundEnd'
                      │  ├─ Show word reveal
                      │  └─ Wait 5s
                      │
                      ├─ drawerIndex++
                      ├─ if drawerIndex >= drawerQueue.length:
                      │  ├─ drawerIndex = 0
                      │  └─ round++
                      │
                      └─ if round > maxRounds:
                           └─ endGame()
                              ├─ Phase = 'gameEnd'
                              └─ broadcast(GAME_END, scores)
```

### C. Guess Matching Algorithm

```
User types: "udai"
Target: "குடை" (umbrella)

checkGuess("udai", word)
│
├─ normalize("udai") → "udai"
├─ normalize("குடை") → "குடை"
│
├─ Exact match? No
│
├─ buildCorpus(word) → ["குடை", "umbrella", "kudai", "kodai", ...]
│
├─ Exact match on corpus? 
│  └─ No
│
├─ Prefix match?
│  ├─ "kudai".startsWith("udai")? No
│  ├─ "udai".startsWith("kudai")? No
│  └─ No match
│
├─ Fuse.js Fuzzy Match
│  ├─ Items = corpus.map(t => ({text:t}))
│  ├─ fuse.search("udai")
│  ├─ Results:
│  │  [{text:"kudai", score:0.01, conf:0.99}, ...]
│  │
│  └─ best = {text:"kudai", conf:0.99}
│
├─ Apply Length Penalty
│  ├─ lenRatio = 4/5 = 0.8
│  ├─ isLeadingDrop? YES (missing 'k' at start)
│  ├─ effectiveConf = 0.99 × 0.70 = 0.69
│  │
│  └─ Decision tree:
│     ├─ if conf >= 0.80: CORRECT
│     ├─ else if conf >= 0.50: CLOSE (show 🔥)
│     └─ else: WRONG
│
└─ Return: {isMatch:false, isClose:true, confidence:0.69}
   └─ Show private message: "🔥 udai — கிட்டத்தட்ட!"
```

### D. Drawing Sync (Real-Time Canvas)

```
Drawer Mouse Move:
  │
  ├─ getPos(event, canvas)
  │  └─ Convert client coords to canvas coords (0-1 ratio)
  │
  ├─ drawSegment(ctx, from, to, color, width)
  │  └─ Draw locally immediately (instant feedback)
  │
  ├─ sendStroke({type:'SEG', fx, fy, tx, ty, color, width})
  │  ├─ Push to pendingRef array
  │  └─ Schedule RAF flush
  │     └─ After ~16ms: sendToHost/broadcast all pending strokes
  │
  └─ Remote Clients:
     ├─ subscribeToStrokes callback fires
     │  └─ Called with raw stroke data (or array)
     │
     ├─ Render locally:
     │  ├─ Convert back to canvas coords (multiply by canvas.width/height)
     │  └─ drawSegment(ctx, from, to, color, width)
     │
     └─ All see same drawing (input latency ~50-200ms on home wifi)
```

### E. Static Hints (Deterministic Reveal)

```
Word: "வண்ணத்துப்பூச்சி" (butterfly, 9 graphemes)

buildStaticHints("வண்ணத்துப்பூச்சி", 80)
│
├─ Split into graphemes:
│  └─ ["வ", "ண்", "ண", "த்", "து", "ப்", "பூ", "ச்", "சி"]
│
├─ hintCount = floor(9 * 0.4) = 3 (reveal ~40%)
│
├─ Build thresholds (reveal times):
│  ├─ threshold[0] = 80 * 0.60 = 48s (when this fires: show 1st hint)
│  ├─ threshold[1] = 80 * 0.30 = 24s (when this fires: show 2nd hint)
│  └─ threshold[2] = 80 * 0.00 = 0s  (when this fires: show 3rd hint)
│
├─ Pick which indices reveal:
│  ├─ Available = [1,2,3,4,5,6,7,8] (never reveal 0 = first char)
│  ├─ Shuffle deterministically using word.charCodes as seed
│  └─ revealOrder = [4, 8, 2] (these indices get revealed)
│
└─ Return: {chars:["வ",...,"சி"], revealOrder:[4,8,2], thresholds:[48,24,0]}

Every Timer Tick:
│
├─ timeLeft--
│
├─ applyHints(chars, revealOrder, thresholds, timeLeft)
│  │
│  ├─ revealed = new Set()
│  ├─ for each (threshold, idx) in thresholds:
│  │  └─ if timeLeft <= threshold:
│  │     └─ revealed.add(revealOrder[idx])
│  │
│  └─ return chars.map((ch, i) => revealed.has(i) ? ch : '_')
│
└─ broadcast(TIMER_TICK, {timeLeft, hintChars})

Timeline (timeLeft decreasing from 80):
│
├─ 80→48s: hintChars = ["_","_","_","_","_","_","_","_","_"]
├─ 48→24s: hintChars = ["_","_","_","_","து","_","_","_","_"]
├─ 24→0s:  hintChars = ["_","_","_","_","து","_","_","_","சி"]
└─ 0s:     hintChars = ["_","_","ண","_","து","_","_","_","சி"]

ALL CLIENTS GET SAME HINTS because:
  ✓ Same word = same grapheme split
  ✓ Same seed = same shuffle
  ✓ Same thresholds = same reveal times
  ✓ Computed ONCE, not recomputed each tick
```

---

## React Context Hooks

### useGame() — Game State & Actions

```javascript
const {
  // Identity
  myId, myName, isHost, roomCode, appPhase,
  
  // Game state
  phase, players, round, maxRounds, timeLeft, hintChars, messages,
  drawerPeerId, drawerName, myWord, wordChoices,
  
  // UI
  amDrawing, error, connecting, correctGuessEvent, roundEndWord,
  
  // Actions
  createRoom, joinRoom, startGame,
  sendGuess, pickWord,
  sendStroke, sendClearCanvas,
  subscribeToStrokes, subscribeToClear,
  resetGame,
} = useGame();
```

### useTheme() — Theme Toggle

```javascript
const { theme, setTheme, themes } = useTheme();
// theme = 'light' | 'dark'
// setTheme('dark') → save to localStorage + apply [data-theme]
// themes = [{id:'light',...}, {id:'dark',...}]
```

---

## Key Bug Fixes & Why

| Bug | Why It Happened | How It's Fixed |
|-----|-----------------|-----------------|
| "udai" matches "குடை" | Fuse.js scores 1-char edit very high (0.99) | Leading-char penalty: ×0.70 if first char missing |
| Timer stuck on host | `broadcastState()` called every 1s, overwrites `timeLeft` | Use `onStateUpdate()` directly for timer, not `broadcastState()` |
| Host canvas blank | `myWord` not set when host is drawer | Engine calls `onHostWord(word, null)` with word |
| Canvas not cleared | No `DRAW_CLEAR` broadcast at round start | Send broadcast(DRAW_CLEAR) explicitly in startRound() |
| Non-drawer could draw | No validation in relay | Check `player.isDrawing` before relaying strokes |
| Hints showing `ण்ண` | Tamil vowel signs separated from consonants | Use `Intl.Segmenter` to group grapheme clusters |
| Random hints every tick | Hints recomputed fresh each timer tick (wasteful) | Compute once at startRound, apply deterministically |
| Room code broken | UUID used as code, PeerJS rejects uppercase | Generate 6-char lowercase alphanumeric |
| Light mode invisible | Hardcoded dark RGBA in CorrectGuessOverlay | Use CSS variable `var(--bg-card)` |
| GameEnd showing wrong | No phase guard | Add `if (phase !== 'gameEnd') return null` |
| `RoundEndWord` persisting | Not cleared on new turn start | Clear when phase → 'choosing'/'drawing' |

---

## Performance Notes

### Canvas Batching (RAF)

Strokes sent ~60/sec in batches, not one per pixel-move:

```javascript
// Bad (old):
onPointerMove() {
  sendStroke(stroke);  // 1 message per move = hundreds/sec
}

// Good (current):
pendingRef = [];
onPointerMove() {
  pendingRef.push(stroke);
  if (!rafRef) rafRef = requestAnimationFrame(flush);
}
flush() {
  pm.broadcast({stroke: pendingRef});  // 1 message per 16ms
  pendingRef = [];
}
```

Result: **~60 messages/sec** instead of **~300 messages/sec**.

### Hint Computation (Once vs Every Tick)

**Bad (old):**
```javascript
startTimer() {
  setInterval(() => {
    hintChars = generateHint(word, timeLeft, drawTime);  // Recompute every 1s
    broadcast({hintChars});
  }, 1000);
}
```

**Good (current):**
```javascript
drawerPickedWord(word) {
  hintMeta = buildStaticHints(word, drawTime);  // Compute ONCE
  applyHints() once, store result;
}
startTimer() {
  setInterval(() => {
    hintChars = applyHints(hintMeta, timeLeft);  // Just apply, don't recompute
    broadcast({hintChars});
  }, 1000);
}
```

Result: Identical output, **lower CPU** on host.

### State Broadcast Separation

Don't send full state every 1s:

```javascript
// Bad (old):
startTimer() {
  setInterval(() => {
    timeLeft--;
    broadcastState();  // Sends everything: players, messages, etc
  }, 1000);
}

// Good (current):
startTimer() {
  setInterval(() => {
    timeLeft--;
    broadcast({type:'TIMER_TICK', timeLeft, hintChars});  // 50 bytes
    onStateUpdate({timeLeft, hintChars});  // React update only
  }, 1000);
}
```

Result: **50 bytes/sec** instead of **500+ bytes/sec**.

---

## Deployment Architecture

### Local Dev
```
http://localhost:5173
├─ Vite dev server
├─ Hot reload
└─ CORS: all origins allowed
```

### GitHub Pages (Production)
```
https://USERNAME.github.io/tamil-scribble/
├─ dist/ served as static files
├─ .github/workflows/deploy.yml
│  └─ npm run build → git push → auto-deploy
├─ 404.html → index.html (SPA routing)
└─ No backend, no server costs
```

### Codespace (Development)
```
GitHub Codespace VM
├─ npm install && npm run dev
├─ Port 5173 forwarded
├─ Both players must use SAME forwarded URL
└─ WebRTC works inside container (STUN/TURN via peerjs.com)
```

---

## Future Improvements

1. **Elo Ranking** — Persistent leaderboard (optional backend)
2. **Spectator Mode** — Watch-only players
3. **Drawing Undo/Redo** — Per-stroke
4. **Voice Chat** — Twilio integration
5. **Custom Words** — User-defined lists
6. **Replay System** — Record & playback rounds
7. **Multi-Language** — Hindi, Kannada, Telugu, etc.
8. **Mobile App** — React Native for iOS/Android

---

## Questions?

- **How does WebRTC work?** See peerManager.js comments
- **Why P2P?** No server = no costs, no data storage, instant
- **Can I cheat?** Host validates guesses, sends word only at end
- **What if host crashes?** Game ends. Could improve with "host rotation" in future.
- **How much bandwidth?** ~1KB/sec per player (drawing + timer updates)

