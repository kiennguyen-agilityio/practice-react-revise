import { ROUTES } from '@app/constants/routers';
import HomePage from '@app/pages/Homepage';
import { createBrowserRouter } from 'react-router-dom';

export const ROUTER = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    children: [
      {
        index: true,
        Component: HomePage,
      },
    ],
  },
]);
