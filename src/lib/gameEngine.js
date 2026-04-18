/**
 * gameEngine.js — Host-only game state machine
 *
 * Runs ONLY in the host's browser tab.
 * Communicates with clients via peerManager broadcast/sendTo.
 */

import { broadcast, sendTo, getMyId } from './peerManager';
import { checkGuess, calculatePoints, buildStaticHints, applyHints } from './fuzzyMatch';
import { getRandomWords } from './words';

export class GameEngine {
  /**
   * @param {function} onStateUpdate  - partial React state update for host UI
   * @param {function} onHostWord     - (word|null, choices|null) called when host is drawer
   * @param {function} onClearCanvas  - called to wipe host's own canvas
   */
  constructor(onStateUpdate, onHostWord, onClearCanvas) {
    this.onStateUpdate  = onStateUpdate;
    this.onHostWord     = onHostWord;
    this.onClearCanvas  = onClearCanvas;
    this.timer              = null;
    this._wordChoiceTimeout = null;

    this.state = {
      phase:        'lobby',
      players:      {},      // { peerId: PlayerObj }
      drawerQueue:  [],      // ordered peer IDs for turns
      drawerIndex:  0,
      round:        1,
      maxRounds:    3,
      drawTime:     80,
      timeLeft:     80,
      currentWord:  null,
      hintChars:    [],
      hintMeta:     null,   // { chars, revealOrder, thresholds }
      guessedPeers: new Set(),
      messages:     [],
      wordChoices:  [],
      category:     'all',
    };
  }

  // ─── Player management ────────────────────────────────────────

  addPlayer(peerId, name) {
    const palette = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
    const taken   = Object.values(this.state.players).map(p => p.color);
    const color   = palette.find(c => !taken.includes(c)) ?? palette[Math.floor(Math.random()*palette.length)];

    this.state.players[peerId] = {
      id: peerId, name, score: 0,
      isDrawing: false, hasGuessed: false,
      color, joinedAt: Date.now(),
    };

    // Send full current state to the new joiner (they just connected)
    if (peerId !== getMyId()) {
      sendTo(peerId, { type: 'STATE', state: this._publicState() });
    }
    this._broadcastState();
    this._addMsg({ type:'system', text:`${name} விளையாட்டில் சேர்ந்தார்! 🎉` });
  }

  removePlayer(peerId) {
    const p = this.state.players[peerId];
    if (!p) return;
    delete this.state.players[peerId];
    this._addMsg({ type:'system', text:`${p.name} விளையாட்டை விட்டு சென்றார்` });

    if (p.isDrawing && this.state.phase === 'drawing') {
      this._endRound(true);
    } else {
      this._checkAllGuessed();
      this._broadcastState();
    }
  }

  // ─── Game flow ─────────────────────────────────────────────────

  startGame(settings) {
    this.state.maxRounds   = Math.max(1, Math.min(10, settings.rounds   || 3));
    this.state.drawTime    = Math.max(30, Math.min(180, settings.drawTime || 80));
    this.state.category    = settings.category || 'all';
    this.state.round       = 1;
    this.state.drawerIndex = 0;
    this.state.drawerQueue = Object.keys(this.state.players);

    Object.values(this.state.players).forEach(p => { p.score = 0; });

    this._addMsg({ type:'system', text:'🎮 விளையாட்டு தொடங்குகிறது!' });
    this._startRound();
  }

  _difficultyForRound() {
    if (this.state.round === 1) return 'easy';
    if (this.state.round === 2) return 'medium'; // easy+medium pool
    return null; // all difficulties
  }

