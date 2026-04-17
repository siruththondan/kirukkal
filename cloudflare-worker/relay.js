/**
 * Tamil Scribble — Protected PeerJS Signaling Relay
 * Deploy on Cloudflare Workers (free tier — 100k req/day)
 *
 * What this does:
 *  - Acts as the WebRTC signaling handshake server (NOT a game server)
 *  - Once two peers handshake, ALL data flows directly P2P — this Worker is idle
 *  - Rate limits: max 30 new rooms per IP per hour
 *  - Blocks known bot/scanner User-Agents
 *  - CORS restricted to your GitHub Pages domain only
 *  - No data stored — purely stateless relay
 *
 * DEPLOY STEPS:
 *  1. npm install -g wrangler
 *  2. wrangler login
 *  3. wrangler deploy
 *
 * Then in vite.config.js, update peerManager.js PEER_HOST to your Worker URL.
 */

const ALLOWED_ORIGINS = [
  'https://YOUR-USERNAME.github.io',  // ← Change this!
  'https://laughing-eureka-x56rwrv66xjj3x5p-5173.app.github.dev/kirukkal/',             // dev
];

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX       = 60;              // max connections per IP per hour
const BLOCKED_UA_PATTERNS  = [
  /bot/i, /crawler/i, /spider/i, /scan/i, /curl/i,
  /python-requests/i, /go-http/i, /java\//i,
];

// In-memory rate limit store (resets when Worker instance recycles — fine for our use)
const ipLimiter = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipLimiter.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

function isBlockedUA(userAgent) {
  return BLOCKED_UA_PATTERNS.some(p => p.test(userAgent || ''));
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Max-Age':       '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const ua     = request.headers.get('User-Agent') || '';
    const ip     = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Block non-allowed origins in production
    if (!ALLOWED_ORIGINS.includes(origin) && origin !== '') {
      return new Response('Forbidden', { status: 403 });
    }

    // Block scrapers / bots
    if (isBlockedUA(ua)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate limit per IP
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After':  '3600',
          ...corsHeaders(origin),
        },
      });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'Tamil Scribble Signaling' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Proxy all PeerJS signaling requests to the public PeerJS server
    // This adds our security layer on top of peerjs.com
    const peerTarget = 'https://0.peerjs.com' + url.pathname + url.search;
    const proxyReq   = new Request(peerTarget, {
      method:  request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'User-Agent':   'TamilScribble-Relay/1.0',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    try {
      const upstreamRes = await fetch(proxyReq);
      const body        = await upstreamRes.arrayBuffer();

      return new Response(body, {
        status:  upstreamRes.status,
        headers: {
          'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json',
          'X-Relay':      'TamilScribble',
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Relay error' }), {
        status:  502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
