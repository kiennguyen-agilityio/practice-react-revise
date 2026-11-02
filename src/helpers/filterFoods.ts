// models
import { Food } from '@app/models/food';

const filterFoodsByName = (foods: Food[], searchTerm: string): Food[] => {
  const keyword = searchTerm.trim().toLowerCase();

  if (!keyword) return foods;

  return foods.filter(({ name }) => name.toLowerCase().includes(keyword));
};

export { filterFoodsByName };
