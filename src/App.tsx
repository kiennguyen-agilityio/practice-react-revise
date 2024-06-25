import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// css
import './App.css';

// constants
import { ROUTES } from './constants/routers';

// Pages
import DetailPage from '@app/pages/Detailpage';
import HomePage from '@app/pages/Homepage';

// layouts
import MainLayout from './layouts';

const queryClient = new QueryClient();

const ROUTER = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ROUTES.DETAIL,
        element: <DetailPage />,
      },
    ],
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={ROUTER} />
  </QueryClientProvider>
);

export default App;
