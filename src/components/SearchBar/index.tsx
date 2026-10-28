import { ChangeEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// constants
import { ROUTES } from '@app/constants/routers';

// Components
import { SearchIcon } from '@app/components/Icons/Search';

const SearchBar = () => {
  const [searchParam, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const search = searchParam.get('search') || '';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // Results are listed on the homepage, so searching from another page goes there
    if (pathname !== ROUTES.ROOT) {
      navigate(`${ROUTES.ROOT}?search=${encodeURIComponent(value)}`);
      return;
    }

    setSearchParams(
      (prev) => {
        if (value) {
          prev.set('search', value);
        } else {
          prev.delete('search');
        }

        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="relative flex items-center w-1/2">
      <input
        type="search"
        aria-label="Search foods by name"
        placeholder="Search for anything"
        value={search}
        onChange={handleChange}
        className="pl-10 pr-4 py-2  text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-gray-400 border-solid border rounded-lg"
      />
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5" />
    </div>
  );
};

export default SearchBar;
