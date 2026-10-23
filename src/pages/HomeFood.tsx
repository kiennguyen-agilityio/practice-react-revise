import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// store
import useFavoriteStore from '@app/stores/useStore';

// apis
import useFoodList from '@app/apis/useFood';

// components
import FoodList from '@app/components/FoodList';
import SkeletonLoader from '@app/components/SkeletonLoader';

const HomepageFood = () => {
  const [searchParam] = useSearchParams();
  const categorySlug = searchParam.get('categorySlug') || '';

  const { data: foods, isLoading, error } = useFoodList(categorySlug);
  const pruneFavorites = useFavoriteStore((state) => state.pruneFavorites);

  useEffect(() => {
    if (isLoading || error) return;
    pruneFavorites(foods.map(({ id }) => id));
  }, [foods, isLoading, error, pruneFavorites]);

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
