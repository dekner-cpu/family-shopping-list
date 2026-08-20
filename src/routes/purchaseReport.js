const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const { getCurrentCycle, submitPurchaseReport } = require('../services/cycleService');

const router = express.Router();

router.use(requireUser);

router.get('/purchase-report', async (req, res) => {
  const cycle = await getCurrentCycle();
  const items = cycle.status === 'locked'
    ? await db('main_list_items').where({ cycle_id: cycle.id }).orderBy('product_name', 'asc')
    : [];

  res.render('purchaseReportEntry', {
    title: 'דיווח קניות',
    activeTab: 'purchase-report',
    currentUser: req.user,
    cycle,
    items,
    canSubmit: cycle.status === 'locked' && req.user.role === 'parent',
  });
});

router.post('/api/purchase-report/submit', requireParent, async (req, res) => {
  try {
    const cycle = await getCurrentCycle();
    const entries = Array.isArray(req.body.items) ? req.body.items : [];
    const result = await submitPurchaseReport(cycle.id, entries);
    res.json({ redirect: `/history/${result.completedCycleId}` });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
