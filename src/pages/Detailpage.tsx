import { useNavigate, useParams } from 'react-router-dom';

// store
import useFavoriteStore from '@app/stores/useStore';

// apis
import { useFoodById } from '@app/apis/useFood';

// components
import { StarIcon } from '@app/components/Icons/Star';
import SkeletonLoader from '@app/components/SkeletonLoader';

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: food, isLoading, error } = useFoodById(id as string);
  const { favorites, toggleFavorite } = useFavoriteStore();

  const handleToggleFavorite = () => {
    toggleFavorite(id as string);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(1)
          .fill(0)
          .map((id) => (
            <SkeletonLoader key={id as number} layout="Detail" />
          ))}
      </div>
    );
  }

  if (error || !food) {
    return <div>Error loading food details</div>;
  }

  const { name, description, price, sold, bestSeller, image } = food;

  return (
    <div className="min-h-screen w-screen bg-gray-100 flex items-start justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-5xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6">
            <img src={image} alt={name} className="rounded-md w-full" />
            <p className="mt-4">
              <strong>Description:</strong> {description}
            </p>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-6">
                <h2 className="text-3xl font-bold text-gray-800">{name}</h2>

                <button onClick={handleToggleFavorite}>
                  <StarIcon
                    className={`w-6 h-6 ${favorites.includes(id as string) ? 'fill-yellow-400' : ''}`}
                  />
                </button>
              </div>

              <p className="mt-4 text-gray-600">
                <strong>Price:</strong> {price}
              </p>
              <p className="mt-4 text-gray-600">
                <strong>Sold:</strong> {sold}
              </p>
              {bestSeller && (
                <div className="mt-4 flex items-center text-sm font-bold text-white bg-green-500 px-4 py-2 rounded-md shadow-md animate-pulse">
                  Best Seller
                </div>
              )}
            </div>

            <button
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
              onClick={() => navigate(-1)}
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
