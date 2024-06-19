// Components
import { SearchIcon } from '@app/components/Icons/Search';

const SearchBar = () => (
  <div className="relative flex items-center w-1/2">
    <input
      type="text"
      placeholder="Search for anything"
      className="pl-10 pr-4 py-2  text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-gray-400 border-solid border rounded-lg"
    />
    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5" />
  </div>
);

export default SearchBar;
