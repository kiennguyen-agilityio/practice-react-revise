// models
import { Food } from '@app/models/food';

const isFood = (item: unknown): item is Food =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as Food).id === 'string';

// A successful HTTP status does not guarantee a usable body, so the list is
// validated before it reaches the UI. Throwing surfaces the error state and
// never touches the favorites.
export const assertFoodList = (data: unknown): Food[] => {
  if (!Array.isArray(data) || !data.every(isFood)) {
    throw new Error('Invalid foods response');
  }

  return data;
};
