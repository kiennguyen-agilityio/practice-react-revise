// apis
import useGetCategoryList from '@app/apis/useCategoryList';

// components
import CategoryList from '@app/components/CategoryList';

const HomeCategory = () => {
  const { data: categories, isLoading, error } = useGetCategoryList();

  if (isLoading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <CategoryList categories={categories} />;
};

export default HomeCategory;
