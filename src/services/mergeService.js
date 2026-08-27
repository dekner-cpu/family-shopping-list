function normalizeProductName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function extractLeadingNumber(quantity) {
  if (!quantity) return null;
  const match = quantity.trim().match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Decides the winning quantity string when two items for the same product merge.
 * Numeric-leading quantities compare by that number; otherwise falls back to
 * "keep both, concatenated" so information is never silently dropped.
 */
function mergeQuantities(existingQuantity, newQuantity) {
  const existing = (existingQuantity || '').trim();
  const incoming = (newQuantity || '').trim();

  if (!existing) return incoming || null;
  if (!incoming) return existing;
  if (existing === incoming) return existing;

  const existingNum = extractLeadingNumber(existing);
  const incomingNum = extractLeadingNumber(incoming);

  if (existingNum !== null && incomingNum !== null) {
    return incomingNum > existingNum ? incoming : existing;
  }

  return `${existing} / ${incoming}`;
}

function mergeNotes(existingNotes, newNotes) {
  const existing = (existingNotes || '').trim();
  const incoming = (newNotes || '').trim();

  if (!existing) return incoming || null;
  if (!incoming) return existing;
  if (existing === incoming) return existing;

  return `${existing} — ${incoming}`;
}

// Hebrew letters take a different shape when they're word-final (ך/ם/ן/ף/ץ vs
// כ/מ/נ/פ/צ). Stripping the "ים" suffix off "מלפפונים" leaves the *regular*
// נ (it was never word-final), but "מלפפון" on its own ends in the *final* ן
// -- so without folding, the two stems would compare unequal character-by-character
// despite being the same root.
const HEBREW_FINAL_TO_REGULAR = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

function foldTrailingFinalLetter(text) {
  if (!text) return text;
  const lastChar = text[text.length - 1];
  const regular = HEBREW_FINAL_TO_REGULAR[lastChar];
  return regular ? text.slice(0, -1) + regular : text;
}

/**
 * Strips a trailing Hebrew plural suffix (ים/ות) so "מלפפון" and "מלפפונים"
 * compare equal. Guarded to a minimum remaining length so short words aren't
 * over-stripped into an unrelated word.
 */
function productNameStem(normalizedName) {
  const PLURAL_SUFFIXES = ['ים', 'ות'];
  for (const suffix of PLURAL_SUFFIXES) {
    if (normalizedName.endsWith(suffix) && normalizedName.length - suffix.length >= 3) {
      return foldTrailingFinalLetter(normalizedName.slice(0, -suffix.length));
    }
  }
  return foldTrailingFinalLetter(normalizedName);
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const currRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    prevRow = currRow;
  }
  return prevRow[b.length];
}

/**
 * Finds an existing item that's very likely the same product under a
 * different phrasing -- same singular/plural stem, or a one-character typo
 * apart (only checked for words 4+ letters, to keep short-word false
 * positives rare). Deliberately conservative: this merges items without any
 * way to split them back apart afterward, so it only fires on close matches,
 * not loose "sounds similar" ones. Callers should already have ruled out an
 * exact product_name_normalized match before calling this.
 */
function findFuzzyMatch(candidateNormalized, existingItems) {
  const candidateStem = productNameStem(candidateNormalized);
  const stemMatch = existingItems.find((existing) => productNameStem(existing.product_name_normalized) === candidateStem);
  if (stemMatch) return stemMatch;

  if (candidateNormalized.length >= 4) {
    return (
      existingItems.find(
        (existing) =>
          existing.product_name_normalized.length >= 4 &&
          levenshteinDistance(candidateNormalized, existing.product_name_normalized) <= 1
      ) || null
    );
  }

  return null;
}

module.exports = {
  normalizeProductName,
  extractLeadingNumber,
  mergeQuantities,
  mergeNotes,
  productNameStem,
  levenshteinDistance,
  findFuzzyMatch,
};
