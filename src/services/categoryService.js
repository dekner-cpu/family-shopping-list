/**
 * Categories in supermarket-aisle order, each with keywords used to guess a
 * product's category from its (normalized) name. "other" is the catch-all
 * and always sorts last, regardless of its position here.
 */
const CATEGORIES = [
  {
    key: 'fruits_vegetables',
    label: 'פירות וירקות',
    keywords: [
      'תפוח', 'תפוחים', 'בננה', 'בננות', 'תפוז', 'תפוזים', 'לימון', 'לימונים', 'אגס', 'אגסים',
      'ענבים', 'אבטיח', 'מלון', 'אפרסק', 'אפרסקים', 'שזיף', 'שזיפים', 'תות', 'תותים', 'מנגו',
      'אננס', 'קיווי', 'רימון', 'רימונים', 'אבוקדו', 'משמש', 'תמר', 'תמרים', 'פירות יער',
      'עגבניה', 'עגבניות', 'עגבנייה', 'מלפפון', 'מלפפונים', 'פלפל', 'פלפלים', 'חסה', 'כרוב',
      'גזר', 'גזרים', 'בצל', 'בצלים', 'שום', 'תפוח אדמה', 'תפוחי אדמה', 'בטטה', 'בטטות',
      'קישוא', 'קישואים', 'חציל', 'חצילים', 'ברוקולי', 'כרובית', 'סלרי', 'פטרוזיליה', 'כוסברה',
      'שמיר', 'נענע', 'פטריות', 'תירס טרי', 'אפונה', 'שעועית ירוקה', 'צנון', 'סלק', 'ירקות',
      'פירות', 'אבוקדו', 'לפת', 'ארטישוק',
    ],
  },
  {
    key: 'bakery',
    label: 'לחם ומאפים',
    keywords: [
      'לחם', 'פיתה', 'פיתות', 'לחמניה', 'לחמניות', 'באגט', 'חלה', 'חלות', 'קרואסון', 'קרואסונים',
      'עוגה', 'עוגות', 'עוגיה', 'עוגיות', 'ביסקוויט', 'ביסקוויטים', 'טוסט', 'מצה', 'מצות',
      'בורקס', 'בורקסים', 'פוקצ\'ה', 'רול', 'רולים', 'מאפה', 'מאפים',
    ],
  },
  {
    key: 'dairy',
    label: 'מקררים (חלב, גבינות וביצים)',
    keywords: [
      'חלב', 'גבינה', 'גבינות', 'יוגורט', 'יוגורטים', 'קוטג\'', 'שמנת', 'חמאה', 'מרגרינה',
      'ביצה', 'ביצים', 'פודינג', 'מעדן', 'גבינה צהובה', 'גבינה לבנה', 'חלמון', 'שוקו בקרטון',
    ],
  },
  {
    key: 'meat_fish',
    label: 'בשר, עוף ודגים',
    keywords: [
      'עוף', 'עופות', 'בשר', 'בקר', 'טחון', 'קציצות', 'נקניק', 'נקניקיות', 'נקניקים',
      'המבורגר', 'המבורגרים', 'שניצל', 'שניצלים', 'כבד', 'הודו', 'חזה עוף', 'ירך עוף', 'כנפיים',
      'דג', 'דגים', 'סלמון', 'טונה טרייה', 'פילה', 'קבב', 'צלי', 'אנטריקוט', 'סטייק', 'פרגית',
    ],
  },
  {
    key: 'frozen',
    label: 'קפואים',
    keywords: [
      'קפוא', 'קפואים', 'קפואה', 'גלידה', 'גלידות', 'פיצה קפואה', 'ירקות קפואים', 'שניצל קפוא',
      'צ\'יפס קפוא', 'וופל קפוא', 'קרח', 'בלינצ\'ס',
    ],
  },
  {
    key: 'pantry',
    label: 'מזווה',
    keywords: [
      'אורז', 'פסטה', 'קמח', 'סוכר', 'מלח', 'שמן', 'שמן זית', 'טחינה', 'חומוס', 'קטשופ',
      'מיונז', 'חרדל', 'רוטב', 'רטבים', 'שימורי', 'שימורים', 'עדשים', 'קינואה', 'בורגול',
      'סולת', 'אבקת אפיה', 'שמרים', 'דבש', 'ריבה', 'חמאת בוטנים', 'קורנפלקס', 'דגני בוקר',
      'תבלין', 'תבלינים', 'פלפל שחור', 'כמון', 'פפריקה', 'קינמון', 'סויה', 'חומץ', 'קוסקוס',
      'פתיתים', 'טונה בשימורים', 'תירס בקופסה',
    ],
  },
  {
    key: 'beverages',
    label: 'משקאות',
    keywords: [
      'מים', 'מים מינרלים', 'מיץ', 'מיצים', 'קולה', 'סודה', 'בירה', 'יין', 'וודקה', 'קפה',
      'תה', 'משקה', 'משקאות', 'אנרגיה', 'שוקו בקרטון', 'שוקו קר', 'סיידר', 'לימונדה',
    ],
  },
  {
    key: 'snacks',
    label: 'חטיפים וממתקים',
    keywords: [
      'חטיף', 'חטיפים', 'במבה', 'ביסלי', 'שוקולד', 'שוקולדים', 'ממתק', 'ממתקים', 'פופקורן',
      'גומי', 'וופלים', 'טורטיה', 'צ\'יפס', 'תפוצ\'יפס', 'דוריטוס', 'צ\'יטוס', 'בוטנים', 'אגוזים',
      'גרעינים', 'עוגיות מלוחות', 'קרקר', 'קרקרים',
    ],
  },
  {
    key: 'cleaning',
    label: 'חומרי ניקוי',
    keywords: [
      'אקונומיקה', 'סבון כלים', 'מרכך כביסה', 'אבקת כביסה', 'נוזל כביסה', 'מגבונים', 'מגבון',
      'ניקוי', 'חומר ניקוי', 'ספריי ניקוי', 'כלור', 'מטליות', 'נייר סופג', 'שקיות זבל',
      'שקית זבל', 'סבון רצפות', 'אבקת שטיפה', 'כפפות',
    ],
  },
  {
    key: 'toiletries',
    label: 'טואלטיקה ופארם',
    keywords: [
      'שמפו', 'מרכך שיער', 'סבון גוף', 'ג\'ל רחצה', 'משחת שיניים', 'מברשת שיניים', 'דאודורנט',
      'נייר טואלט', 'טישו', 'טישיו', 'פד', 'פדים', 'טמפון', 'טמפונים', 'קרם', 'קרם הגנה',
      'תחבושת', 'סבון ידיים', 'חוט דנטלי', 'מסטיק', 'כדורים', 'תרופה', 'תרופות', 'ויטמין',
      'ויטמינים',
    ],
  },
  {
    key: 'baby',
    label: 'תינוקות',
    keywords: [
      'חיתול', 'חיתולים', 'מגבוני תינוקות', 'מטרנה', 'מוצץ', 'בקבוק תינוקות', 'מזון תינוקות',
      'טיטולים', 'פורמולה',
    ],
  },
  {
    key: 'disposables',
    label: 'חד פעמי ומוצרי בית',
    keywords: [
      'כוסות חד פעמי', 'צלחות חד פעמי', 'מפיות', 'שקיות', 'נייר אלומיניום', 'ניילון נצמד',
      'מקלות', 'קיסמים', 'נרות', 'סוללות', 'מגבות נייר',
    ],
  },
  { key: 'other', label: 'שונות', keywords: [] },
];

