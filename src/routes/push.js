const express = require('express');
const requireUser = require('../middleware/requireUser');
const { getPublicKey, saveSubscription, removeSubscription } = require('../services/pushService');

const router = express.Router();

router.use(requireUser);

// Every signed-in user can subscribe to push -- notifications now include
// broadcasts (purchase report done, system messages) meant for everyone,
// not just the parent-only "item awaiting approval" trigger.
router.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

router.post('/api/push/subscribe', async (req, res) => {
  const subscription = req.body.subscription;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'מנוי התראות לא תקין' });
  }
  await saveSubscription(req.user.id, subscription);
  res.status(201).json({ ok: true });
});

router.post('/api/push/unsubscribe', async (req, res) => {
  const endpoint = req.body.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'חסרה כתובת המנוי' });
  await removeSubscription(endpoint);
  res.status(204).end();
});

module.exports = router;
