const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');

const router = express.Router();

router.use(requireUser);

async function loadCycleSummaries() {
  const cycles = await db('shopping_cycles')
    .where({ status: 'completed' })
    .orderBy('completed_at', 'desc');

  const summaries = await Promise.all(
    cycles.map(async (cycle) => {
      const rows = await db('purchase_report_items').where({ cycle_id: cycle.id });
      const bought = rows.filter((r) => r.bought).length;
      return { cycle, total: rows.length, bought, notBought: rows.length - bought };
    })
  );
  return summaries;
}

router.get('/history', async (req, res) => {
  const summaries = await loadCycleSummaries();
  res.render('historyList', {
    title: 'היסטוריה',
    activeTab: 'history',
    currentUser: req.user,
    summaries,
  });
});

router.get('/api/history', async (req, res) => {
  const summaries = await loadCycleSummaries();
  res.json({ summaries });
});

async function loadCycleDetail(cycleId) {
  const cycle = await db('shopping_cycles').where({ id: cycleId, status: 'completed' }).first();
  if (!cycle) return null;
  const items = await db('purchase_report_items').where({ cycle_id: cycleId }).orderBy('product_name', 'asc');
  return { cycle, items };
}

router.get('/history/:cycleId', async (req, res) => {
  const detail = await loadCycleDetail(req.params.cycleId);
  if (!detail) {
    return res.status(404).render('error', { message: 'מחזור זה לא נמצא בהיסטוריה', currentUser: req.user });
  }
  res.render('historyDetail', {
    title: 'פרטי מחזור',
    activeTab: 'history',
    currentUser: req.user,
    cycle: detail.cycle,
    items: detail.items,
  });
});

router.get('/api/history/:cycleId', async (req, res) => {
  const detail = await loadCycleDetail(req.params.cycleId);
  if (!detail) return res.status(404).json({ error: 'מחזור זה לא נמצא בהיסטוריה' });
  res.json(detail);
});

module.exports = router;
