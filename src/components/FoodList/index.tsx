import { useNavigate } from 'react-router-dom';

// store
import useFavoriteStore from '@app/stores/useStore';

// models
import { Food } from '@app/models/food';

// components
import { StarIcon } from '@app/components/Icons/Star';

interface Props {
  foods: Food[];
}

const FoodList = ({ foods }: Props) => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavoriteStore();

  const handleToggleFavorite = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <div className="w-full h-full p-8 max-sm:p-4 bg-[#edebfe] rounded-[30px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 ml-2">Menu</h2>
      </div>
      <div className="w-full mx-auto p-2">
        <ul className="space-y-4">
          {foods?.map(
            ({ id, name, description, price, image, bestSeller, sold }) => (
              <li
                key={id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl shadow cursor-pointer transition-transform transform hover:scale-105 hover:shadow-lg"
                onClick={() => navigate(`/foods/${id}`)}
              >
                <div className="flex items-center max-sm:flex-col">
                  <img
                    src={image}
                    alt={name}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <div className="text-lg max-sm:text-base font-bold max-sm:text-nowrap">
                      {name}
                    </div>
                    <div className="text-gray-500">{description}</div>
                    <div className="text-sm text-gray-400">${price}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button onClick={(e) => handleToggleFavorite(id, e)}>
                    <StarIcon
                      className={`w-6 h-6 ${favorites.includes(id) ? 'fill-yellow-400' : ''}`}
                    />
                  </button>

                  <div className="flex flex-col items-end pl-2 max-md:items-stretch">
                    {bestSeller && (
                      <div className="text-sm text-green-500">Best Seller</div>
                    )}
                    <div className="text-xl font-bold text-blue-600">
                      {sold}
                    </div>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
};
export default FoodList;
