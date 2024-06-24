// components
import Navbar from '@app/components/Navbar';
import HomeCategory from './HomeCategory';
import HomeFood from './HomeFood';

const HomePage = () => (
  <div className="h-screen flex flex-col">
    <Navbar />
    <div className="flex mt-4 overflow-x-auto">
      <div className="min-w-[200px]">
        <HomeCategory />
      </div>
      <div className="flex-1">
        <HomeFood />
      </div>
    </div>
  </div>
);

export default HomePage;
