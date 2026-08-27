const webpush = require('web-push');
const db = require('../db/knex');

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:dekners@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  // eslint-disable-next-line no-console
  console.warn('VAPID keys not set -- push notifications are disabled until VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are configured.');
}

function getPublicKey() {
  return VAPID_PUBLIC_KEY || null;
}

/**
 * Only parents ever get notified, and a parent never gets notified about
 * their own submission -- if the submitter happens to be one of the two
 * parents, they're simply filtered out of the (two-item) parents list,
 * leaving just "the other parent" as the target.
 */
function selectTargetParentUserIds(allParentUsers, submitterUserId) {
  return allParentUsers.filter((parent) => parent.id !== submitterUserId).map((parent) => parent.id);
}

async function saveSubscription(userId, subscription) {
  const { endpoint, keys } = subscription;
  await db('push_subscriptions')
    .insert({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflict('endpoint')
    .merge(['user_id', 'p256dh', 'auth']);
}

async function removeSubscription(endpoint) {
  await db('push_subscriptions').where({ endpoint }).del();
}

async function sendToUser(userId, payload) {
  const subscriptions = await db('push_subscriptions').where({ user_id: userId });
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 means the browser revoked or expired this subscription -- clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db('push_subscriptions').where({ id: sub.id }).del();
        } else {
          // eslint-disable-next-line no-console
          console.error('push send failed:', err.message);
        }
      }
    })
  );
}

/**
 * Notifies the appropriate parent(s) that an item now needs review --
 * either a freshly submitted item or one just resubmitted after rejection.
 */
async function notifyParentsOfPendingItem({ submitterUserId, submitterName, productName }) {
  if (!getPublicKey()) return; // push not configured; silently skip

  const parents = await db('users').where({ role: 'parent' });
  const targetIds = selectTargetParentUserIds(parents, submitterUserId);
  if (targetIds.length === 0) return;

  const payload = {
    title: 'רשימת קניות',
    body: `${submitterName}: פריט חדש "${productName}" מחכה לאישור`,
    url: '/review',
  };

  await Promise.all(targetIds.map((userId) => sendToUser(userId, payload)));
}

/**
 * Broadcasts a payload to every user except one (e.g. whoever triggered the
 * notification), regardless of role.
 */
async function notifyAllExcept(excludeUserId, payload) {
  if (!getPublicKey()) return; // push not configured; silently skip

  const recipients = await db('users').whereNot({ id: excludeUserId });
  await Promise.all(recipients.map((user) => sendToUser(user.id, payload)));
}

/**
 * Notifies everyone except the reporting parent that purchase reporting is
 * done, summarizing what was bought and what wasn't.
 */
async function notifyPurchaseReportCompleted({ reporterUserId, reporterName, reportItems, cycleId }) {
  const bought = reportItems.filter((item) => item.bought).map((item) => item.product_name);
  const notBought = reportItems.filter((item) => !item.bought).map((item) => item.product_name);

  const lines = [`${reporterName} סיימו לדווח על הקניות ✅`];
  lines.push(bought.length ? `נרכש: ${bought.join(', ')}` : 'שום דבר לא נרכש');
  if (notBought.length) lines.push(`לא נרכש: ${notBought.join(', ')}`);

  await notifyAllExcept(reporterUserId, {
    title: 'רשימת קניות',
    body: lines.join('\n'),
    url: `/history/${cycleId}`,
  });
}

/**
 * Keyword -> emoji rules used to pick a few emojis relevant to a system
 * message's content; falls back to a generic megaphone when nothing matches.
 */
const SYSTEM_MESSAGE_EMOJI_RULES = [
  { pattern: /דחוף|חשוב|עכשיו|מיידי|תשומת לב/, emoji: '⚠️' },
  { pattern: /בטל|ביטול|נדחה|נדחית|לא נצא/, emoji: '❌' },
  { pattern: /מבצע|הנחה|זול|חיסכון|מחיר/, emoji: '🏷️' },
  { pattern: /תזכורת|לזכור|תשכחו/, emoji: '⏰' },
  { pattern: /שעה|מחר|היום|בערב|בבוקר|בצהריים|מאוחר|מוקדם/, emoji: '🕒' },
  { pattern: /גשם|מזג האוויר|קור|חום|שלג/, emoji: '☔' },
  { pattern: /חג|חופש|חגיגה|מסיבה|יום הולדת/, emoji: '🎉' },
  { pattern: /תודה|כל הכבוד|יופי|מעולה|כיף/, emoji: '🙏' },
  { pattern: /סופר|קניות|חנות|שוק|מכולת/, emoji: '🛒' },
];

function pickRelevantEmojis(text) {
  const matches = SYSTEM_MESSAGE_EMOJI_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.emoji);
  const unique = [...new Set(matches)].slice(0, 3);
  return unique.length ? unique.join(' ') : '📢';
}

/**
 * Broadcasts a free-text system message from a parent to everyone else,
 * prefixed with the fixed "הודעת מערכת:" label and a few relevant emojis.
 */
async function notifySystemMessage({ senderUserId, text }) {
  const emojis = pickRelevantEmojis(text);
  await notifyAllExcept(senderUserId, {
    title: 'רשימת קניות',
    body: `הודעת מערכת: ${text} ${emojis}`,
    url: '/main-list',
  });
}

module.exports = {
  getPublicKey,
  selectTargetParentUserIds,
  saveSubscription,
  removeSubscription,
  notifyParentsOfPendingItem,
  notifyPurchaseReportCompleted,
  notifySystemMessage,
};
