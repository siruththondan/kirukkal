m a# 🎨 Tamil Scribble — Complete Setup Guide

## ═══════════════════════════════
## ROOT CAUSE OF "EXPIRE" ERROR
## ═══════════════════════════════

The error you saw happened because:

1. **Uppercase UUID as room code** — PeerJS signaling server (`0.peerjs.com`) rejects
   peer IDs containing uppercase letters. The old code used `crypto.randomUUID()` which
   generates `38FDDD60-D81D-49CE-ABC6-FC3C8745A24A` — that's why it expired immediately.
   **Fixed:** Room codes are now 6 lowercase chars like `k7mp2x`.

2. **Codespace blocks direct P2P** — GitHub Codespace VMs sit behind NAT that blocks
   WebRTC peer-to-peer data channels. STUN alone can't punch through it.
   **Fixed:** Added working TURN relay servers as fallback.

3. **openrelay TURN was throttled** — The old config used a single overloaded relay.
   **Fixed:** Multiple TURN endpoints now with TCP fallback.

---

## ═══════════════════════
## OPTION A: CODESPACE DEV
## ═══════════════════════

### Step 1 — Open the project in Codespace

```
github.com → Your Repo → Code → Codespaces → Create codespace on main
```

### Step 2 — Install and run

```bash
npm install
npm run dev
```

Vite will start on port 5173. Codespace auto-forwards it.

### Step 3 — Get the public URL

In VS Code bottom panel → **PORTS** tab → find port 5173 →
right-click → **Port Visibility → Public** (IMPORTANT!)

Copy the URL — it looks like:
`https://laughing-eureka-x56rwrv66xjj3p-5173.app.github.dev/`

### Step 4 — Both players use the SAME forwarded URL

⚠️ **Critical for Codespace:** Both the host AND the joining player must open
the **exact same forwarded URL** (the `app.github.dev` one).

If you open `localhost:5173` on one machine and the forwarded URL on another,
WebRTC will fail because the signaling goes through different origins.

### Step 5 — Share room code

Room codes are now short: **`k7mp2x`** style — easy to type on mobile.
The input auto-lowercases so capitalization doesn't matter.

### Codespace Limitations

| Feature | Codespace | Production |
|---------|-----------|------------|
| Creating rooms | ✅ Works | ✅ Works |
| Joining rooms (same forwarded URL) | ✅ Works | ✅ Works |
| Joining from mobile | ⚠️ Share the forwarded URL | ✅ Works |
| Joining from a different computer | ⚠️ Both must use forwarded URL | ✅ Works |
| Canvas drawing sync | ✅ Works via TURN relay | ✅ Works |

---

## ═══════════════════════════
## OPTION B: GITHUB PAGES (PRODUCTION)
## ═══════════════════════════

This is the recommended way for actual play sessions with friends.

### Step 1 — Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `tamil-scribble` (or anything you want)
3. Set it **Public**
4. Click **Create repository**

### Step 2 — Update your repo name in 2 places

**File 1: `vite.config.js`** (only needed for local builds)
```js
const basePath = process.env.VITE_BASE_PATH ?? '/tamil-scribble/';
//                                               ↑ change to your repo name
```

**File 2: `.github/workflows/deploy.yml`**
```yaml
run: VITE_BASE_PATH=/tamil-scribble/ npm run build
#                   ↑ change to /YOUR-REPO-NAME/
```

### Step 3 — Enable GitHub Pages

Repo → **Settings** → **Pages** → Source: **GitHub Actions** → Save

### Step 4 — Push the code

```bash
cd tamil-scribble
git init
git add .
git commit -m "🎨 Tamil Scribble initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tamil-scribble.git
git push -u origin main
```

### Step 5 — Wait ~2 minutes

GitHub Actions builds and deploys automatically.
Watch progress: Repo → **Actions** tab.

Your game is live at:
```
https://YOUR-USERNAME.github.io/tamil-scribble/
```

### Step 6 — Play!

1. Host opens the URL → enters name → **அறை உருவாக்கு**
2. Gets a 6-char code like `k7mp2x`
3. Share that code with friends (WhatsApp, etc.)
4. Friends open the same URL → **அறையில் சேர்** → paste code

---

## ═══════════════════════════════
## OPTION C: LOCAL NETWORK PLAY
## ═══════════════════════════════

```bash
npm run dev -- --host
```

Everyone on the same WiFi opens: `http://YOUR-LOCAL-IP:5173/`
(No base path needed for local dev)

---

