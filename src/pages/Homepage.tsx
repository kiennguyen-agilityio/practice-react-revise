import CategoryList from '@app/components/CategoryList';
import FoodList from '@app/components/FoodList';

const HomePage = () => (
  <div className="h-screen">
    <div className="flex mt-4 text-nowrap">
      <CategoryList />
      <FoodList />
    </div>
  </div>
);

export default HomePage;
