/** مفاتيح صور الأكل — نفس مفاتيح `mobile/src/theme/images.ts`. */
export const FOOD_KEYS = [
  'grill',
  'rice',
  'chicken',
  'shawarma',
  'falafel',
  'dessert',
  'juice',
  'salad',
  'seafood',
  'pizza',
  'burger',
  'pasta',
  'coffee',
  'sandwich',
  'resto',
] as const;

export const FOOD_LABELS: Record<string, string> = {
  grill: 'مشويات',
  rice: 'أرز / كشري',
  chicken: 'فراخ',
  shawarma: 'شاورما',
  falafel: 'طعمية',
  dessert: 'حلويات',
  juice: 'عصير',
  salad: 'سلطة',
  seafood: 'بحري',
  pizza: 'بيتزا',
  burger: 'برجر',
  pasta: 'مكرونة',
  coffee: 'قهوة',
  sandwich: 'ساندوتش',
  resto: 'صورة مطعم',
};

export const FOOD_EMOJI: Record<string, string> = {
  grill: '🍖',
  rice: '🍚',
  chicken: '🍗',
  shawarma: '🌯',
  falafel: '🧆',
  dessert: '🍰',
  juice: '🥤',
  salad: '🥗',
  seafood: '🦐',
  pizza: '🍕',
  burger: '🍔',
  pasta: '🍝',
  coffee: '☕',
  sandwich: '🥪',
  resto: '🏛️',
};

export const FOOD_OPTIONS = FOOD_KEYS.map((key) => ({
  value: key,
  label: `${FOOD_EMOJI[key]} ${FOOD_LABELS[key]}`,
}));

export const emojiFor = (key: unknown) =>
  typeof key === 'string' ? (FOOD_EMOJI[key] ?? '🍽️') : '🍽️';
