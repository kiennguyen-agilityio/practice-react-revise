interface Props {
  layout: 'Categories' | 'Foods' | 'Detail';
}

const SkeletonLoader = ({ layout }: Props) => {
  switch (layout) {
    case 'Categories':
      return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col space-y-2">
              <div className="w-40 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      );

    case 'Foods':
      return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex flex-col space-y-2">
              <div className="w-24 h-4 bg-gray-300 rounded"></div>
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="w-10 h-6 bg-gray-300 rounded"></div>
        </div>
      );

    case 'Detail':
      return (
        <div className="min-h-screen w-screen bg-gray-100 flex items-start justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-5xl mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 animate-pulse">
                <div className="w-full h-64 bg-gray-300 rounded-md"></div>
                <p className="mt-4">
                  <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                  <div className="w-1/2 h-6 bg-gray-300 rounded mt-2"></div>
                </p>
              </div>

              <div className="p-6 flex flex-col justify-between animate-pulse">
                <div>
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-8 bg-gray-300 rounded"></div>
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  </div>

                  <p className="mt-4 text-gray-600">
                    <div className="w-24 h-4 bg-gray-300 rounded"></div>
                  </p>
                  <p className="mt-4 text-gray-600">
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  </p>
                  <div className="mt-4 flex items-center text-sm font-bold text-white bg-gray-300 px-4 py-2 rounded-md shadow-md"></div>
                </div>

                <button className="mt-6 px-4 py-2 bg-gray-300 rounded-md"></button>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default SkeletonLoader;
