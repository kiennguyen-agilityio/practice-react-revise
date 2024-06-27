import { useSearchParams } from 'react-router-dom';

// apis
import useFoodList from '@app/apis/useFood';

// components
import FoodList from '@app/components/FoodList';
import SkeletonLoader from '@app/components/SkeletonLoader';

const HomepageFood = () => {
  const [searchParam] = useSearchParams();
  const categorySlug = searchParam.get('categorySlug') || '';

  const { data: foods, isLoading, error } = useFoodList(categorySlug);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, id) => (
            <SkeletonLoader key={id as number} layout="Foods" />
          ))}
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;

  return <FoodList foods={foods} />;
};

export default HomepageFood;
