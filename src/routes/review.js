const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const { getCurrentCycle, approveItem, rejectItem } = require('../services/cycleService');

const router = express.Router();

// Note: requireParent is applied per-route below, not router-wide here. Since every
// router in this app is mounted at "/" (see app.js), a router-wide requireParent would
// intercept every request that falls through earlier routers on its way to a *later*
// router (e.g. GET /main-list), not just this router's own /review-scoped routes.
router.use(requireUser);

async function loadQueue(cycleId) {
  return db('personal_list_items')
    .join('users', 'users.id', 'personal_list_items.user_id')
    .where({ 'personal_list_items.cycle_id': cycleId, 'personal_list_items.status': 'pending' })
    .orderBy('personal_list_items.created_at', 'asc')
    .select(
      'personal_list_items.*',
      'users.name as submitter_name'
    );
}

router.get('/review', requireParent, async (req, res) => {
  const cycle = await getCurrentCycle();
  const queue = await loadQueue(cycle.id);
  res.render('review', {
    title: 'תור אישורים',
    activeTab: 'review',
    currentUser: req.user,
    queue,
    cycleLocked: cycle.status !== 'open',
  });
});

router.get('/api/review-queue', requireParent, async (req, res) => {
  const cycle = await getCurrentCycle();
  const queue = await loadQueue(cycle.id);
  res.json({ queue, cycleLocked: cycle.status !== 'open' });
});

router.post('/api/items/:id/approve', requireParent, async (req, res) => {
  try {
    const item = await approveItem(req.params.id, req.user.id);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/api/items/:id/reject', requireParent, async (req, res) => {
  try {
    const item = await rejectItem(req.params.id, req.user.id);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
