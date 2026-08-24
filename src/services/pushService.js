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

module.exports = {
  getPublicKey,
  selectTargetParentUserIds,
  saveSubscription,
  removeSubscription,
  notifyParentsOfPendingItem,
};
