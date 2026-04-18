# 🔒 Tamil Scribble — Security Setup Guide

## Architecture Overview

```
Player Browser  ──[WebRTC handshake]──►  Cloudflare Worker (our relay)
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Rate Limit (60/hr)  │
                                         │  Bot UA Block        │
                                         │  CORS Enforcement    │
                                         └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  PeerJS Public       │
                                         │  Signaling Server    │
                                         └─────────────────────┘
                                                    │
                          ◄──────[P2P Game Data]────┘
             (After handshake, ALL traffic is direct P2P — relay is idle)
```

---

## Step 1 — Deploy the Cloudflare Worker

```bash
cd cloudflare-worker
npm install -g wrangler
wrangler login           # opens browser to authenticate
```

Edit `relay.js` — change line 17:
```js
'https://YOUR-USERNAME.github.io',  // ← your actual GitHub Pages URL
```

Deploy:
```bash
wrangler deploy
# Output: https://tamil-scribble-relay.YOUR-SUBDOMAIN.workers.dev
```

---

## Step 2 — Point the Game at Your Worker

In `src/lib/peerManager.js`, update `PEER_CONFIG`:

```js
const PEER_CONFIG = {
  host:   'tamil-scribble-relay.YOUR-SUBDOMAIN.workers.dev',
  port:   443,
  secure: true,
  path:   '/peerjs',  // adjust if your Worker routes differently
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  },
  debug: 0,
};
```

---

## Step 3 — Cloudflare WAF Rules (Free Plan)

Go to: **Cloudflare Dashboard → Your Domain → Security → WAF → Custom Rules**

### Rule 1: Block non-browser access to Worker
```
(http.request.uri.path contains "/peerjs" and not http.user_agent contains "Mozilla")
→ Action: BLOCK
```

### Rule 2: Rate limit Room creation
```
Field: URI Path  | contains: /peerjs/id
Field: IP Rate:  | 30 requests per minute
→ Action: MANAGED CHALLENGE
```

### Rule 3: Block known bad countries/IPs (optional)
```
(ip.geoip.country in {"CN" "RU" "KP"} and not cf.threat_score lt 10)
→ Action: MANAGED CHALLENGE
```

### Rule 4: Block high threat score
```
(cf.threat_score gt 30)
→ Action: BLOCK
```

---

## Step 4 — Cloudflare Bot Fight Mode

Dashboard → **Security → Bots → Bot Fight Mode → ON**

This blocks:
- Automated scanners
- DDoS bots
- Credential stuffing bots

---

## Step 5 — Cloudflare Rate Limiting (Free: 10k req/month)

Dashboard → **Security → WAF → Rate Limiting Rules**

```
When: Requests to  /peerjs/*
From: Same IP
Exceed: 100 requests per 10 minutes
Then: Block for 1 hour
```

---

## What Cloudflare Already Protects You From (Auto)

| Threat | Cloudflare Protection |
|--------|----------------------|
| DDoS L3/L4 | ✅ Always-on, unlimited |
| DDoS L7 (HTTP flood) | ✅ Free plan covers most attacks |
| IP Spoofing | ✅ Anycast network |
| SSL/TLS stripping | ✅ Full encryption enforced |
| Port scanning | ✅ Cloudflare proxies all traffic |
| Origin IP exposure | ✅ Worker hides your origin |
| Bot traffic | ✅ Bot Fight Mode |

---

## What the Worker Adds On Top

| Protection | How |
|-----------|-----|
| CORS lockdown | Only your GitHub Pages URL accepted |
| IP Rate Limiting | 60 connections/IP/hour (in-memory) |
| Bot UA blocking | Blocks curl, python, scrapers by User-Agent |
| Origin masking | PeerJS server never sees real player IPs |
| Request logging | Cloudflare Workers analytics built-in |

---

## Game-Level Security (Already in Code)

- **Room codes = random PeerJS UUIDs** — not guessable
- **Host controls all game state** — clients can't fake scores
- **No database** — nothing to breach
- **No auth tokens** — nothing to steal
- **STUN only, no TURN** — no relay traffic on your infra

---

## Upgrading Rate Limiting to KV (Persistent)

The current Worker uses in-memory rate limiting (resets when Worker recycles).
For persistent limits across all Worker instances:

1. Create a KV namespace: `wrangler kv:namespace create "RATE_LIMITS"`
2. Uncomment the `[[kv_namespaces]]` section in `wrangler.toml`
3. Replace in `relay.js`:

```js
// Replace isRateLimited() with:
async function isRateLimitedKV(ip, env) {
  const key = `rl:${ip}`;
  const now = Date.now();
  const raw = await env.RATE_LIMITS.get(key, 'json');

  if (!raw || now - raw.start > RATE_LIMIT_WINDOW_MS) {
    await env.RATE_LIMITS.put(key, JSON.stringify({ count: 1, start: now }), { expirationTtl: 3600 });
    return false;
  }
  if (raw.count >= RATE_LIMIT_MAX) return true;
  await env.RATE_LIMITS.put(key, JSON.stringify({ count: raw.count + 1, start: raw.start }), { expirationTtl: 3600 });
  return false;
}
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| Cloudflare DDoS/WAF | Free |
| Cloudflare Workers (100k req/day) | Free |
| PeerJS Signaling | Free |
| **Total** | **$0/month** |
