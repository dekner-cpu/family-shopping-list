module.exports = function requireParent(req, res, next) {
  if (!req.user || req.user.role !== 'parent') {
    if (req.path.startsWith('/api')) {
      return res.status(403).json({ error: 'פעולה זו זמינה להורים בלבד' });
    }
    return res.status(403).render('error', { message: 'עמוד זה זמין להורים בלבד (יעל / שחר)', currentUser: req.user });
  }
  next();
};
