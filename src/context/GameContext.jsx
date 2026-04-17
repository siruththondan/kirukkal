/**
 * GameContext.jsx
 * Central state management for the entire game.
 * Bridges React UI ↔ PeerManager ↔ GameEngine.
 */

import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import * as pm from '../lib/peerManager';
import { GameEngine } from '../lib/gameEngine';

// ─── Initial State ──────────────────────────────────────────────

const INITIAL_STATE = {
  // App navigation
  appPhase: 'home', // home | lobby | game

  // My identity
  myId: null,
  myName: '',
  isHost: false,
  roomCode: null,

  // Game state (synced from host)
  phase: 'lobby',        // lobby | choosing | drawing | roundEnd | gameEnd
  players: [],
  round: 1,
  maxRounds: 3,
  drawTime: 80,
  timeLeft: 80,
  drawerPeerId: null,
  drawerName: null,
  wordLength: 0,
  hintChars: [],
  messages: [],

  // Host-only extras
  myWord: null,          // Full word object (only when I'm the drawer & host sends it)
  wordChoices: null,     // Array of 3 word choices (for drawer to pick)

  // UI state
  error: null,
  connecting: false,
  roundEndWord: null,    // revealed word at end of round
  correctGuessEvent: null, // flash for correct guess
};

// ─── Reducer ────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTING': return { ...state, connecting: action.value, error: null };
    case 'SET_ERROR': return { ...state, error: action.error, connecting: false };
    case 'CLEAR_ERROR': return { ...state, error: null };

    case 'ROOM_CREATED':
      return { ...state, appPhase: 'lobby', myId: action.myId, isHost: true, roomCode: action.roomCode, myName: action.name, connecting: false };
    case 'ROOM_JOINED':
      return { ...state, appPhase: 'lobby', myId: action.myId, isHost: false, roomCode: action.roomCode, myName: action.name, connecting: false };

    case 'SYNC_STATE': {
      const gs = action.gameState;
      const newState = {
        ...state,
        phase: gs.phase ?? state.phase,
        players: gs.players ?? state.players,
        round: gs.round ?? state.round,
        maxRounds: gs.maxRounds ?? state.maxRounds,
        drawTime: gs.drawTime ?? state.drawTime,
        timeLeft: gs.timeLeft ?? state.timeLeft,
        drawerPeerId: gs.drawerPeerId ?? state.drawerPeerId,
        drawerName: gs.drawerName ?? state.drawerName,
        wordLength: gs.wordLength ?? state.wordLength,
        hintChars: gs.hintChars ?? state.hintChars,
        messages: gs.messages ?? state.messages,
      };
      // Go to game screen when phase changes from lobby
      if (gs.phase && gs.phase !== 'lobby' && state.appPhase === 'lobby') {
        newState.appPhase = 'game';
      }
      return newState;
    }

    case 'TIMER_TICK':
      return { ...state, timeLeft: action.timeLeft, hintChars: action.hintChars };

    case 'SET_MY_WORD':
      return { ...state, myWord: action.word };

    case 'SET_WORD_CHOICES':
      return { ...state, wordChoices: action.choices };

    case 'CLEAR_WORD_CHOICES':
      return { ...state, wordChoices: null };

    case 'ROUND_END':
      return { ...state, roundEndWord: action.word, phase: 'roundEnd', myWord: null, wordChoices: null };

    case 'GAME_END':
      return { ...state, phase: 'gameEnd' };

    case 'ADD_MESSAGE': {
      const messages = [...state.messages.slice(-49), action.message];
      return { ...state, messages };
    }

    case 'CORRECT_GUESS_EVENT':
      return { ...state, correctGuessEvent: action.event };

    case 'CLEAR_CORRECT_GUESS':
      return { ...state, correctGuessEvent: null };

    case 'RESET':
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const engineRef = useRef(null);
  const strokeListenersRef = useRef([]); // canvas stroke subscribers

  // ─── Message Handler ─────────────────────────────────────────

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'STATE':
        dispatch({ type: 'SYNC_STATE', gameState: msg.state });
        break;

      case 'TIMER_TICK':
        dispatch({ type: 'TIMER_TICK', timeLeft: msg.timeLeft, hintChars: msg.hintChars });
        break;

      case 'YOUR_WORD':  // legacy, handled by WORD_CHOICES now
        dispatch({ type: 'SET_MY_WORD', word: msg.word });
        break;

      case 'WORD_CHOICES':
        dispatch({ type: 'SET_WORD_CHOICES', choices: msg.choices });
        dispatch({ type: 'SYNC_STATE', gameState: { phase: 'choosing' } });
        break;

      case 'ROUND_START':
        dispatch({ type: 'CLEAR_WORD_CHOICES' });
        dispatch({ type: 'SYNC_STATE', gameState: { phase: 'drawing', drawerPeerId: msg.drawerId, drawerName: msg.drawerName } });
        break;

      case 'ROUND_END':
        dispatch({ type: 'ROUND_END', word: msg.word });
        break;

      case 'GAME_END':
        dispatch({ type: 'GAME_END', scores: msg.scores });
        dispatch({ type: 'SYNC_STATE', gameState: { phase: 'gameEnd' } });
        break;

      case 'CORRECT_GUESS':
        dispatch({ type: 'CORRECT_GUESS_EVENT', event: msg });
        dispatch({ type: 'ADD_MESSAGE', message: {
          id: Date.now(),
          type: 'correct',
          playerName: msg.playerName,
          text: `${msg.playerName} கண்டுபிடித்தார்! +${msg.points}`,
          timestamp: Date.now(),
        }});
        setTimeout(() => dispatch({ type: 'CLEAR_CORRECT_GUESS' }), 2500);
        break;

      case 'WRONG_GUESS':
        dispatch({ type: 'ADD_MESSAGE', message: {
          id: Date.now() + Math.random(),
          type: 'guess',
          playerId: msg.playerId,
          playerName: msg.playerName,
          text: msg.text,
          color: msg.color,
          timestamp: Date.now(),
        }});
        break;

      case 'CHAT_MESSAGE':
        dispatch({ type: 'ADD_MESSAGE', message: msg.message });
        break;

      case 'DRAW_STROKE':
        strokeListenersRef.current.forEach(fn => fn(msg.stroke));
        break;

      case 'DRAW_CLEAR':
        strokeListenersRef.current.forEach(fn => fn({ type: 'CLEAR' }));
        break;

      // Host receives these from clients:
      case 'JOIN':
        if (engineRef.current) {
          engineRef.current.addPlayer(msg.from, msg.name);
        }
        break;

      case 'GUESS':
        if (engineRef.current) {
          engineRef.current.handleGuess(msg.from, msg.text);
        }
        break;

      case 'STROKE':
        if (engineRef.current) {
          engineRef.current.handleDrawStroke(msg.from, msg.stroke);
        }
        break;

      case 'CLEAR_CANVAS':
        if (engineRef.current) {
          engineRef.current.handleClearCanvas(msg.from);
        }
        break;

      case 'PICK_WORD':
        if (engineRef.current) {
          engineRef.current.drawerPickedWord(msg.from, msg.word);
        }
        break;
    }
  }, []);

  // ─── Actions ──────────────────────────────────────────────────

  const createRoom = useCallback(async (name) => {
    dispatch({ type: 'SET_CONNECTING', value: true });
    try {
      pm.setHandlers({
        onMessage: handleMessage,
        onPlayerLeave: (peerId) => {
          engineRef.current?.removePlayer(peerId);
        },
        onHostLeave: () => {
          dispatch({ type: 'SET_ERROR', error: 'Host disconnected. Game ended.' });
          dispatch({ type: 'RESET' });
        },
        onError: (msg) => dispatch({ type: 'SET_ERROR', error: msg }),
      });

      const myId = await pm.createRoom();

      // Init game engine (host only)
      engineRef.current = new GameEngine((partialState) => {
        dispatch({ type: 'SYNC_STATE', gameState: partialState });
      });

      // Add host as first player
      engineRef.current.addPlayer(myId, name);

      dispatch({ type: 'ROOM_CREATED', myId, roomCode: myId, name });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message || 'Failed to create room' });
    }
  }, [handleMessage]);

  const joinRoom = useCallback(async (roomCode, name) => {
    dispatch({ type: 'SET_CONNECTING', value: true });
    try {
      pm.setHandlers({
        onMessage: handleMessage,
        onHostLeave: () => {
          dispatch({ type: 'SET_ERROR', error: 'Host disconnected. Game ended.' });
          setTimeout(() => dispatch({ type: 'RESET' }), 3000);
        },
        onError: (msg) => dispatch({ type: 'SET_ERROR', error: msg }),
      });

      const myId = await pm.joinRoom(roomCode.trim().toUpperCase());

      // Tell host we're here
      pm.sendToHost({ type: 'JOIN', name });

      dispatch({ type: 'ROOM_JOINED', myId, roomCode, name });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message || 'Failed to join room' });
    }
  }, [handleMessage]);

  const startGame = useCallback((settings) => {
    if (engineRef.current) {
      engineRef.current.startGame(settings);
    }
  }, []);

  const sendGuess = useCallback((text) => {
    if (!text.trim()) return;
    pm.sendToHost({ type: 'GUESS', text: text.trim() });
  }, []);

  const pickWord = useCallback((word) => {
    if (pm.isHost()) {
      // Host picks their own word
      engineRef.current?.drawerPickedWord(pm.getMyId(), word);
      dispatch({ type: 'SET_MY_WORD', word });
      dispatch({ type: 'CLEAR_WORD_CHOICES' });
    } else {
      pm.sendToHost({ type: 'PICK_WORD', word });
      dispatch({ type: 'CLEAR_WORD_CHOICES' });
    }
  }, []);

  // Batch stroke sending with RAF
  const pendingStrokesRef = useRef([]);
  const rafRef = useRef(null);

  const flushStrokes = useCallback(() => {
    if (pendingStrokesRef.current.length === 0) return;
    const strokes = pendingStrokesRef.current;
    pendingStrokesRef.current = [];
    rafRef.current = null;

    if (pm.isHost()) {
      // Host relays directly
      pm.broadcast({ type: 'DRAW_STROKE', stroke: strokes.length === 1 ? strokes[0] : strokes });
    } else {
      pm.sendToHost({ type: 'STROKE', stroke: strokes.length === 1 ? strokes[0] : strokes });
    }
  }, []);

  const sendStroke = useCallback((strokeData) => {
    pendingStrokesRef.current.push(strokeData);
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushStrokes);
    }
  }, [flushStrokes]);

  const sendClearCanvas = useCallback(() => {
    if (pm.isHost()) {
      pm.broadcast({ type: 'DRAW_CLEAR' });
    } else {
      pm.sendToHost({ type: 'CLEAR_CANVAS' });
    }
  }, []);

  const subscribeToStrokes = useCallback((fn) => {
    strokeListenersRef.current.push(fn);
    return () => {
      strokeListenersRef.current = strokeListenersRef.current.filter(f => f !== fn);
    };
  }, []);

  const resetGame = useCallback(() => {
    pm.destroy();
    engineRef.current?.destroy();
    engineRef.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pm.destroy();
      engineRef.current?.destroy();
    };
  }, []);

  const amDrawing = state.drawerPeerId === state.myId;

  const value = {
    ...state,
    amDrawing,
    // Actions
    createRoom,
    joinRoom,
    startGame,
    sendGuess,
    sendStroke,
    sendClearCanvas,
    subscribeToStrokes,
    pickWord,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
