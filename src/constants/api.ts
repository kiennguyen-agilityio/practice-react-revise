const URL_API = {
  BASE_URL: process.env.VITE_BASE_URL,
  CATEGORY_URL: '/categories',
};

const CATEGORIES_API = `${URL_API.BASE_URL}${URL_API.CATEGORY_URL}`;

export { CATEGORIES_API };
