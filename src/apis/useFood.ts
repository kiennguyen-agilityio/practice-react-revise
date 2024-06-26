import { UseQueryOptions, useQuery } from '@tanstack/react-query';

// constants
import { QUERY_KEYS } from '@app/constants/queryKey';
import { FOOD_API } from '@app/constants/api';

// helpers
import { CustomErrors, customErrors } from '@app/helpers/handleError';

// models
import { Food } from '@app/models/food';

export const fetchFoodByCategorySlug = async (
  categorySlug: string,
): Promise<Food[]> => {
  try {
    const queryString = categorySlug ? `?categorySlug=${categorySlug}` : '';

    const response = await fetch(`${FOOD_API}${queryString}`, {
      headers: { 'content-type': 'application/json' },
    });

    const data = await response.json();

    const listFoods = customErrors(response, data);

    return listFoods;
  } catch (error) {
    throw error as CustomErrors;
  }
};

const useFoodList = (categorySlug: string) => {
  const {
    data = [],
    error,
    isLoading,
    refetch,
  } = useQuery<Food[], Error>({
    queryKey: [QUERY_KEYS.FOODS, categorySlug],
    queryFn: () => fetchFoodByCategorySlug(categorySlug),
  } as UseQueryOptions<Food[], Error>);

  return { data, isLoading, error, refetch };
};

export default useFoodList;

export const getFoodById = async (id: string): Promise<Food> => {
  try {
    const response = await fetch(`${FOOD_API}/${id}`, {
      headers: { 'content-type': 'application/json' },
    });

    const data = await response.json();

    const food = customErrors(response, data);

    return food;
  } catch (error) {
    throw error as CustomErrors;
  }
};

export const useFoodById = (id: string) => {
  const { data, error, isLoading } = useQuery<Food, Error>({
    queryKey: QUERY_KEYS.FOOD_BY_ID(id),
    queryFn: () => getFoodById(id),
  } as UseQueryOptions<Food, Error>);

  return { data, isLoading, error };
};
