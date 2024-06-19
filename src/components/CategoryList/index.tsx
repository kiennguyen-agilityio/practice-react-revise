import { useState } from 'react';

// mocks
import { categories } from '@app/mocks/categories';

const CategoryList = () => {
  const [activeCategory, setActiveCategory] = useState<string>('');

  return (
    <div className="p-4 mt-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4 ml-2">Categories</h2>
      <ul>
        {categories.map(({ id, name, count }) => (
          <li
            key={id}
            className={`flex justify-between items-center p-2 rounded-lg mb-2 cursor-pointer gap-8
            ${activeCategory === name ? 'bg-[#edebfe] text-[#4734f7]' : 'text-black-900'}`}
            onClick={() => setActiveCategory(name)}
          >
            <span className={activeCategory === name ? 'font-bold' : ''}>
              {name}
            </span>

            <span
              className={`px-3 py-1 rounded-full ${activeCategory === name ? 'bg-[#4532f7] text-white' : 'text-gray-700'}`}
            >
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
