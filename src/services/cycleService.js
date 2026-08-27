const db = require('../db/knex');
const { normalizeProductName, mergeQuantities, mergeNotes, findFuzzyMatch } = require('./mergeService');
const { resolveCategory, learnCategory, CATEGORIES } = require('./categoryService');

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getCurrentCycle() {
  const cycle = await db('shopping_cycles').whereIn('status', ['open', 'locked']).orderBy('id', 'desc').first();
  if (!cycle) throw httpError('No active shopping cycle found', 500);
  return cycle;
}

/**
 * Approves a pending/rejected personal item and merges it into the current cycle's
 * main list. Uses a transaction-scoped Postgres advisory lock keyed by cycle_id so
 * two near-simultaneous approvals of the same product never race into duplicate
 * main_list_items rows or a lost-update on the merged quantity.
 */
async function approveItem(itemId, reviewerId) {
  return db.transaction(async (trx) => {
    const item = await trx('personal_list_items').where({ id: itemId }).first();
    if (!item) throw httpError('Item not found', 404);
    if (item.status === 'approved') throw httpError('Item is already approved', 409);

    const cycle = await trx('shopping_cycles').where({ id: item.cycle_id }).first();
    if (!cycle || cycle.status !== 'open') {
      throw httpError('הרשימה הראשית נעולה — לא ניתן לאשר פריטים כרגע', 409);
    }

    await trx.raw('SELECT pg_advisory_xact_lock(?)', [item.cycle_id]);

    const normalized = normalizeProductName(item.product_name);
    let existing = await trx('main_list_items')
      .where({ cycle_id: item.cycle_id, product_name_normalized: normalized })
      .first();

    if (!existing) {
      const candidates = await trx('main_list_items')
        .where({ cycle_id: item.cycle_id })
        .select('id', 'product_name_normalized');
      const fuzzyMatch = findFuzzyMatch(normalized, candidates);
      if (fuzzyMatch) {
        existing = await trx('main_list_items').where({ id: fuzzyMatch.id }).first();
      }
    }

    let mainListItemId;
    if (existing) {
      await trx('main_list_items')
        .where({ id: existing.id })
        .update({
          quantity: mergeQuantities(existing.quantity, item.quantity),
          notes: mergeNotes(existing.notes, item.notes),
          updated_at: trx.fn.now(),
        });
      mainListItemId = existing.id;
    } else {
      const category = await resolveCategory(trx, normalized);
      const inserted = await trx('main_list_items')
        .insert({
          cycle_id: item.cycle_id,
          product_name: item.product_name.trim(),
          product_name_normalized: normalized,
          quantity: item.quantity || null,
          notes: item.notes || null,
          category,
        })
        .returning('id');
      mainListItemId = inserted[0].id ?? inserted[0];
    }

    await trx('main_list_item_sources').insert({
      main_list_item_id: mainListItemId,
      personal_list_item_id: item.id,
      contributed_by_user_id: item.user_id,
    });

    await trx('personal_list_items')
      .where({ id: item.id })
      .update({
        status: 'approved',
        reviewed_by_user_id: reviewerId,
        reviewed_at: trx.fn.now(),
        main_list_item_id: mainListItemId,
        updated_at: trx.fn.now(),
      });

    return trx('personal_list_items').where({ id: item.id }).first();
  });
}

