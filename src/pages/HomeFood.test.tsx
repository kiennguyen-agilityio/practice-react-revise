import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// constants
import { FAVORITE_STORE_KEY } from '@app/constants/storeKey';

// store
import useFavoriteStore from '@app/stores/useStore';

// pages
import HomeFood from '@app/pages/HomeFood';

const createFood = (id: string, name: string, categorySlug: string) => ({
  id,
  name,
  description: `${name} description`,
  price: 10,
  bestSeller: false,
  sold: 1,
  image: `https://assets.test/${id}.jpg`,
  categorySlug,
});

const lunchFood = createFood('5', 'Club Sandwich', 'lunch');

const stubFetch = (impl: (...args: unknown[]) => Promise<unknown>) => {
  const fetchMock = vi.fn(impl);

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const stubFoods = (foods: unknown[], status = 200) =>
  stubFetch(() => Promise.resolve({ status, json: async () => foods }));

const seedFavorites = (favorites: string[]) => {
  useFavoriteStore.setState({ favorites });
  // Snapshot of the persisted copy, to prove it is not rewritten destructively
  return localStorage.getItem(FAVORITE_STORE_KEY);
};

const persistedFavorites = () =>
  JSON.parse(localStorage.getItem(FAVORITE_STORE_KEY) ?? 'null').state
    .favorites;

const renderHomeFood = (url = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <HomeFood />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('HomeFood favorites integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    useFavoriteStore.setState({ favorites: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps favorites from other categories when a category-filtered list loads', async () => {
    const fetchMock = stubFoods([lunchFood]);
    seedFavorites(['1', '5']);

    renderHomeFood('/?categorySlug=lunch');

    // The list rendering means the data-loaded effects have already run
    expect(await screen.findByText('Club Sandwich')).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\?categorySlug=lunch$/);

    expect(useFavoriteStore.getState().favorites).toEqual(['1', '5']);
    expect(persistedFavorites()).toEqual(['1', '5']);
  });

  it('does not erase favorites when the API returns an empty list', async () => {
    const fetchMock = stubFoods([]);
    const persistedBefore = seedFavorites(['1', '2']);

    renderHomeFood('/');

    // An empty list renders the Menu heading without any items
    expect(await screen.findByText('Menu')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);

    expect(useFavoriteStore.getState().favorites).toEqual(['1', '2']);
    expect(localStorage.getItem(FAVORITE_STORE_KEY)).toBe(persistedBefore);
  });

  it('keeps favorites while the list is loading', () => {
    stubFetch(() => new Promise(() => {}));
    seedFavorites(['1']);

    const { container } = renderHomeFood('/');

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1']);
  });

  it('keeps favorites when the request fails with a 500', async () => {
    stubFetch(() => Promise.resolve({ status: 500, json: async () => ({}) }));
    seedFavorites(['1']);

    renderHomeFood('/');

    expect(await screen.findByText(/^Error:/)).toHaveTextContent(
      'Error: 500 Internal Server Error',
    );
    expect(useFavoriteStore.getState().favorites).toEqual(['1']);
  });
});
