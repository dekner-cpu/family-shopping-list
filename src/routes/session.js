const express = require('express');
const db = require('../db/knex');

const router = express.Router();

router.get('/', async (req, res) => {
  if (req.session && req.session.userId) {
    const user = await db('users').where({ id: req.session.userId }).first();
    if (user) return res.redirect('/my-list');
  }
  const users = await db('users').orderBy('id');
  res.render('namePicker', { title: 'מי אתה?', users });
});

router.post('/session', async (req, res) => {
  const userId = Number(req.body.userId);
  const user = await db('users').where({ id: userId }).first();
  if (!user) return res.redirect('/');
  req.session.userId = user.id;
  res.redirect('/my-list');
});

router.post('/session/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

module.exports = router;
