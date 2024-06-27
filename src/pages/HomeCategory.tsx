// apis
import useGetCategoryList from '@app/apis/useCategoryList';

// components
import CategoryList from '@app/components/CategoryList';
import SkeletonLoader from '@app/components/SkeletonLoader';

const HomeCategory = () => {
  const { data: categories, isLoading, error } = useGetCategoryList();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, id) => (
            <SkeletonLoader key={id as number} layout="Categories" />
          ))}
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;

  return <CategoryList categories={categories} />;
};

export default HomeCategory;