async function rejectItem(itemId, reviewerId) {
  const item = await db('personal_list_items').where({ id: itemId }).first();
  if (!item) throw httpError('Item not found', 404);
  if (item.status !== 'pending') throw httpError('Only pending items can be rejected', 409);

  await db('personal_list_items')
    .where({ id: itemId })
    .update({
      status: 'rejected',
      reviewed_by_user_id: reviewerId,
      reviewed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  return db('personal_list_items').where({ id: itemId }).first();
}

async function lockCycle(cycleId, userId) {
  const cycle = await db('shopping_cycles').where({ id: cycleId }).first();
  if (!cycle) throw httpError('Cycle not found', 404);
  if (cycle.status !== 'open') throw httpError('הרשימה כבר נעולה', 409);

  await db('shopping_cycles')
    .where({ id: cycleId })
    .update({ status: 'locked', locked_at: db.fn.now(), locked_by_user_id: userId });

  return db('shopping_cycles').where({ id: cycleId }).first();
}

async function unlockCycle(cycleId) {
  const cycle = await db('shopping_cycles').where({ id: cycleId }).first();
  if (!cycle) throw httpError('Cycle not found', 404);
  if (cycle.status !== 'locked') throw httpError('הרשימה אינה נעולה', 409);

  await db('shopping_cycles')
    .where({ id: cycleId })
    .update({ status: 'open', locked_at: null, locked_by_user_id: null });

  return db('shopping_cycles').where({ id: cycleId }).first();
}

/**
 * Lets a parent directly correct fields on already-approved/merged main list
 * items (product name, quantity, notes) -- e.g. fixing a typo after
 * approval, without having to reject and resubmit the whole item.
 */
async function updateMainListItems(cycleId, itemUpdates) {
  return db.transaction(async (trx) => {
    const cycle = await trx('shopping_cycles').where({ id: cycleId }).first();
    if (!cycle) throw httpError('Cycle not found', 404);

    for (const update of itemUpdates) {
      const productName = (update.productName || '').trim();
      if (!productName) throw httpError('שם המוצר הוא שדה חובה', 400);

      const item = await trx('main_list_items').where({ id: update.id, cycle_id: cycleId }).first();
      if (!item) throw httpError('פריט לא נמצא ברשימה הראשית', 404);

      const normalized = normalizeProductName(productName);
      const categoryChanged = update.category && CATEGORIES.some((c) => c.key === update.category) && update.category !== item.category;
      const category = categoryChanged ? update.category : item.category;

      await trx('main_list_items')
        .where({ id: item.id })
        .update({
          product_name: productName,
          product_name_normalized: normalized,
          quantity: (update.quantity || '').trim() || null,
          notes: (update.notes || '').trim() || null,
          category,
          updated_at: trx.fn.now(),
        });

      // A parent explicitly picking a category is the strongest signal we have --
      // remember it so future items with this exact name skip the keyword guess.
      if (categoryChanged) {
        await learnCategory(trx, normalized, category);
      }
    }

    return trx('main_list_items').where({ cycle_id: cycleId }).orderBy('product_name', 'asc');
  });
}

/**
 * Submits the final purchase report, closes the cycle, and resets for the next one:
 * - main_list_items / main_list_item_sources for the cycle are cleared (history lives
 *   on via purchase_report_items, which is self-contained).
 * - approved personal_list_items are cleared (already captured in the report).
 * - pending/rejected personal_list_items are carried forward into the new cycle
 *   (re-parented, not deleted) so nobody loses in-progress work.
 */
async function submitPurchaseReport(cycleId, reportEntries) {
  return db.transaction(async (trx) => {
    const cycle = await trx('shopping_cycles').where({ id: cycleId }).first();
    if (!cycle) throw httpError('Cycle not found', 404);
    if (cycle.status !== 'locked') throw httpError('יש לנעול את הרשימה לפני הגשת דיווח קניות', 409);

    const mainListItems = await trx('main_list_items').where({ cycle_id: cycleId });
    const entryByMainListItemId = new Map(reportEntries.map((e) => [Number(e.mainListItemId), e]));

    const rows = mainListItems.map((mli) => {
      const entry = entryByMainListItemId.get(mli.id) || {};
      return {
        cycle_id: cycleId,
        product_name: mli.product_name,
        quantity: mli.quantity,
        bought: Boolean(entry.bought),
        note: entry.note || null,
      };
    });
    if (rows.length > 0) {
      await trx('purchase_report_items').insert(rows);
    }

    await trx('shopping_cycles')
      .where({ id: cycleId })
      .update({ status: 'completed', completed_at: trx.fn.now() });

    // Order matters: approved personal_list_items reference main_list_items via
    // main_list_item_id (plain FK, no cascade), so they must go first.
    await trx('main_list_item_sources')
      .whereIn('main_list_item_id', trx('main_list_items').select('id').where({ cycle_id: cycleId }))
      .del();
    await trx('personal_list_items').where({ cycle_id: cycleId, status: 'approved' }).del();
    await trx('main_list_items').where({ cycle_id: cycleId }).del();

    const insertedCycle = await trx('shopping_cycles').insert({ status: 'open' }).returning('id');
    const newCycleId = insertedCycle[0].id ?? insertedCycle[0];

    await trx('personal_list_items')
      .where({ cycle_id: cycleId })
      .whereIn('status', ['pending', 'rejected'])
      .update({ cycle_id: newCycleId });

    return { completedCycleId: cycleId, newCycleId, reportItems: rows };
  });
}

module.exports = {
  getCurrentCycle,
  approveItem,
  rejectItem,
  lockCycle,
  unlockCycle,
  updateMainListItems,
  submitPurchaseReport,
};
