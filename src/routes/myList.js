const express = require('express');
const db = require('../db/knex');
const requireUser = require('../middleware/requireUser');
const { getCurrentCycle } = require('../services/cycleService');

const router = express.Router();

router.use(requireUser);

router.get('/my-list', async (req, res) => {
  const cycle = await getCurrentCycle();
  const items = await db('personal_list_items')
    .where({ cycle_id: cycle.id, user_id: req.user.id })
    .orderBy('created_at', 'asc');

  res.render('myList', {
    title: 'הרשימה שלי',
    activeTab: 'my-list',
    currentUser: req.user,
    items,
    cycleLocked: cycle.status !== 'open',
  });
});

function validateProductName(body, res) {
  const productName = (body.productName || '').trim();
  if (!productName) {
    res.status(400).json({ error: 'שם המוצר הוא שדה חובה' });
    return null;
  }
  return productName;
}

router.post('/api/items', async (req, res) => {
  const productName = validateProductName(req.body, res);
  if (!productName) return;

  const cycle = await getCurrentCycle();
  const [item] = await db('personal_list_items')
    .insert({
      cycle_id: cycle.id,
      user_id: req.user.id,
      product_name: productName,
      quantity: (req.body.quantity || '').trim() || null,
      notes: (req.body.notes || '').trim() || null,
      status: 'pending',
    })
    .returning('*');

  res.status(201).json({ item });
});

router.put('/api/items/:id', async (req, res) => {
  const item = await db('personal_list_items').where({ id: req.params.id }).first();
  if (!item) return res.status(404).json({ error: 'הפריט לא נמצא' });
  if (item.user_id !== req.user.id) return res.status(403).json({ error: 'ניתן לערוך רק פריטים שהעלית בעצמך' });
  if (item.status === 'approved') return res.status(409).json({ error: 'לא ניתן לערוך פריט שכבר אושר' });

  const productName = validateProductName(req.body, res);
  if (!productName) return;

  // Any save on a rejected item counts as resubmitting it — clears the rejected flag.
  const nextStatus = item.status === 'rejected' ? 'pending' : item.status;

  const [updated] = await db('personal_list_items')
    .where({ id: item.id })
    .update({
      product_name: productName,
      quantity: (req.body.quantity || '').trim() || null,
      notes: (req.body.notes || '').trim() || null,
      status: nextStatus,
      updated_at: db.fn.now(),
    })
    .returning('*');

  res.json({ item: updated, resubmitted: item.status === 'rejected' });
});

router.delete('/api/items/:id', async (req, res) => {
  const item = await db('personal_list_items').where({ id: req.params.id }).first();
  if (!item) return res.status(404).json({ error: 'הפריט לא נמצא' });
  if (item.user_id !== req.user.id) return res.status(403).json({ error: 'ניתן למחוק רק פריטים שהעלית בעצמך' });
  if (item.status === 'approved') return res.status(409).json({ error: 'לא ניתן למחוק פריט שכבר אושר' });

  await db('personal_list_items').where({ id: item.id }).del();
  res.status(204).end();
});

module.exports = router;