const DEFAULT_CATEGORY = 'other';

function categoryLabel(key) {
  const found = CATEGORIES.find((category) => category.key === key);
  return found ? found.label : CATEGORIES.find((category) => category.key === DEFAULT_CATEGORY).label;
}

function classifyByKeywords(normalizedName) {
  for (const category of CATEGORIES) {
    if (category.key === DEFAULT_CATEGORY) continue;
    if (category.keywords.some((keyword) => normalizedName.includes(keyword))) {
      return category.key;
    }
  }
  return DEFAULT_CATEGORY;
}

async function getLearnedCategory(db, productNameNormalized) {
  const row = await db('product_category_learned').where({ product_name_normalized: productNameNormalized }).first();
  return row ? row.category : null;
}

/**
 * Resolves a product's category: a prior manual correction (learned) always
 * wins over the generic keyword guess, so the classifier gets more accurate
 * over time as items get recategorized in "ערוך רשימה".
 */
async function resolveCategory(db, productNameNormalized) {
  const learned = await getLearnedCategory(db, productNameNormalized);
  if (learned) return learned;
  return classifyByKeywords(productNameNormalized);
}

async function learnCategory(db, productNameNormalized, category) {
  await db('product_category_learned')
    .insert({ product_name_normalized: productNameNormalized, category, updated_at: db.fn.now() })
    .onConflict('product_name_normalized')
    .merge(['category', 'updated_at']);
}

function groupItemsByCategory(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = item.category || DEFAULT_CATEGORY;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(item);
  }

  return CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    items: (byKey.get(category.key) || []).sort((a, b) => a.product_name.localeCompare(b.product_name, 'he')),
  })).filter((group) => group.items.length > 0);
}

module.exports = {
  CATEGORIES,
  DEFAULT_CATEGORY,
  categoryLabel,
  classifyByKeywords,
  resolveCategory,
  learnCategory,
  groupItemsByCategory,
};
