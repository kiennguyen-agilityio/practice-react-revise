import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Routes
import { ROUTER } from './routes';

import 'App.css';

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={ROUTER} />
  </QueryClientProvider>
);

export default App;
