const { classifyByKeywords, groupItemsByCategory, DEFAULT_CATEGORY } = require('../src/services/categoryService');

describe('classifyByKeywords', () => {
  test('classifies common products into the expected category', () => {
    expect(classifyByKeywords('מלפפונים')).toBe('fruits_vegetables');
    expect(classifyByKeywords('חלב')).toBe('dairy');
    expect(classifyByKeywords('עוף שלם')).toBe('meat_fish');
    expect(classifyByKeywords('אקונומיקה')).toBe('cleaning');
  });

  test('falls back to the default category when nothing matches', () => {
    expect(classifyByKeywords('קסדת אופניים')).toBe(DEFAULT_CATEGORY);
  });
});

describe('groupItemsByCategory', () => {
  test('groups and sorts items within each category, in aisle order, omitting empty categories', () => {
    const items = [
      { product_name: 'תפוח', category: 'fruits_vegetables' },
      { product_name: 'אבוקדו', category: 'fruits_vegetables' },
      { product_name: 'חלב', category: 'dairy' },
    ];

    const groups = groupItemsByCategory(items);

    expect(groups.map((g) => g.key)).toEqual(['fruits_vegetables', 'dairy']);
    expect(groups[0].items.map((i) => i.product_name)).toEqual(['אבוקדו', 'תפוח']);
  });

  test('treats a missing category as the default catch-all', () => {
    const items = [{ product_name: 'משהו מוזר', category: null }];
    const groups = groupItemsByCategory(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe(DEFAULT_CATEGORY);
  });
});
