import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// pages
import HomeCategory from '@app/pages/HomeCategory';

const renderHomeCategory = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomeCategory />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('HomeCategory error rendering', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [404, '404 Page Not Found'],
    [500, '500 Internal Server Error'],
    [503, '503 Service Unavailable'],
  ])(
    'renders a non-empty message for a %i response',
    async (status, message) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ status, json: async () => ({}) }),
      );

      renderHomeCategory();

      const error = await screen.findByText(/^Error:/);

      expect(error).toHaveTextContent(`Error: ${message}`);
      expect(error.textContent?.replace('Error:', '').trim()).not.toBe('');
    },
  );
});
