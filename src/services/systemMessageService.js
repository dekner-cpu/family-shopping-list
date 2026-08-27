const db = require('../db/knex');
const { pickRelevantEmojis } = require('./emojiService');

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Persists a system message and immediately marks it as seen by its own
 * sender -- they wrote it, so they shouldn't get the in-app popup for it.
 */
async function createSystemMessage(senderUserId, text) {
  const [message] = await db('system_messages').insert({ sender_user_id: senderUserId, text }).returning('*');

  await db('users').where({ id: senderUserId }).update({ last_seen_system_message_id: message.id });

  return message;
}

/**
 * Returns the most recent system message the given user hasn't acknowledged
 * yet, or null if they're caught up.
 */
async function getUnseenSystemMessageForUser(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw httpError('User not found', 404);

  let query = db('system_messages').orderBy('id', 'desc');
  if (user.last_seen_system_message_id) {
    query = query.where('id', '>', user.last_seen_system_message_id);
  }
  const latestUnseen = await query.first();
  if (!latestUnseen) return null;

  const sender = await db('users').where({ id: latestUnseen.sender_user_id }).first();
  const emojis = pickRelevantEmojis(latestUnseen.text).join(' ');
  return {
    id: latestUnseen.id,
    text: `${latestUnseen.text} ${emojis}`,
    senderName: sender ? sender.name : null,
    createdAt: latestUnseen.created_at,
  };
}

async function acknowledgeSystemMessage(userId, messageId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw httpError('User not found', 404);

  const nextSeenId = Math.max(user.last_seen_system_message_id || 0, Number(messageId) || 0);
  await db('users').where({ id: userId }).update({ last_seen_system_message_id: nextSeenId });
}

module.exports = {
  createSystemMessage,
  getUnseenSystemMessageForUser,
  acknowledgeSystemMessage,
};
