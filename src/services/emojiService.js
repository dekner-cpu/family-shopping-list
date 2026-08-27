/**
 * Keyword -> emoji rules used to pick emojis relevant to a system message's
 * content. Always returns 2-3 emojis; if fewer than two keywords match, pads
 * with sensible shopping-list defaults so every message gets a couple.
 */
const KEYWORD_EMOJI_RULES = [
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

const DEFAULT_EMOJIS = ['🛒', '📌', '❗'];

function pickRelevantEmojis(text) {
  const matched = KEYWORD_EMOJI_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.emoji);
  const selected = [...new Set(matched)].slice(0, 3);

  for (const fallback of DEFAULT_EMOJIS) {
    if (selected.length >= 2) break;
    if (!selected.includes(fallback)) selected.push(fallback);
  }

  return selected;
}

module.exports = { pickRelevantEmojis };
