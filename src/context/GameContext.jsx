/**
 * GameContext.jsx
 * Bridges React UI ↔ PeerManager ↔ GameEngine.
 */

import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import * as pm from '../lib/peerManager';
import { GameEngine } from '../lib/gameEngine';

// ─── State ────────────────────────────────────────────────────────

const INIT = {
  appPhase:    'home',   // home | lobby | game
  myId:        null,
  myName:      '',
  isHost:      false,
  roomCode:    null,
  // Game state (synced from host)
  phase:       'lobby',  // lobby | choosing | drawing | roundEnd | gameEnd
  players:     [],
  round:       1,
  maxRounds:   3,
  drawTime:    80,
  timeLeft:    80,
  drawerPeerId: null,
  drawerName:   null,
  wordLength:   0,
  hintChars:    [],
  messages:     [],
  // Drawer-only
  myWord:       null,    // full word object when I am drawing
  wordChoices:  null,    // 3 choices during 'choosing' phase
  // UI
  error:        null,
  connecting:   false,
  roundEndWord: null,
  correctGuessEvent: null,
};

// ─── Reducer ──────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'SET_CONNECTING':
      return { ...state, connecting: action.value, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.error, connecting: false };

    case 'ROOM_CREATED':
      return { ...state, appPhase:'lobby', myId:action.myId, isHost:true,
               roomCode:action.roomCode, myName:action.name, connecting:false };

    case 'ROOM_JOINED':
      return { ...state, appPhase:'lobby', myId:action.myId, isHost:false,
               roomCode:action.roomCode, myName:action.name, connecting:false };

    case 'SYNC_STATE': {
      const gs  = action.gs;
      const next = { ...state };
      // Only overwrite defined fields (partial updates are allowed)
      if (gs.phase        !== undefined) next.phase        = gs.phase;
      if (gs.players      !== undefined) next.players      = gs.players;
      if (gs.round        !== undefined) next.round        = gs.round;
      if (gs.maxRounds    !== undefined) next.maxRounds    = gs.maxRounds;
      if (gs.drawTime     !== undefined) next.drawTime     = gs.drawTime;
      if (gs.timeLeft     !== undefined) next.timeLeft     = gs.timeLeft;
      if (gs.drawerPeerId !== undefined) next.drawerPeerId = gs.drawerPeerId;
      if (gs.drawerName   !== undefined) next.drawerName   = gs.drawerName;
      if (gs.wordLength   !== undefined) next.wordLength   = gs.wordLength;
      if (gs.hintChars    !== undefined) next.hintChars    = gs.hintChars;
      if (gs.messages     !== undefined) next.messages     = gs.messages;
      if (gs.roundEndWord !== undefined) next.roundEndWord = gs.roundEndWord;
      // Auto-navigate lobby → game
      if (gs.phase && gs.phase !== 'lobby' && state.appPhase === 'lobby') {
        next.appPhase = 'game';
      }
      // Clear roundEndWord when a new turn starts
      if (gs.phase === 'choosing' || gs.phase === 'drawing') {
        next.roundEndWord = null;
        if (gs.phase === 'choosing') next.myWord = null; // clear previous word
      }
      return next;
    }

    case 'TIMER_TICK':
      return { ...state, timeLeft:action.timeLeft, hintChars:action.hintChars };

    case 'SET_MY_WORD':
      return { ...state, myWord:action.word, wordChoices:null };

    case 'SET_WORD_CHOICES':
      return { ...state, wordChoices:action.choices, myWord:null };

    case 'CLEAR_WORD_STATE':
      return { ...state, myWord:null, wordChoices:null };

    case 'ROUND_END':
      return { ...state, phase:'roundEnd', roundEndWord:action.word, myWord:null, wordChoices:null };

    case 'ADD_MSG': {
      const messages = [...(state.messages||[]).slice(-49), action.msg];
      return { ...state, messages };
    }

    case 'CORRECT_EVENT':
      return { ...state, correctGuessEvent: action.event };

    case 'CLEAR_CORRECT':
      return { ...state, correctGuessEvent: null };

    case 'RESET':
      return { ...INIT };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────

