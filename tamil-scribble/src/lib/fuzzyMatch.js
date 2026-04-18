import Fuse from 'fuse.js';

// Normalize text for matching
function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    // Remove common punctuation
    .replace(/[.,!?;:'"]/g, '');
}

// Build search corpus from a word object
function buildCorpus(word) {
  return [
    word.tamil,
    word.english.toLowerCase(),
    ...word.tanglish.map(t => t.toLowerCase()),
    // Also add common Tamil-to-English phonetic variations
    ...generatePhoneticVariants(word.english),
  ].filter(Boolean);
}

// Generate common phonetic variants of English words
// (handles common misspellings Tamil speakers make)
function generatePhoneticVariants(english) {
  const variants = [];
  const e = english.toLowerCase();
  // Common substitutions
  variants.push(e.replace(/ph/g, 'f'));
  variants.push(e.replace(/ck/g, 'k'));
  variants.push(e.replace(/th/g, 't'));
  variants.push(e.replace(/double letters/g, s => s[0]));
  return variants.filter(v => v !== e);
}

/**
 * Check if user input matches the target word
 * @param {string} input - What the player typed
 * @param {object} word - Word object from words.js
 * @returns {{ isMatch: boolean, confidence: number, matchedOn: string }}
 */
export function checkGuess(input, word) {
  if (!input || !word) return { isMatch: false, confidence: 0 };

  const normalizedInput = normalize(input);
  if (!normalizedInput) return { isMatch: false, confidence: 0 };

  // 1. Exact match check (fastest path)
  const corpus = buildCorpus(word);
  for (const candidate of corpus) {
    if (normalizedInput === normalize(candidate)) {
      return { isMatch: true, confidence: 1.0, matchedOn: candidate };
    }
  }

  // 2. Direct substring check (input is part of word or vice versa)
  for (const candidate of corpus) {
    const normCand = normalize(candidate);
    if (normCand.length >= 3) {
      // Input contains the word or word starts with input
      if (normCand.startsWith(normalizedInput) && normalizedInput.length >= normCand.length * 0.75) {
        return { isMatch: true, confidence: 0.9, matchedOn: candidate };
      }
      if (normalizedInput.startsWith(normCand)) {
        return { isMatch: true, confidence: 0.85, matchedOn: candidate };
      }
    }
  }

  // 3. Fuse.js fuzzy match
  const searchItems = corpus.map(text => ({ text }));
  const fuse = new Fuse(searchItems, {
    keys: ['text'],
    threshold: 0.42,      // 0 = perfect match only, 1 = match anything
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
  });

  const results = fuse.search(normalizedInput);

  if (results.length > 0) {
    const best = results[0];
    const score = best.score ?? 1; // Fuse score: 0 = perfect, 1 = worst
    const confidence = 1 - score;

    if (confidence >= 0.58) {
      return {
        isMatch: true,
        confidence,
        matchedOn: best.item.text,
      };
    }
  }

  return { isMatch: false, confidence: 0 };
}

/**
 * Calculate points based on confidence and remaining time
 * @param {number} confidence - 0 to 1
 * @param {number} timeLeft - seconds remaining
 * @param {number} maxTime - total seconds for round
 * @returns {number} points
 */
export function calculatePoints(confidence, timeLeft, maxTime) {
  // Base: 100 points for exact, scaled by confidence
  const basePoints = Math.round(confidence * 100);
  // Time bonus: up to 50 extra points if guessed early
  const timeRatio = Math.max(0, timeLeft / maxTime);
  const timeBonus = Math.round(timeRatio * 50);
  // Drawer gets 15 points when someone guesses
  return Math.min(150, basePoints + timeBonus);
}

/**
 * Generate the hint string with revealed/hidden characters
 * Progressive reveal: more letters shown as time runs out
 * @param {string} tamilWord - The full Tamil word
 * @param {number} timeLeft - seconds remaining
 * @param {number} maxTime - total round time
 * @returns {string[]} Array of characters (revealed or '_')
 */
export function generateHint(tamilWord, timeLeft, maxTime) {
  const chars = [...tamilWord]; // Properly split Tamil Unicode chars
  const totalChars = chars.length;
  const timeRatio = timeLeft / maxTime;

  // Reveal strategy:
  // > 70% time left: show 0 chars (all hidden)
  // 40-70% time: show ~25% of chars
  // 15-40% time: show ~50% of chars
  // < 15% time: show ~70% of chars
  let revealCount = 0;
  if (timeRatio < 0.7) revealCount = Math.floor(totalChars * 0.25);
  if (timeRatio < 0.4) revealCount = Math.floor(totalChars * 0.5);
  if (timeRatio < 0.15) revealCount = Math.floor(totalChars * 0.7);

  // Pick which indices to reveal (first and last are good anchors)
  const revealIndices = new Set();
  if (revealCount > 0) {
    // Always reveal last char as a hint
    revealIndices.add(totalChars - 1);
    // Reveal random middle chars
    const available = Array.from({ length: totalChars - 2 }, (_, i) => i + 1);
    const shuffled = available.sort(() => Math.random() - 0.5);
    shuffled.slice(0, revealCount - 1).forEach(i => revealIndices.add(i));
  }

  return chars.map((char, i) => revealIndices.has(i) ? char : '_');
}