## ═══════════════════════════
## TURN SERVER SETUP (RECOMMENDED FOR PRODUCTION)
## ═══════════════════════════

The default TURN server (`openrelay.metered.ca`) is a **public demo server**
shared by everyone. For a proper game, get your own free credentials.

### Get Free Metered.ca TURN Credentials

1. Go to [metered.ca/tools/openrelay](https://www.metered.ca/tools/openrelay/)
2. Sign up free (no credit card) — get 50GB/month bandwidth
3. Get your API key from the dashboard

### Update peerManager.js

Replace the ICE_SERVERS section:

```js
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls:       'turn:YOUR-SUBDOMAIN.relay.metered.ca:80',
    username:   'YOUR-USERNAME',
    credential: 'YOUR-CREDENTIAL',
  },
  {
    urls:       'turn:YOUR-SUBDOMAIN.relay.metered.ca:443',
    username:   'YOUR-USERNAME',
    credential: 'YOUR-CREDENTIAL',
  },
  {
    urls:       'turns:YOUR-SUBDOMAIN.relay.metered.ca:443',
    username:   'YOUR-USERNAME',
    credential: 'YOUR-CREDENTIAL',
  },
];
```

### Use Environment Variables (SECURE — don't commit credentials!)

Add to `vite.config.js` define:
```js
define: {
  global: 'globalThis',
  'import.meta.env.TURN_USER': JSON.stringify(process.env.TURN_USER || ''),
  'import.meta.env.TURN_CRED': JSON.stringify(process.env.TURN_CRED || ''),
},
```

Add GitHub Actions secrets:
```
Repo → Settings → Secrets → Actions → New secret
  TURN_USER = your-metered-username
  TURN_CRED = your-metered-credential
```

Update deploy.yml:
```yaml
- name: Build
  env:
    TURN_USER: ${{ secrets.TURN_USER }}
    TURN_CRED: ${{ secrets.TURN_CRED }}
  run: VITE_BASE_PATH=/tamil-scribble/ npm run build
```

---

## ═══════════════════════
## DEBUGGING CHECKLIST
## ═══════════════════════

### Can create room but can't join?

1. **Check room code** — copy-paste exactly, it's 6 lowercase letters/numbers
2. **Same signaling server?** — both players must be on the same URL origin
3. **Codespace?** — both must use the forwarded `app.github.dev` URL (not localhost)
4. **Firewall?** — corporate/school networks block WebRTC. Use TURN or a different network.
5. **Console logs** — open DevTools → Console → look for `[PeerJS]` lines

### Room code says "not found"?

The host may have:
- Closed their browser tab
- Been disconnected for >60 seconds (PeerJS expires inactive peers)
- Had a network error

Solution: Host creates a new room and shares the new code.

### Drawing lag / disconnects?

- STUN found a direct path but it's slow → TURN relay will auto-kick in
- If on mobile data, TURN relay is more reliable
- Canvas strokes are batched per animation frame, so brief lag is normal

### "Signaling server unreachable"?

- Check internet connection
- `0.peerjs.com` (the free signaling server) may be temporarily down
- Retry after a moment — it auto-reconnects

---

## ═══════════════════════
## PROJECT FILE STRUCTURE
## ═══════════════════════

```
tamil-scribble/
├── src/
│   ├── lib/
│   │   ├── peerManager.js    ← WebRTC (THIS IS WHAT WAS FIXED)
│   │   ├── gameEngine.js     ← Game logic (host only)
│   │   ├── fuzzyMatch.js     ← Tamil/Tanglish matching
│   │   └── words.js          ← 150+ Tamil word bank
│   ├── context/
│   │   ├── GameContext.jsx   ← All React state
│   │   └── ThemeContext.jsx  ← 3-theme system
│   └── components/
│       ├── Home.jsx          ← Landing + create/join
│       ├── Lobby.jsx         ← Waiting room
│       ├── Game.jsx          ← Main game layout
│       ├── DrawCanvas.jsx    ← Drawing board
│       ├── GuessPanel.jsx    ← Chat + guesses
│       ├── ThemeSwitcher.jsx ← 🌙/☀️/🌿 switcher
│       └── Decorations.jsx   ← Palm leaf SVGs
├── cloudflare-worker/
│   ├── relay.js              ← Protected signaling proxy
│   └── wrangler.toml
├── .github/workflows/
│   └── deploy.yml            ← Auto-deploy to GitHub Pages
├── SETUP.md                  ← This file
└── SECURITY.md               ← Security guide
```
