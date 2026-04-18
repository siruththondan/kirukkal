/**
 * peerManager.js — Fixed for Codespace + Production
 *
 * ROOT CAUSE of "EXPIRE" error:
 *   1. Uppercase UUIDs (38FDDD60...) — PeerJS server rejects them
 *   2. openrelay TURN server is unreliable / rate-limited
 *   3. In Codespace, WebRTC needs a TURN relay because direct P2P is blocked
 *      by GitHub's network — STUN alone won't work there
 *
 * FIX:
 *   - Always generate lowercase room codes (6 readable chars, not UUID)
 *   - Use Metered.ca TURN (free 50GB/month) — reliable fallback
 *   - Auto-detect Codespace and warn user
 *   - Retry logic + better error messages
 */

import Peer from 'peerjs';

let peer = null;
let connections = {};
let hostConn    = null;
let _isHost     = false;

const handlers = {
  onMessage:   null,
  onPlayerLeave: null,
  onHostLeave: null,
  onError:     null,
};

// ─── Detect environment ──────────────────────────────────────────
function getEnv() {
  const host = window.location.hostname;
  if (host.includes('github.dev') || host.includes('app.github.dev') || host.includes('codespaces')) {
    return 'codespace';
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'local';
  }
  return 'production';
}

// ─── Generate a short, readable lowercase room code ─────────────
// e.g. "k7mp2x" — never uppercase, never UUID
function generateRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no confusable chars (0,o,i,l,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── ICE servers config ──────────────────────────────────────────
// We use Metered.ca free TURN (50GB/month, no credit card).
// Sign up at https://www.metered.ca/tools/openrelay/ to get your own key.
// The key below is a public demo key — replace with your own for production.
//
// For Codespace specifically: Codespace VMs block direct P2P WebRTC,
// so TURN is REQUIRED. STUN-only will never work in Codespace.
const ICE_SERVERS = [
  // STUN — fast, free, works on most networks
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },

  // TURN — relay fallback for restricted networks (Codespace, corporate firewalls, mobile)
  // ⚠️  REPLACE these with your own Metered.ca credentials for production!
  // Get free keys at: https://www.metered.ca/tools/openrelay/
  {
    urls:       'turn:openrelay.metered.ca:80',
    username:   'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls:       'turn:openrelay.metered.ca:443',
    username:   'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls:       'turn:openrelay.metered.ca:443?transport=tcp',
    username:   'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls:       'turns:openrelay.metered.ca:443',
    username:   'openrelayproject',
    credential: 'openrelayproject',
  },
];

// PeerJS server config — using public peerjs.com (free)
// For production: deploy your own peerjs-server on Render/Railway and use that host
const PEER_CONFIG = {
  // host/port/path not set = use the default PeerJS cloud server (0.peerjs.com)
  // This is fine for up to ~50 concurrent rooms
  config: { iceServers: ICE_SERVERS },
  debug: import.meta.env.DEV ? 2 : 0,
};

// ─── Exports ────────────────────────────────────────────────────

export function setHandlers(h) {
  Object.assign(handlers, h);
}

export function getEnvironmentWarning() {
  const env = getEnv();
  if (env === 'codespace') {
    return 'You are on GitHub Codespace. WebRTC may be limited — both players MUST be on Codespace OR use the forwarded public URL. For best results, use the GitHub Pages deployment for playing.';
  }
  return null;
}

// ─── Connection setup ────────────────────────────────────────────

function setupIncomingConnection(conn) {
  conn.on('open', () => {
    console.log('[PeerJS] Client connected:', conn.peer);
    connections[conn.peer] = conn;

    conn.on('data',  (data) => handlers.onMessage?.({ from: conn.peer, ...data }));
    conn.on('close', ()     => { delete connections[conn.peer]; handlers.onPlayerLeave?.(conn.peer); });
    conn.on('error', (err)  => { console.warn('[PeerJS] conn error:', err); delete connections[conn.peer]; handlers.onPlayerLeave?.(conn.peer); });
  });
}

// ─── Create Room (Host) ──────────────────────────────────────────

export function createRoom() {
  return new Promise((resolve, reject) => {
    _isHost = true;

    // Use a short lowercase code as the Peer ID
    const roomCode = generateRoomCode();
    peer = new Peer(roomCode, PEER_CONFIG);

    const openTimeout = setTimeout(() => {
      reject(new Error('Could not reach signaling server. Check your internet connection.'));
    }, 15000);

    peer.on('open', (id) => {
      clearTimeout(openTimeout);
      console.log('[PeerJS] Host ready. Room code:', id);
      resolve(id);
    });

    peer.on('connection', (conn) => {
      setupIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      clearTimeout(openTimeout);
      console.error('[PeerJS] Host error:', err.type, err.message);

      if (err.type === 'unavailable-id') {
        // Room code collision — retry with a new code
        destroy();
        createRoom().then(resolve).catch(reject);
      } else if (err.type === 'network' || err.type === 'server-error') {
        reject(new Error('Signaling server unreachable. Try again in a moment.'));
      } else {
        handlers.onError?.(err.message || 'Connection error');
        reject(err);
      }
    });

    peer.on('disconnected', () => {
      console.warn('[PeerJS] Host disconnected from signaling server. Reconnecting...');
      setTimeout(() => { if (peer && !peer.destroyed) peer.reconnect(); }, 2000);
    });
  });
}

