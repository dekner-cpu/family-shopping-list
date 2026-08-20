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

module.exports = {
  normalizeProductName,
  extractLeadingNumber,
  mergeQuantities,
  mergeNotes,
};
