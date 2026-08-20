const {
  normalizeProductName,
  extractLeadingNumber,
  mergeQuantities,
  mergeNotes,
} = require('../src/services/mergeService');

describe('normalizeProductName', () => {
  test('trims, collapses whitespace, lowercases', () => {
    expect(normalizeProductName('  עגבניות   שרי  ')).toBe('עגבניות שרי');
    expect(normalizeProductName('Milk')).toBe('milk');
  });

  test('treats differently-cased/spaced duplicates as equal', () => {
    expect(normalizeProductName('Milk')).toBe(normalizeProductName('  milk '));
  });
});

describe('extractLeadingNumber', () => {
  test('parses a leading integer', () => {
    expect(extractLeadingNumber('2 יח׳')).toBe(2);
  });

  test('parses a leading decimal', () => {
    expect(extractLeadingNumber('1.5 ק"ג')).toBe(1.5);
  });

  test('returns null for non-numeric or empty input', () => {
    expect(extractLeadingNumber('חבילה')).toBeNull();
    expect(extractLeadingNumber('')).toBeNull();
    expect(extractLeadingNumber(null)).toBeNull();
  });
});

describe('mergeQuantities', () => {
  test('keeps the larger numeric quantity', () => {
    expect(mergeQuantities('2 יח׳', '3 יח׳')).toBe('3 יח׳');
    expect(mergeQuantities('3 יח׳', '2 יח׳')).toBe('3 יח׳');
  });

  test('falls back to concatenation when quantities are not numeric', () => {
    expect(mergeQuantities('חבילה', '2 יח׳')).toBe('חבילה / 2 יח׳');
  });

  test('handles empty/missing quantities without dropping data', () => {
    expect(mergeQuantities('', '2 יח׳')).toBe('2 יח׳');
    expect(mergeQuantities('2 יח׳', '')).toBe('2 יח׳');
    expect(mergeQuantities(null, null)).toBeNull();
  });

  test('identical quantities collapse to one value', () => {
    expect(mergeQuantities('2 יח׳', '2 יח׳')).toBe('2 יח׳');
  });
});

describe('mergeNotes', () => {
  test('concatenates distinct non-empty notes', () => {
    expect(mergeNotes('בבקשה טרי', 'לא חריף')).toBe('בבקשה טרי — לא חריף');
  });

  test('keeps the only non-empty note', () => {
    expect(mergeNotes('', 'לא חריף')).toBe('לא חריף');
    expect(mergeNotes('בבקשה טרי', '')).toBe('בבקשה טרי');
  });

  test('returns null when both are empty', () => {
    expect(mergeNotes('', '')).toBeNull();
    expect(mergeNotes(null, null)).toBeNull();
  });
});
