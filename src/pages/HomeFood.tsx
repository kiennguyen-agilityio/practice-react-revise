import { useSearchParams } from 'react-router-dom';

// apis
import useFoodList from '@app/apis/useFood';

// components
import FoodList from '@app/components/FoodList';

const HomepageFood = () => {
  const [searchParam] = useSearchParams();
  const categorySlug = searchParam.get('categorySlug') || '';

  const { data: foods, isLoading, error } = useFoodList(categorySlug);

  if (isLoading) return <div>Loading foods...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <FoodList foods={foods} />;
};

export default HomepageFood;
