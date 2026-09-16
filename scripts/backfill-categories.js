// One-off maintenance script: assigns a department to any main_list_items row
// left with category = NULL (items merged before the category column/keyword
// classifier existed). Safe to re-run -- it only touches NULL rows and never
// overwrites a category a parent already set (manually or via the classifier).
// Run with: node scripts/backfill-categories.js
require('dotenv').config();
const db = require('../src/db/knex');
const { resolveCategory } = require('../src/services/categoryService');

(async () => {
  const rows = await db('main_list_items').whereNull('category').select('id', 'product_name_normalized');
  console.log(`${rows.length} item(s) missing a category`);

  for (const row of rows) {
    const category = await resolveCategory(db, row.product_name_normalized);
    await db('main_list_items').where({ id: row.id }).update({ category });
    console.log(`#${row.id} -> ${category}`);
  }

  await db.destroy();
})();
