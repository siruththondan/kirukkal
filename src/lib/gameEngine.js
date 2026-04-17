/**
 * gameEngine.js
 * Runs ONLY on the host's browser.
 * Manages game state: rounds, timer, word selection, scoring.
 * Communicates with clients via peerManager.
 */

import { broadcast, sendTo } from './peerManager';
import { checkGuess, calculatePoints, generateHint } from './fuzzyMatch';
import { getRandomWords } from './words';

export class GameEngine {
  constructor(onStateUpdate) {
    // Callback to update host's local React state
    this.onStateUpdate = onStateUpdate;
    this.timer = null;
    this.hintTimer = null;

    // Core game state
    this.state = {
      phase: 'lobby',       // lobby | choosing | drawing | roundEnd | gameEnd
      players: {},          // { peerId: { id, name, score, isDrawing, hasGuessed, color } }
      drawerQueue: [],      // ordered list of peer IDs for drawing turns
      drawerIndex: 0,
      round: 1,
      maxRounds: 3,
      drawTime: 80,
      timeLeft: 80,
      currentWord: null,    // full word object
      hintChars: [],        // ['_', 'ய', '_', 'ன', 'ை'] etc
      guessedPeers: new Set(),
      messages: [],         // chat messages
      wordChoices: [],      // 3 word options for drawer to pick
    };
  }

  // ─── Player Management ─────────────────────────────────────────

  addPlayer(peerId, name) {
    const colors = ['#f87171','#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#94a3b8'];
    const takenColors = Object.values(this.state.players).map(p => p.color);
    const color = colors.find(c => !takenColors.includes(c)) || colors[Math.floor(Math.random() * colors.length)];

    this.state.players[peerId] = {
      id: peerId,
      name,
      score: 0,
      isDrawing: false,
      hasGuessed: false,
      color,
      joinedAt: Date.now(),
    };

    // Send welcome: full state to new player
    sendTo(peerId, { type: 'STATE', state: this.getPublicState(peerId) });
    // Tell everyone about new player
    this.broadcastState();
    this.addMessage({ type: 'system', text: `${name} விளையாட்டில் சேர்ந்தார்! 🎉` });
  }

  removePlayer(peerId) {
    const player = this.state.players[peerId];
    if (!player) return;
    const name = player.name;
    delete this.state.players[peerId];

    this.addMessage({ type: 'system', text: `${name} விளையாட்டை விட்டு சென்றார்` });

    // If drawer left, end round
    if (player.isDrawing && this.state.phase === 'drawing') {
      this.endRound(true);
      return;
    }

    // Check if all remaining players guessed
    this.checkAllGuessed();
    this.broadcastState();
  }

  // ─── Game Flow ─────────────────────────────────────────────────

  startGame(settings) {
    this.state.maxRounds = Math.max(1, Math.min(10, settings.rounds || 3));
    this.state.drawTime = Math.max(30, Math.min(180, settings.drawTime || 80));
    this.state.round = 1;
    this.state.drawerIndex = 0;
    this.state.drawerQueue = Object.keys(this.state.players);
    this.state.phase = 'drawing';

    // Reset scores
    Object.values(this.state.players).forEach(p => { p.score = 0; });

    this.addMessage({ type: 'system', text: '🎮 விளையாட்டு தொடங்குகிறது!' });
    this.startRound();
  }

  startRound() {
    // Pick drawer
    const playerIds = this.state.drawerQueue;
    if (playerIds.length === 0) { this.endGame(); return; }

    const drawerId = playerIds[this.state.drawerIndex % playerIds.length];
    const drawer = this.state.players[drawerId];
    if (!drawer) { this.state.drawerIndex++; this.startRound(); return; }

    // Reset per-round state
    Object.values(this.state.players).forEach(p => {
      p.isDrawing = (p.id === drawerId);
      p.hasGuessed = false;
    });
    this.state.guessedPeers = new Set();
    this.state.timeLeft = this.state.drawTime;
    this.state.hintChars = [];
    this.state.currentWord = null;
    this.state.phase = 'choosing';

    // Give drawer 3 word choices
    const choices = getRandomWords('all', 3);
    this.state.wordChoices = choices;

    broadcast({ type: 'STATE', state: this.getPublicState() });
    sendTo(drawerId, { type: 'WORD_CHOICES', choices });
    this.addMessage({ type: 'system', text: `✏️ ${drawer.name} வரைகிறார்!` });

    // Auto-pick if drawer doesn't choose in 15s
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
    this.state.currentWord = word;
    this.state.phase = 'drawing';
    this.state.timeLeft = this.state.drawTime;
    this.state.hintChars = [...word.tamil].map(() => '_');

    // Tell all clients round started (without the word)
    broadcast({ type: 'ROUND_START', drawerId, drawerName: drawer.name });
    broadcast({ type: 'STATE', state: this.getPublicState() });

    // Start timer
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);

      // Update hint chars based on time
      if (this.state.currentWord) {
        this.state.hintChars = generateHint(
          this.state.currentWord.tamil,
          this.state.timeLeft,
          this.state.drawTime
        );
      }

