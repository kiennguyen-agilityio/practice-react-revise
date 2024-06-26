import { Link } from 'react-router-dom';

// Components
import SearchBar from '@app/components/SearchBar';
import { Bell } from '@app/components/Icons/Bell';

const Navbar = () => (
  <nav className="bg-white p-4 flex sm:gap-5 justify-between items-center shadow-md">
    <Link to="/" className="text-gray-800 text-2xl font-bold">
      Tasty
    </Link>
    <SearchBar />

    <Bell className="size-5" />

    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-3">
        <img
          src="/src/assets/images/avatar.jpg"
          alt="Admin"
          className="rounded-full w-10 h-10"
        />
        <div className="text-gray-800 max-sm:hidden">
          <div className="font-bold">Marvin McKinney</div>
          <div className="text-sm text-gray-500">Super Admin</div>
        </div>
      </div>
    </div>
  </nav>
);

export default Navbar;
