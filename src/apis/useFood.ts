import { UseQueryOptions, useQuery } from '@tanstack/react-query';

// constants
import { QUERY_KEYS } from '@app/constants/queryKey';
import { FOOD_API } from '@app/constants/api';

// helpers
import { CustomErrors, customErrors } from '@app/helpers/handleError';

// models
import { Food } from '@app/models/food';

interface RequestFood {
  categorySlug?: string;
}

export const fetchFoodByCategorySlug = async (
  params?: RequestFood,
): Promise<Food[]> => {
  try {
    const queryString =
      params &&
      `?${new URLSearchParams(params as Record<string, string>).toString()}`;

    const response = await fetch(
      `${FOOD_API}${queryString ? queryString : ''}`,
      {
        headers: { 'content-type': 'application/json' },
      },
    );

    const data = await response.json();

    const listFoods = customErrors(response, data);

    return listFoods;
  } catch (error) {
    throw error as CustomErrors;
  }
};

const useFoodList = (param?: object, key?: string) => {
  const {
    data = [],
    error,
    isLoading,
  } = useQuery<Food[], Error>({
    queryKey: [QUERY_KEYS.FOODS, key],
    queryFn: () => fetchFoodByCategorySlug(param),
  } as UseQueryOptions<Food[], Error>);

  return { data, isLoading, error };
};

export default useFoodList;
