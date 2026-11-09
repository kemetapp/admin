/**
 * صور محلية للعرض فقط (Unsplash) — تتبدل بصور المطاعم الحقيقية بعد الـMVP.
 */
export const food = {
  grill: require('../../assets/food/grill.jpg'),
  rice: require('../../assets/food/rice.jpg'),
  chicken: require('../../assets/food/chicken.jpg'),
  shawarma: require('../../assets/food/shawarma.jpg'),
  falafel: require('../../assets/food/falafel.jpg'),
  dessert: require('../../assets/food/dessert.jpg'),
  juice: require('../../assets/food/juice.jpg'),
  salad: require('../../assets/food/salad.jpg'),
  seafood: require('../../assets/food/seafood.jpg'),
  pizza: require('../../assets/food/pizza.jpg'),
  burger: require('../../assets/food/burger.jpg'),
  pasta: require('../../assets/food/pasta.jpg'),
  coffee: require('../../assets/food/coffee.jpg'),
  sandwich: require('../../assets/food/sandwich.jpg'),
  resto: require('../../assets/food/resto.jpg'),
} as const;

export type FoodKey = keyof typeof food;
