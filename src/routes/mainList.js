const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const { getCurrentCycle, lockCycle, unlockCycle, updateMainListItems } = require('../services/cycleService');
const { CATEGORIES, categoryLabel } = require('../services/categoryService');

const router = express.Router();

router.use(requireUser);

router.get('/main-list', async (req, res) => {
  const cycle = await getCurrentCycle();
  const items = await db('main_list_items').where({ cycle_id: cycle.id }).orderBy('product_name', 'asc');
  res.render('mainList', {
    title: 'רשימה ראשית',
    activeTab: 'main-list',
    currentUser: req.user,
    items,
    cycle,
    categories: CATEGORIES,
    categoryLabel,
  });
});

router.get('/api/main-list', async (req, res) => {
  const cycle = await getCurrentCycle();
  const items = await db('main_list_items').where({ cycle_id: cycle.id }).orderBy('product_name', 'asc');
  res.json({ items, cycle: { id: cycle.id, status: cycle.status } });
});

router.post('/api/main-list/lock', requireParent, async (req, res) => {
  try {
    const cycle = await getCurrentCycle();
    const updated = await lockCycle(cycle.id, req.user.id);
    res.json({ cycle: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/api/main-list/unlock', requireParent, async (req, res) => {
  try {
    const cycle = await getCurrentCycle();
    const updated = await unlockCycle(cycle.id);
    res.json({ cycle: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/api/main-list/items', requireParent, async (req, res) => {
  try {
    const cycle = await getCurrentCycle();
    const updates = Array.isArray(req.body.items) ? req.body.items : [];
    const items = await updateMainListItems(cycle.id, updates);
    res.json({ items });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
