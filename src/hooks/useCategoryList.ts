import { useQuery } from '@tanstack/react-query';

// constants
import { QUERY_KEYS } from '@app/constants/queryKey';
import { CATEGORIES_API } from '@app/constants/api';

// helpers
import { CustomErrors, customErrors } from '@app/helpers/handleError';

// interfaces
import { Category } from '@app/interfaces/category';

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(CATEGORIES_API, {
      headers: { 'content-type': 'application/json' },
    });

    const data = await response.json();

    const listCategories = customErrors(response, data);

    return listCategories;
  } catch (error) {
    throw error as CustomErrors;
  }
};

const useGetCategoryList = () => {
  const {
    data: categories = [],
    error,
    isLoading,
  } = useQuery<Category[], Error>({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: fetchCategories,
  });

  return { data: categories, isLoading, error };
};

export default useGetCategoryList;
