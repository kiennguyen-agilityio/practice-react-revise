// models
import { Food } from '@app/models/food';

interface Props {
  foods: Food[];
}

const FoodList = ({ foods }: Props) => (
  <div className="w-screen h-screen p-8 bg-[#edebfe] rounded-[30px]">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold text-gray-800 ml-2">Menu</h2>
    </div>
    <div className="w-full mx-auto p-2">
      <ul className="space-y-4">
        {foods?.map(
          ({ id, name, description, price, image, bestSeller, sold }) => (
            <li
              key={id}
              className="flex items-center justify-between p-4 bg-white rounded-2xl shadow"
            >
              <div className="flex items-center">
                <img
                  src={image}
                  alt={name}
                  className="w-10 h-10 rounded-full mr-4"
                />
                <div>
                  <div className="text-lg font-bold">{name}</div>
                  <div className="text-gray-500">{description}</div>
                  <div className="text-sm text-gray-400">{price}</div>
                </div>
              </div>
              <div className="flex flex-col items-end pl-2 max-md:items-stretch">
                {bestSeller && (
                  <div className="text-sm text-green-500">Best Seller</div>
                )}
                <div className="text-xl font-bold text-blue-600">{sold}</div>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  </div>
);
export default FoodList;
