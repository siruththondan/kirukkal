/**
 * peerManager.js
 * Low-level WebRTC wrapper using PeerJS
 *
 * Architecture:
 * - Host mode: creates peer with random ID (= room code), listens for connections
 * - Client mode: creates peer, connects to host's peer ID
 * - All game data flows browser-to-browser after initial signaling handshake
 */

import Peer from 'peerjs';

let peer = null;
let connections = {}; // host only: { peerId: DataConnection }
let hostConn = null;  // client only: DataConnection to host
let _isHost = false;

// Event handlers (set by GameContext)
const handlers = {
  onMessage: null,
  onPlayerLeave: null,
  onHostLeave: null,
  onError: null,
};

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  },
  debug: 0,
};

// Register event handlers
export function setHandlers(h) {
  Object.assign(handlers, h);
}

function setupIncomingConnection(conn) {
  conn.on('open', () => {
    connections[conn.peer] = conn;

    conn.on('data', (data) => {
      handlers.onMessage?.({ from: conn.peer, ...data });
    });

    conn.on('close', () => {
      delete connections[conn.peer];
      handlers.onPlayerLeave?.(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('Connection error:', err);
      delete connections[conn.peer];
      handlers.onPlayerLeave?.(conn.peer);
    });
  });
}

/**
 * Create a room as host
 * @returns {Promise<string>} This peer's ID (= room code)
 */
export function createRoom() {
  return new Promise((resolve, reject) => {
    _isHost = true;
    peer = new Peer(PEER_CONFIG);

    peer.on('open', (id) => {
      resolve(id);
    });

    peer.on('connection', (conn) => {
      setupIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        reject(new Error('Room ID conflict, please try again.'));
      } else {
        handlers.onError?.(err.message || 'Connection error');
        reject(err);
      }
    });

    peer.on('disconnected', () => {
      // Try to reconnect
      setTimeout(() => {
        if (peer && !peer.destroyed) {
          peer.reconnect();
        }
      }, 2000);
    });
  });
}

/**
 * Join an existing room as client
 * @param {string} roomCode - Host's peer ID
 * @returns {Promise<string>} My peer ID
 */
export function joinRoom(roomCode) {
  return new Promise((resolve, reject) => {
    _isHost = false;
    peer = new Peer(PEER_CONFIG);

    let didResolve = false;
    let connectTimeout = null;

    peer.on('open', (myId) => {
      hostConn = peer.connect(roomCode, {
        reliable: true,
        serialization: 'json',
      });

      connectTimeout = setTimeout(() => {
        if (!didResolve) {
          reject(new Error('Connection timed out. Is the room code correct?'));
        }
      }, 10000);

      hostConn.on('open', () => {
        clearTimeout(connectTimeout);
        didResolve = true;
        hostConn.on('data', (data) => {
          handlers.onMessage?.({ from: roomCode, ...data });
        });
        hostConn.on('close', () => {
          handlers.onHostLeave?.();
        });
        hostConn.on('error', (err) => {
          console.warn('Host conn error:', err);
          handlers.onHostLeave?.();
        });
        resolve(myId);
      });

      hostConn.on('error', (err) => {
        clearTimeout(connectTimeout);
        reject(new Error('Could not connect to room. Check the code!'));
      });
    });

    peer.on('error', (err) => {
      clearTimeout(connectTimeout);
      if (err.type === 'peer-unavailable') {
        reject(new Error('Room not found. Check the room code!'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Host: broadcast to all connected clients
 * @param {object} data
 * @param {string|null} excludeId - peer ID to skip (e.g. the sender)
 */
export function broadcast(data, excludeId = null) {
  Object.entries(connections).forEach(([id, conn]) => {
    if (id !== excludeId && conn.open) {
      try { conn.send(data); } catch (e) { console.warn('Send error:', e); }
    }
  });
}

/**
 * Host: send to a specific peer
 */
export function sendTo(peerId, data) {
  const conn = connections[peerId];
  if (conn?.open) {
    try { conn.send(data); } catch (e) { console.warn('Send error:', e); }
  }
}

/**
 * Client: send message to host
 */
export function sendToHost(data) {
  if (hostConn?.open) {
    try { hostConn.send(data); } catch (e) { console.warn('Send error:', e); }
  }
}

export function getMyId() { return peer?.id ?? null; }
export function isHost() { return _isHost; }
export function getConnectedPeerIds() { return Object.keys(connections); }
export function getPeerCount() { return Object.keys(connections).length; }

export function destroy() {
  try {
    if (peer && !peer.destroyed) peer.destroy();
  } catch (e) {}
  peer = null;
  connections = {};
  hostConn = null;
  _isHost = false;
}