const Ctx = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch]  = useReducer(reducer, INIT);
  const engineRef          = useRef(null);
  const strokeSubsRef      = useRef([]);  // canvas stroke subscribers
  const clearSubsRef       = useRef([]);  // canvas clear subscribers

  // ─── Message handler (called for EVERY peer message) ──────────

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {

      // Full state sync from host engine
      case 'STATE':
        dispatch({ type:'SYNC_STATE', gs: msg.state });
        break;

      // Lightweight timer update (every second)
      case 'TIMER_TICK':
        dispatch({ type:'TIMER_TICK', timeLeft:msg.timeLeft, hintChars:msg.hintChars });
        break;

      // Client drawer receives word choices
      case 'WORD_CHOICES':
        dispatch({ type:'SET_WORD_CHOICES', choices:msg.choices });
        dispatch({ type:'SYNC_STATE', gs:{ phase:'choosing' } });
        break;

      // Round started (drawer picked word)
      case 'ROUND_START':
        dispatch({ type:'CLEAR_WORD_STATE' });
        dispatch({ type:'SYNC_STATE', gs:{
          phase:'drawing',
          drawerPeerId: msg.drawerId,
          drawerName:   msg.drawerName,
          wordLength:   msg.wordLength,
          hintChars:    msg.hintChars,
        }});
        break;

      case 'ROUND_END':
        dispatch({ type:'ROUND_END', word:msg.word });
        break;

      case 'GAME_END':
        dispatch({ type:'SYNC_STATE', gs:{ phase:'gameEnd' } });
        break;

      // Correct guess
      case 'CORRECT_GUESS':
        dispatch({ type:'CORRECT_EVENT', event:msg });
        dispatch({ type:'ADD_MSG', msg:{
          id: Date.now()+Math.random(), type:'correct',
          playerName:msg.playerName,
          text:`${msg.playerName} கண்டுபிடித்தார்! +${msg.points}`,
          timestamp: Date.now(),
        }});
        setTimeout(() => dispatch({ type:'CLEAR_CORRECT' }), 2500);
        break;

      // Private "almost" to self
      case 'CLOSE_GUESS':
        dispatch({ type:'ADD_MSG', msg:{
          id:Date.now()+Math.random(), type:'close',
          text:`🔥 "${msg.text}" — கிட்டத்தட்ட சரி! கொஞ்சம் மாற்றிப் பாருங்கள்!`,
          timestamp:Date.now(),
        }});
        break;

      // Wrong or close guess in public chat
      case 'WRONG_GUESS':
        dispatch({ type:'ADD_MSG', msg:{
          id:Date.now()+Math.random(),
          type: msg.isClose ? 'close' : 'guess',
          playerId:msg.playerId, playerName:msg.playerName,
          text:msg.text, color:msg.color,
          timestamp:Date.now(),
        }});
        break;

      case 'CHAT_MESSAGE':
        dispatch({ type:'ADD_MSG', msg:msg.message });
        break;

      // Canvas data
      case 'DRAW_STROKE':
        strokeSubsRef.current.forEach(fn => fn(msg.stroke));
        break;

      case 'DRAW_CLEAR':
        strokeSubsRef.current.forEach(fn => fn({ type:'CLEAR' }));
        clearSubsRef.current.forEach(fn => fn());
        break;

      // ── Host-only: messages FROM clients ──────────────────────

      case 'JOIN':
        engineRef.current?.addPlayer(msg.from, msg.name);
        break;

      case 'GUESS':
        engineRef.current?.handleGuess(msg.from, msg.text);
        break;

      case 'STROKE':
        engineRef.current?.handleDrawStroke(msg.from, msg.stroke);
        break;

      case 'CLEAR_CANVAS':
        engineRef.current?.handleClearCanvas(msg.from);
        break;

      case 'PICK_WORD':
        engineRef.current?.drawerPickedWord(msg.from, msg.word);
        break;

      default: break;
    }
  }, []);

  // ─── Create Room (host) ────────────────────────────────────────

  const createRoom = useCallback(async (name) => {
    dispatch({ type:'SET_CONNECTING', value:true });
    try {
      pm.setHandlers({
        onMessage:     handleMessage,
        onPlayerLeave: (peerId) => engineRef.current?.removePlayer(peerId),
        onHostLeave:   () => { dispatch({ type:'SET_ERROR', error:'Host disconnected.' }); dispatch({ type:'RESET' }); },
        onError:       (msg)    => dispatch({ type:'SET_ERROR', error:msg }),
      });

      const myId = await pm.createRoom();

      engineRef.current = new GameEngine(
        // onStateUpdate: partial state → push to host React
        (partial) => dispatch({ type:'SYNC_STATE', gs:partial }),
        // onHostWord: host is drawing
        (word, choices) => {
          if (choices) dispatch({ type:'SET_WORD_CHOICES', choices });
          if (word)    dispatch({ type:'SET_MY_WORD', word });
        },
        // onClearCanvas: wipe host canvas
        () => {
          strokeSubsRef.current.forEach(fn => fn({ type:'CLEAR' }));
          clearSubsRef.current.forEach(fn => fn());
        },
      );

      engineRef.current.addPlayer(myId, name);
      dispatch({ type:'ROOM_CREATED', myId, roomCode:myId, name });

    } catch (err) {
      dispatch({ type:'SET_ERROR', error: err.message || 'Failed to create room' });
    }
  }, [handleMessage]);

  // ─── Join Room (client) ───────────────────────────────────────

  const joinRoom = useCallback(async (roomCode, name) => {
    dispatch({ type:'SET_CONNECTING', value:true });
    try {
      pm.setHandlers({
        onMessage:   handleMessage,
        onHostLeave: () => {
          dispatch({ type:'SET_ERROR', error:'Host disconnected.' });
          setTimeout(() => dispatch({ type:'RESET' }), 3000);
        },
        onError: (msg) => dispatch({ type:'SET_ERROR', error:msg }),
      });

      // Room codes are lowercase; never toUpperCase
      const myId = await pm.joinRoom(roomCode.trim().toLowerCase());
      pm.sendToHost({ type:'JOIN', name });
      dispatch({ type:'ROOM_JOINED', myId, roomCode:roomCode.trim().toLowerCase(), name });

    } catch (err) {
      dispatch({ type:'SET_ERROR', error: err.message || 'Failed to join room' });
    }
  }, [handleMessage]);

  // ─── Game actions ──────────────────────────────────────────────

  const startGame = useCallback((settings) => {
    engineRef.current?.startGame(settings);
  }, []);

  const sendGuess = useCallback((text) => {
    if (!text?.trim()) return;
    const t = text.trim();
    if (pm.isHost()) {
      engineRef.current?.handleGuess(pm.getMyId(), t);
    } else {
      pm.sendToHost({ type:'GUESS', text:t });
    }
  }, []);

  const pickWord = useCallback((word) => {
    if (pm.isHost()) {
      engineRef.current?.drawerPickedWord(pm.getMyId(), word);
      dispatch({ type:'SET_MY_WORD', word });
    } else {
      pm.sendToHost({ type:'PICK_WORD', word });
      dispatch({ type:'SET_MY_WORD', word }); // optimistic
    }
  }, []);

  // ─── Canvas strokes (batched per animation frame) ─────────────

  const pendingRef = useRef([]);
  const rafRef     = useRef(null);

  const flushStrokes = useCallback(() => {
    if (!pendingRef.current.length) return;
    const batch = pendingRef.current;
    pendingRef.current = [];
    rafRef.current = null;
    const payload = batch.length === 1 ? batch[0] : batch;
    if (pm.isHost()) {
      pm.broadcast({ type:'DRAW_STROKE', stroke:payload });
    } else {
      pm.sendToHost({ type:'STROKE', stroke:payload });
    }
  }, []);

  const sendStroke = useCallback((s) => {
    pendingRef.current.push(s);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushStrokes);
  }, [flushStrokes]);

  const sendClearCanvas = useCallback(() => {
    if (pm.isHost()) {
      pm.broadcast({ type:'DRAW_CLEAR' });
      strokeSubsRef.current.forEach(fn => fn({ type:'CLEAR' }));
      clearSubsRef.current.forEach(fn => fn());
    } else {
      pm.sendToHost({ type:'CLEAR_CANVAS' });
    }
  }, []);

  const subscribeToStrokes = useCallback((fn) => {
    strokeSubsRef.current.push(fn);
    return () => { strokeSubsRef.current = strokeSubsRef.current.filter(f=>f!==fn); };
  }, []);

  const subscribeToClear = useCallback((fn) => {
    clearSubsRef.current.push(fn);
    return () => { clearSubsRef.current = clearSubsRef.current.filter(f=>f!==fn); };
  }, []);

  const resetGame = useCallback(() => {
    pm.destroy();
    engineRef.current?.destroy();
    engineRef.current = null;
    dispatch({ type:'RESET' });
  }, []);

  useEffect(() => () => { pm.destroy(); engineRef.current?.destroy(); }, []);

  const amDrawing = state.drawerPeerId === state.myId;

  const value = {
    ...state, amDrawing,
    createRoom, joinRoom, startGame,
    sendGuess, pickWord,
    sendStroke, sendClearCanvas,
    subscribeToStrokes, subscribeToClear,
    resetGame,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