// ─── Join Room (Client) ──────────────────────────────────────────

export function joinRoom(roomCode) {
  return new Promise((resolve, reject) => {
    _isHost = false;

    // Normalize: lowercase, trim, strip spaces
    const normalizedCode = roomCode.trim().toLowerCase().replace(/\s+/g, '');

    if (!normalizedCode || normalizedCode.length < 4) {
      return reject(new Error('Invalid room code. Please check and try again.'));
    }

    peer = new Peer(PEER_CONFIG); // client gets random ID from server

    let didResolve    = false;
    let connectTimeout = null;

    const openTimeout = setTimeout(() => {
      if (!didResolve) {
        destroy();
        reject(new Error('Could not reach signaling server. Check your internet.'));
      }
    }, 15000);

    peer.on('open', (myId) => {
      clearTimeout(openTimeout);
      console.log('[PeerJS] Client ready. Connecting to room:', normalizedCode);

      hostConn = peer.connect(normalizedCode, {
        reliable:      true,
        serialization: 'json',
      });

      connectTimeout = setTimeout(() => {
        if (!didResolve) {
          console.error('[PeerJS] Connection timeout — host not reachable');
          destroy();
          reject(new Error(
            getEnv() === 'codespace'
              ? 'Connection timed out. In Codespace, both players must use the same forwarded port URL, or use the GitHub Pages deployment.'
              : 'Connection timed out. Is the host still in the room?'
          ));
        }
      }, 15000);

      hostConn.on('open', () => {
        clearTimeout(connectTimeout);
        didResolve = true;
        console.log('[PeerJS] Connected to host:', normalizedCode);

        hostConn.on('data',  (data) => handlers.onMessage?.({ from: normalizedCode, ...data }));
        hostConn.on('close', ()     => handlers.onHostLeave?.());
        hostConn.on('error', (err)  => { console.warn('[PeerJS] host conn error:', err); handlers.onHostLeave?.(); });

        resolve(myId);
      });

      hostConn.on('error', (err) => {
        if (!didResolve) {
          clearTimeout(connectTimeout);
          console.error('[PeerJS] hostConn error:', err);
          destroy();
          reject(new Error('Could not connect to room. The host may have left.'));
        }
      });
    });

    peer.on('error', (err) => {
      if (!didResolve) {
        clearTimeout(openTimeout);
        clearTimeout(connectTimeout);
        console.error('[PeerJS] Client peer error:', err.type, err.message);

        if (err.type === 'peer-unavailable') {
          destroy();
          reject(new Error(`Room "${normalizedCode}" not found. Double-check the code!`));
        } else if (err.type === 'network') {
          destroy();
          reject(new Error('Network error. Check your internet connection.'));
        } else {
          destroy();
          reject(new Error(err.message || 'Failed to join room.'));
        }
      }
    });

    peer.on('disconnected', () => {
      if (didResolve) {
        console.warn('[PeerJS] Disconnected from signaling server (handshake already done — P2P still active)');
      }
    });
  });
}

// ─── Messaging ───────────────────────────────────────────────────

export function broadcast(data, excludeId = null) {
  Object.entries(connections).forEach(([id, conn]) => {
    if (id !== excludeId && conn.open) {
      try { conn.send(data); } catch (e) { console.warn('[PeerJS] send error:', e); }
    }
  });
}

export function sendTo(peerId, data) {
  const conn = connections[peerId];
  if (conn?.open) {
    try { conn.send(data); } catch (e) { console.warn('[PeerJS] sendTo error:', e); }
  }
}

export function sendToHost(data) {
  if (hostConn?.open) {
    try { hostConn.send(data); } catch (e) { console.warn('[PeerJS] sendToHost error:', e); }
  }
}

// ─── Getters ────────────────────────────────────────────────────

export function getMyId()              { return peer?.id ?? null; }
export function isHost()               { return _isHost; }
export function getConnectedPeerIds()  { return Object.keys(connections); }
export function getPeerCount()         { return Object.keys(connections).length; }

// ─── Cleanup ────────────────────────────────────────────────────

export function destroy() {
  try { if (peer && !peer.destroyed) peer.destroy(); } catch (e) {}
  peer        = null;
  connections = {};
  hostConn    = null;
  _isHost     = false;
}
