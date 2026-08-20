const db = require('../db/knex');

module.exports = async function requireUser(req, res, next) {
  const userId = req.session && req.session.userId;

  if (!userId) {
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ error: 'לא זוהה משתמש — יש לבחור משתמש מחדש' });
    }
    return res.redirect('/');
  }

  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    req.session = null;
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ error: 'משתמש לא נמצא' });
    }
    return res.redirect('/');
  }

  req.user = user;
  res.locals.currentUser = user;
  next();
};