  _startRound() {
    clearInterval(this.timer);
    clearTimeout(this._wordChoiceTimeout);

    const pids = Object.keys(this.state.players);
    if (pids.length < 2) { this._endGame(); return; }

    // Pick drawer
    const queue    = this.state.drawerQueue;
    const drawerId = queue[this.state.drawerIndex % queue.length];
    const drawer   = this.state.players[drawerId];
    if (!drawer) { this.state.drawerIndex++; this._startRound(); return; }

    // Reset per-turn state
    Object.values(this.state.players).forEach(p => {
      p.isDrawing  = (p.id === drawerId);
      p.hasGuessed = false;
    });
    this.state.guessedPeers = new Set();
    this.state.timeLeft     = this.state.drawTime;
    this.state.hintChars    = [];
    this.state.hintMeta     = null;
    this.state.currentWord  = null;
    this.state.phase        = 'choosing';

    // Clear canvas for everyone
    broadcast({ type:'DRAW_CLEAR' });
    this.onClearCanvas?.();

    // Pick word choices (difficulty scales by round)
    const diff    = this._difficultyForRound();
    const choices = getRandomWords(this.state.category, 3, diff);
    this.state.wordChoices = choices;

    // Broadcast choosing state
    this._broadcastState();
    this._addMsg({ type:'system', text:`✏️ ${drawer.name} சொல்லை தேர்ந்தெடுக்கிறார்...` });

    // Deliver word choices
    if (drawerId === getMyId()) {
      // Host is drawing — set React state directly
      this.onHostWord?.(null, choices);
    } else {
      sendTo(drawerId, { type:'WORD_CHOICES', choices });
    }

    // Auto-pick after 15 s if drawer doesn't choose
    this._wordChoiceTimeout = setTimeout(() => {
      if (this.state.phase === 'choosing') {
        this.drawerPickedWord(drawerId, choices[0]);
      }
    }, 15000);
  }

  drawerPickedWord(drawerId, word) {
    if (this.state.phase !== 'choosing') return;
    const drawer = this.state.players[drawerId];
    if (!drawer?.isDrawing) return;

    clearTimeout(this._wordChoiceTimeout);

    this.state.currentWord  = word;
    this.state.phase        = 'drawing';
    this.state.timeLeft     = this.state.drawTime;

    // Build static hints (deterministic, same for all clients)
    const meta = buildStaticHints(word.tamil, this.state.drawTime);
    this.state.hintMeta  = meta;
    this.state.hintChars = meta.chars.map(() => '_');

    // Tell host their word if they are drawing
    if (drawerId === getMyId()) {
      this.onHostWord?.(word, null);
    }

    // Tell all clients: round started, word length, initial blank hints
    broadcast({
      type:       'ROUND_START',
      drawerId,
      drawerName: drawer.name,
      wordLength: meta.chars.length,
      hintChars:  this.state.hintChars,
    });

    this._broadcastState();
    this._addMsg({ type:'system', text:`✏️ ${drawer.name} வரைகிறார்!` });

    this._startTimer();
  }

