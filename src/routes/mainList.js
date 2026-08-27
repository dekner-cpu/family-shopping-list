const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const { getCurrentCycle, lockCycle, unlockCycle } = require('../services/cycleService');
const { notifySystemMessage } = require('../services/pushService');

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

router.post('/api/system-message/send', requireParent, async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'יש להקליד הודעה' });
  if (text.length > 500) return res.status(400).json({ error: 'ההודעה ארוכה מדי (עד 500 תווים)' });

  res.json({ ok: true });

  notifySystemMessage({ senderUserId: req.user.id, text }).catch((err) =>
    console.error('push notify failed:', err.message)
  );
});

module.exports = router;
