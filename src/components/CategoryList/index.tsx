import { useState } from 'react';

import { Category } from '@app/interfaces/category';

interface Props {
  categories: Category[];
}

const CategoryList = ({ categories }: Props) => {
  const [activeCategory] = useState<string>('');
  return (
    <div className="p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4 ml-2">Categories</h2>
      <ul>
        {categories.map(({ id, name, slug }) => (
          <li
            key={id}
            className={`flex justify-between items-center p-2 rounded-lg mb-2 cursor-pointer gap-8
            ${activeCategory === slug ? 'bg-[#edebfe] text-[#4734f7]' : 'text-black-900'}`}
          >
            <span className={activeCategory === slug ? 'font-bold' : ''}>
              {name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
