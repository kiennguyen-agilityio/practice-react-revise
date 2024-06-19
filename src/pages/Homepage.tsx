import CategoryList from '@app/components/CategoryList';
import FoodList from '@app/components/FoodList';

const HomePage: React.FC = () => (
  <body className="h-screen">
    <div className="flex mt-4">
      <CategoryList />
      <FoodList />
    </div>
  </body>
);

export default HomePage;
