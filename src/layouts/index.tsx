import { Outlet } from 'react-router-dom';

// components
import Navbar from '@app/components/Navbar';

const MainLayout = () => (
  <div>
    <Navbar />
    <Outlet />
  </div>
);

export default MainLayout;