      // Broadcast timer + hint update (lightweight)
      broadcast({
        type: 'TIMER_TICK',
        timeLeft: this.state.timeLeft,
        hintChars: this.state.hintChars,
      });

      if (this.state.timeLeft <= 0) {
        this.endRound(false);
      }
    }, 1000);
  }

  handleGuess(peerId, text) {
    if (this.state.phase !== 'drawing') return;
    const player = this.state.players[peerId];
    if (!player || player.isDrawing || player.hasGuessed) return;

    const { isMatch, confidence } = checkGuess(text, this.state.currentWord);

    if (isMatch) {
      const points = calculatePoints(confidence, this.state.timeLeft, this.state.drawTime);

      // Award guesser
      player.score += points;
      player.hasGuessed = true;
      this.state.guessedPeers.add(peerId);

      // Award drawer too
      const drawer = Object.values(this.state.players).find(p => p.isDrawing);
      if (drawer) drawer.score += 15;

      broadcast({
        type: 'CORRECT_GUESS',
        playerId: peerId,
        playerName: player.name,
        points,
        color: player.color,
      });

      this.addMessage({
        type: 'correct',
        playerId: peerId,
        playerName: player.name,
        text: `${player.name} கண்டுபிடித்தார்! +${points}`,
      });

      this.broadcastState();
      this.checkAllGuessed();
    } else {
      // Show wrong guess in chat (visible to all)
      broadcast({
        type: 'WRONG_GUESS',
        playerId: peerId,
        playerName: player.name,
        text,
        color: player.color,
      });
    }
  }

  handleDrawStroke(fromPeerId, strokeData) {
    // Relay drawing data to all non-drawers
    broadcast({ type: 'DRAW_STROKE', stroke: strokeData }, fromPeerId);
  }

  handleClearCanvas(fromPeerId) {
    broadcast({ type: 'DRAW_CLEAR' }, fromPeerId);
  }

  checkAllGuessed() {
    const nonDrawers = Object.values(this.state.players).filter(p => !p.isDrawing);
    if (nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed)) {
      this.endRound(false);
    }
  }

  endRound(drawerLeft = false) {
    clearInterval(this.timer);
    clearTimeout(this._wordChoiceTimeout);
    this.state.phase = 'roundEnd';

    const word = this.state.currentWord;
    broadcast({
      type: 'ROUND_END',
      word: word ? { tamil: word.tamil, english: word.english } : null,
      drawerLeft,
      scores: this.getScores(),
    });

    if (word) {
      this.addMessage({
        type: 'system',
        text: `சொல்: ${word.tamil} (${word.english})`,
      });
    }

    // Wait 5 seconds then next round
    setTimeout(() => {
      const playerIds = Object.keys(this.state.players);
      this.state.drawerIndex++;

      if (this.state.drawerIndex >= playerIds.length) {
        this.state.drawerIndex = 0;
        this.state.round++;
      }

      if (this.state.round > this.state.maxRounds || playerIds.length < 2) {
        this.endGame();
      } else {
        this.state.phase = 'drawing';
        this.startRound();
      }
    }, 5000);
  }

  endGame() {
    clearInterval(this.timer);
    this.state.phase = 'gameEnd';
    const scores = this.getScores();
    broadcast({ type: 'GAME_END', scores });
    this.broadcastState();
  }

  // ─── Helpers ───────────────────────────────────────────────────

  addMessage(msg) {
    const message = { ...msg, id: Date.now() + Math.random(), timestamp: Date.now() };
    this.state.messages = [...this.state.messages.slice(-49), message];
    broadcast({ type: 'CHAT_MESSAGE', message });
    // Also update host locally
    this.onStateUpdate({ messages: this.state.messages });
  }

  getScores() {
    return Object.values(this.state.players)
      .map(p => ({ id: p.id, name: p.name, score: p.score, color: p.color }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get state safe to broadcast (no current word)
   * @param {string|null} forPeerId - if specified, may include extra info
   */
  getPublicState(forPeerId = null) {
    const drawer = Object.values(this.state.players).find(p => p.isDrawing);
    return {
      phase: this.state.phase,
      players: Object.values(this.state.players).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isDrawing: p.isDrawing,
        hasGuessed: p.hasGuessed,
        color: p.color,
      })),
      round: this.state.round,
      maxRounds: this.state.maxRounds,
      drawTime: this.state.drawTime,
      timeLeft: this.state.timeLeft,
      drawerPeerId: drawer?.id ?? null,
      drawerName: drawer?.name ?? null,
      wordLength: this.state.currentWord?.tamil ? [...this.state.currentWord.tamil].length : 0,
      wordEnglishLength: this.state.currentWord?.english?.length ?? 0,
      hintChars: this.state.hintChars,
      messages: this.state.messages,
      // Never reveal currentWord to clients
    };
  }

  broadcastState() {
    const publicState = this.getPublicState();
    broadcast({ type: 'STATE', state: publicState });
    this.onStateUpdate(publicState);
  }

  destroy() {
    clearInterval(this.timer);
    clearTimeout(this._wordChoiceTimeout);
  }
}
