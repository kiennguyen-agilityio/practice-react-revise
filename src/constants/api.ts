const URL_API = {
  BASE_URL: process.env.VITE_BASE_URL,
  CATEGORY_URL: 'categories',
  FOOD_URL: 'foods',
};

const CATEGORIES_API = `${URL_API.BASE_URL}${URL_API.CATEGORY_URL}`;
const FOOD_API = `${URL_API.BASE_URL}${URL_API.FOOD_URL}`;

export { FOOD_API, CATEGORIES_API };
