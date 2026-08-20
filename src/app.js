require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');

const sessionRoutes = require('./routes/session');
const myListRoutes = require('./routes/myList');
const reviewRoutes = require('./routes/review');
const mainListRoutes = require('./routes/mainList');
const purchaseReportRoutes = require('./routes/purchaseReport');
const historyRoutes = require('./routes/history');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(
  cookieSession({
    name: 'shopping-session',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  })
);

app.use(sessionRoutes);
app.use(myListRoutes);
app.use(reviewRoutes);
app.use(mainListRoutes);
app.use(purchaseReportRoutes);
app.use(historyRoutes);

app.use((req, res) => {
  res.status(404).render('error', { message: 'העמוד המבוקש לא נמצא', currentUser: req.user });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    message: err.message || 'משהו השתבש בשרת',
    currentUser: req.user,
  });
});

module.exports = app;
