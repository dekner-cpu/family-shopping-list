const { selectTargetParentUserIds } = require('../src/services/pushService');

const yael = { id: 1, name: 'יעל', role: 'parent' };
const shachar = { id: 2, name: 'שחר', role: 'parent' };
const parents = [yael, shachar];

describe('selectTargetParentUserIds', () => {
  test('a regular user submitting notifies BOTH parents', () => {
    expect(selectTargetParentUserIds(parents, 3)).toEqual([1, 2]);
  });

  test('a parent submitting notifies only the OTHER parent', () => {
    expect(selectTargetParentUserIds(parents, yael.id)).toEqual([shachar.id]);
    expect(selectTargetParentUserIds(parents, shachar.id)).toEqual([yael.id]);
  });

  test('a parent never appears in their own notification targets', () => {
    const targets = selectTargetParentUserIds(parents, yael.id);
    expect(targets).not.toContain(yael.id);
  });
});
