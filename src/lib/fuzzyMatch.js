/**
 * fuzzyMatch.js
 *
 * Guess matching for Tamil Scribble.
 * Three-tier result:
 *   isMatch=true  → correct answer, award points
 *   isClose=true  → "almost!" (within ~1 char), show flame hint
 *   both false    → wrong
 *
 * Key fix: "udai" must NOT fully match "kudai" (umbrella).
 * Fuse.js alone scores udai→kudai at 0.99 confidence because edit-dist=1.
 * We add a length-ratio check: if the player's guess is missing >1 leading
 * character compared to the best match, we downgrade to isClose.
 */

import Fuse from 'fuse.js';

// ── helpers ──────────────────────────────────────────────────────

function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g,' ').replace(/[.,!?;:'"]/g,'');
}

function buildCorpus(word) {
  const phonetic = generatePhoneticVariants(word.english);
  return [
    word.tamil,
    word.english.toLowerCase(),
    ...word.tanglish.map(t => t.toLowerCase()),
    ...phonetic,
  ].filter(Boolean);
}

function generatePhoneticVariants(english) {
  const e = english.toLowerCase();
  return [
    e.replace(/ph/g,'f'),
    e.replace(/ck/g,'k'),
    e.replace(/th/g,'t'),
  ].filter(v => v !== e);
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, (_,i)=>Array(n+1).fill(0).map((_,j)=>i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

/**
 * Check whether the user's guess is correct, close, or wrong.
 *
 * Returns { isMatch, isClose, confidence, matchedOn }
 *
 * Tuned rules:
 *  1. Exact match on any corpus entry → correct (conf 1.0)
 *  2. Prefix match: guess covers ≥80% of a candidate from the START → correct
 *  3. Fuse fuzzy with length-ratio guard:
 *       - conf ≥ 0.88 AND length ratio ≥ 0.80 → correct
 *       - conf ≥ 0.50 → close (show 🔥)
 *       - else → wrong
 *
 * The length-ratio guard prevents "udai"(4) matching "kudai"(5) as correct
 * because 4/5=0.80 is exactly at the boundary — and since udai is missing a
 * LEADING char (not trailing), we set the boundary slightly higher (0.82)
 * for leading-char deletions.
 */
export function checkGuess(input, word) {
  if (!input || !word) return { isMatch:false, isClose:false, confidence:0 };

  const normIn = normalize(input);
  if (!normIn || normIn.length < 1) return { isMatch:false, isClose:false, confidence:0 };

  const corpus = buildCorpus(word);

  // 1. Exact match
  for (const cand of corpus) {
    if (normIn === normalize(cand)) {
      return { isMatch:true, isClose:false, confidence:1.0, matchedOn:cand };
    }
  }

  // 2. Prefix/suffix overlap (≥80% coverage from the start of either string)
  for (const cand of corpus) {
    const nc = normalize(cand);
    if (nc.length < 2) continue;

    // guess starts candidate (guest typed extra chars)
    if (normIn.startsWith(nc) && nc.length >= normIn.length * 0.75) {
      return { isMatch:true, isClose:false, confidence:0.92, matchedOn:cand };
    }
    // candidate starts with guess (guess is a prefix of candidate)
    // only accept if guess covers ≥80% of candidate AND difference is ≤1 char
    if (nc.startsWith(normIn) && normIn.length >= nc.length * 0.80 && nc.length - normIn.length <= 1) {
      return { isMatch:true, isClose:false, confidence:0.90, matchedOn:cand };
    }
  }

  // 3. Fuse.js fuzzy match with length-ratio guard
  const items = corpus.map(text => ({ text }));
  const fuse  = new Fuse(items, {
    keys: ['text'],
    threshold: 0.55,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
  });

  const results = fuse.search(normIn);
  if (results.length > 0) {
    const best      = results[0];
    const rawConf   = 1 - (best.score ?? 1);
    const bestText  = normalize(best.item.text);

    // Length ratio: how much of the candidate did the player cover?
    const lenRatio  = normIn.length / Math.max(bestText.length, 1);

    // Extra penalty when player dropped a leading character
    // (e.g. "udai" vs "kudai": lenRatio=0.8, but it's a leading deletion)
    const dist = levenshtein(normIn, bestText);
    const isLeadingDrop = dist === 1 && bestText.startsWith(bestText[0]) && !normIn.startsWith(bestText[0]);
    const effectiveConf = isLeadingDrop ? rawConf * 0.70 : rawConf;

    if (effectiveConf >= 0.80 && lenRatio >= 0.80) {
      return { isMatch:true, isClose:false, confidence:effectiveConf, matchedOn:best.item.text };
    }
    if (effectiveConf >= 0.50 || (rawConf >= 0.70 && lenRatio >= 0.65)) {
      return { isMatch:false, isClose:true, confidence:effectiveConf, matchedOn:best.item.text };
    }
  }

  return { isMatch:false, isClose:false, confidence:0 };
}

export function calculatePoints(confidence, timeLeft, maxTime) {
  const base      = Math.round(confidence * 100);
  const timeBonus = Math.round(Math.max(0, timeLeft / maxTime) * 50);
  return Math.min(150, base + timeBonus);
}

// ── Static hint system ────────────────────────────────────────────

/**
 * Split Tamil string into grapheme clusters so hints never show half-characters.
 * Uses Intl.Segmenter when available (all modern browsers), manual fallback for older.
 */
export function splitTamilGraphemes(str) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('ta', { granularity:'grapheme' });
    return Array.from(seg.segment(str), s => s.segment);
  }
  // Manual: group consonant + following vowel signs
  const result = [];
  let i = 0;
  while (i < str.length) {
    let cluster = str[i++];
    while (i < str.length) {
      const code = str.charCodeAt(i);
      if ((code >= 0x0BBE && code <= 0x0BCD) || code === 0x0BD7) { cluster += str[i++]; }
      else break;
    }
    result.push(cluster);
  }
  return result;
}

/**
 * Build STATIC hint metadata for a word.
 * Computed ONCE when the drawer picks the word.
 * All clients run applyHints() with the same metadata → identical display.
 *
 * Strategy:
 *  - Never reveal the first grapheme (too easy)
 *  - Reveal up to 40% of graphemes as hints
 *  - Spread reveal events evenly across the last 70% of draw time
 *  - Deterministic shuffle using the word's char-code sum as seed
 */
export function buildStaticHints(tamilWord, drawTime) {
  const chars     = splitTamilGraphemes(tamilWord);
  const total     = chars.length;
  const hintCount = Math.max(0, Math.floor(total * 0.4));

  // Thresholds: times at which each hint unlocks (seconds remaining)
  // Spread over last 65% of timer
  const thresholds = [];
  for (let i = 0; i < hintCount; i++) {
    thresholds.push(Math.round(drawTime * (0.60 - i * (0.60 / Math.max(hintCount,1)))));
  }

  // Deterministic index order using word as seed (never reveal index 0)
  const seed      = tamilWord.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  const available = Array.from({length:total}, (_,i) => i).filter(i => i !== 0);
  const shuffled  = [...available].sort((a,b) => ((seed*(a+7))%97) - ((seed*(b+7))%97));
  const revealOrder = shuffled.slice(0, hintCount);

  return { chars, revealOrder, thresholds };
}

/**
 * Apply hints at a given timeLeft to produce display array.
 * Returns string[] same length as chars, '_' for hidden graphemes.
 */
export function applyHints(chars, revealOrder, thresholds, timeLeft) {
  const revealed = new Set();
  thresholds.forEach((threshold, i) => {
    if (timeLeft <= threshold && revealOrder[i] !== undefined) {
      revealed.add(revealOrder[i]);
    }
  });
  return chars.map((ch, i) => revealed.has(i) ? ch : '_');
}
