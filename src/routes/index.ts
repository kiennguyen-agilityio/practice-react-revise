import { createBrowserRouter } from 'react-router-dom';

// constants
import { ROUTES } from '@app/constants/routers';

// pages
import DetailPage from '@app/pages/Detailpage';
import HomePage from '@app/pages/Homepage';

export const ROUTER = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    children: [
      {
        index: true,
        Component: HomePage,
      },

      {
        index: true,
        Component: DetailPage,
      },
    ],
  },
]);
