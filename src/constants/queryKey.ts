export const QUERY_KEYS = {
  CATEGORIES: ['categories'],
  FOODS: ['foods'],
  FOOD_BY_ID: (id: string) => [QUERY_KEYS.FOODS, id],
};