  _startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);

      // Update static hints
      if (this.state.hintMeta) {
        const { chars, revealOrder, thresholds } = this.state.hintMeta;
        this.state.hintChars = applyHints(chars, revealOrder, thresholds, this.state.timeLeft);
      }

      // Lightweight tick — don't call _broadcastState() which sends full state every second
      const tick = { type:'TIMER_TICK', timeLeft:this.state.timeLeft, hintChars:this.state.hintChars };
      broadcast(tick);
      // Update host React state directly (avoids stale-state overwrite loop)
      this.onStateUpdate({ timeLeft:this.state.timeLeft, hintChars:this.state.hintChars });

      if (this.state.timeLeft <= 0) this._endRound(false);
    }, 1000);
  }

  // ─── Guess handling ─────────────────────────────────────────────

  handleGuess(peerId, text) {
    if (this.state.phase !== 'drawing') return;
    const player = this.state.players[peerId];
    if (!player || player.isDrawing || player.hasGuessed) return;

    const { isMatch, isClose, confidence } = checkGuess(text, this.state.currentWord);

    if (isMatch) {
      const pts = calculatePoints(confidence, this.state.timeLeft, this.state.drawTime);
      player.score    += pts;
      player.hasGuessed = true;
      this.state.guessedPeers.add(peerId);

      // Drawer also earns points when someone guesses
      const drawer = Object.values(this.state.players).find(p => p.isDrawing);
      if (drawer) drawer.score += 15;

      broadcast({ type:'CORRECT_GUESS', playerId:peerId, playerName:player.name, points:pts, color:player.color });
      this._addMsg({ type:'correct', playerId:peerId, playerName:player.name, text:`${player.name} கண்டுபிடித்தார்! +${pts}` });
      this._broadcastState();
      this._checkAllGuessed();

    } else if (isClose) {
      // Private "almost" message to that player only
      sendTo(peerId, { type:'CLOSE_GUESS', text });
      // Show in public chat as a close attempt (with flame indicator)
      broadcast({
        type:'WRONG_GUESS', playerId:peerId, playerName:player.name,
        text, isClose:true, color:player.color,
      });

    } else {
      broadcast({
        type:'WRONG_GUESS', playerId:peerId, playerName:player.name,
        text, isClose:false, color:player.color,
      });
    }
  }

  // ─── Drawing relay ──────────────────────────────────────────────

  handleDrawStroke(fromPeerId, strokeData) {
    // Only relay if sender is the actual drawer
    const p = this.state.players[fromPeerId];
    if (!p?.isDrawing) return;
    broadcast({ type:'DRAW_STROKE', stroke:strokeData }, fromPeerId);
  }

  handleClearCanvas(fromPeerId) {
    const p = this.state.players[fromPeerId];
    if (!p?.isDrawing) return;
    broadcast({ type:'DRAW_CLEAR' }, fromPeerId);
  }

  // ─── Round / Game end ──────────────────────────────────────────

  _checkAllGuessed() {
    const nonDrawers = Object.values(this.state.players).filter(p => !p.isDrawing);
    if (nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed)) {
      this._endRound(false);
    }
  }

  _endRound(drawerLeft = false) {
    clearInterval(this.timer);
    clearTimeout(this._wordChoiceTimeout);
    this.state.phase = 'roundEnd';

    const word = this.state.currentWord;
    broadcast({
      type:'ROUND_END',
      word: word ? { tamil:word.tamil, english:word.english } : null,
      drawerLeft,
    });

    if (word) this._addMsg({ type:'system', text:`சொல்: ${word.tamil} (${word.english})` });

    // Push roundEnd state to host UI immediately
    this.onStateUpdate({
      phase: 'roundEnd',
      roundEndWord: word ? { tamil:word.tamil, english:word.english } : null,
    });

    // After 5 s, advance to next turn or end game
    setTimeout(() => {
      const pids = Object.keys(this.state.players);
      this.state.drawerIndex++;

      // All players drew → complete one round
      if (this.state.drawerIndex >= this.state.drawerQueue.length) {
        this.state.drawerIndex = 0;
        this.state.round++;
      }

      if (this.state.round > this.state.maxRounds || pids.length < 2) {
        this._endGame();
      } else {
        this._startRound();
      }
    }, 5000);
  }

  _endGame() {
    clearInterval(this.timer);
    this.state.phase = 'gameEnd';
    broadcast({ type:'GAME_END', scores:this._scores() });
    this._broadcastState();
  }

  // ─── Helpers ────────────────────────────────────────────────────

  _addMsg(msg) {
    const m = { ...msg, id: Date.now() + Math.random(), timestamp: Date.now() };
    this.state.messages = [...this.state.messages.slice(-49), m];
    broadcast({ type:'CHAT_MESSAGE', message:m });
    this.onStateUpdate({ messages:this.state.messages });
  }

  _scores() {
    return Object.values(this.state.players)
      .map(p => ({ id:p.id, name:p.name, score:p.score, color:p.color }))
      .sort((a,b) => b.score - a.score);
  }

  _publicState() {
    const drawer = Object.values(this.state.players).find(p => p.isDrawing);
    return {
      phase:        this.state.phase,
      players:      Object.values(this.state.players).map(p => ({
        id:p.id, name:p.name, score:p.score,
        isDrawing:p.isDrawing, hasGuessed:p.hasGuessed, color:p.color,
      })),
      round:        this.state.round,
      maxRounds:    this.state.maxRounds,
      drawTime:     this.state.drawTime,
      timeLeft:     this.state.timeLeft,
      drawerPeerId: drawer?.id  ?? null,
      drawerName:   drawer?.name ?? null,
      wordLength:   this.state.hintMeta?.chars.length ?? 0,
      hintChars:    this.state.hintChars,
      messages:     this.state.messages,
      // NOTE: currentWord is NEVER sent to clients
    };
  }

  _broadcastState() {
    const s = this._publicState();
    broadcast({ type:'STATE', state:s });
    this.onStateUpdate(s);
  }

  destroy() {
    clearInterval(this.timer);
    clearTimeout(this._wordChoiceTimeout);
  }
}
