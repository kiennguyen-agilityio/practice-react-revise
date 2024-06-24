// components
import CategoryList from '@app/components/CategoryList';
import FoodList from '@app/components/FoodList';
import Navbar from '@app/components/Navbar';

// apis
import useGetCategoryList from '@app/apis/useCategoryList';
import useFoodList from '@app/apis/useFood';

const HomePage = () => {
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useGetCategoryList();

  const {
    data: foods,
    isLoading: isLoadingFoods,
    error: foodsError,
  } = useFoodList();

  if (isLoadingCategories || isLoadingFoods) return <div>Loading...</div>;
  if (categoriesError) return <div>Error: {categoriesError.message}</div>;
  if (foodsError) return <div>Error: {foodsError.message}</div>;

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex mt-4 overflow-x-auto">
        <div className="min-w-[200px]">
          <CategoryList categories={categories} />
        </div>
        <div className="flex-1">
          <FoodList foods={foods} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
