const express = require('express');
const requireUser = require('../middleware/requireUser');
const requireParent = require('../middleware/requireParent');
const {
  createSystemMessage,
  getUnseenSystemMessageForUser,
  acknowledgeSystemMessage,
} = require('../services/systemMessageService');
const { notifySystemMessage } = require('../services/pushService');

const router = express.Router();

router.use(requireUser);

router.get('/api/system-message/unseen', async (req, res) => {
  const message = await getUnseenSystemMessageForUser(req.user.id);
  res.json({ message });
});

router.post('/api/system-message/ack', async (req, res) => {
  const messageId = Number(req.body.id);
  if (!messageId) return res.status(400).json({ error: 'חסר מזהה הודעה' });
  await acknowledgeSystemMessage(req.user.id, messageId);
  res.status(204).end();
});

router.post('/api/system-message/send', requireParent, async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'יש להקליד הודעה' });
  if (text.length > 500) return res.status(400).json({ error: 'ההודעה ארוכה מדי (עד 500 תווים)' });

  await createSystemMessage(req.user.id, text);
  res.json({ ok: true });

  notifySystemMessage({ senderUserId: req.user.id, text }).catch((err) =>
    console.error('push notify failed:', err.message)
  );
});

module.exports = router;
