const express = require('express');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const { getPublicKey, saveSubscription, removeSubscription } = require('../services/pushService');

const router = express.Router();

router.use(requireUser);

// Only parents ever subscribe to push (they're the only recipients), but
// exposing the public key itself is harmless -- gate the routes that
// actually store/remove subscriptions, not this one.
router.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

router.post('/api/push/subscribe', requireParent, async (req, res) => {
  const subscription = req.body.subscription;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'מנוי התראות לא תקין' });
  }
  await saveSubscription(req.user.id, subscription);
  res.status(201).json({ ok: true });
});

router.post('/api/push/unsubscribe', requireParent, async (req, res) => {
  const endpoint = req.body.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'חסרה כתובת המנוי' });
  await removeSubscription(endpoint);
  res.status(204).end();
});

module.exports = router;
