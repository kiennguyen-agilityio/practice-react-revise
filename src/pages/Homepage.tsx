// components
import HomeCategory from './HomeCategory';
import HomeFood from './HomeFood';

const HomePage = () => (
  <div className="h-screen">
    <div className="flex mt-4 overflow-x-auto flex-col sm:flex-row">
      <div className="min-w-[100px] sm:min-w-[200px]">
        <HomeCategory />
      </div>

      <div className="flex-1">
        <HomeFood />
      </div>
    </div>
  </div>
);

export default HomePage;
