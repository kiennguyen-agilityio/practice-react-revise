import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useSearchParams } from 'react-router-dom';

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

describe('HomeFood favorites policy: never auto-prune', () => {
  const pho = createFood('1', 'Pho', 'lunch');
  const bunCha = createFood('2', 'Bun Cha', 'lunch');
  const salad = createFood('3', 'Salad', 'dinner');

  beforeEach(() => {
    localStorage.clear();
    useFavoriteStore.setState({ favorites: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a favorite whose food is missing from the catalog', async () => {
    stubFoods([pho]);
    const persistedBefore = seedFavorites(['1', '99']);

    renderHomeFood('/');

    expect(await screen.findByText('Pho')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '99']);
    expect(localStorage.getItem(FAVORITE_STORE_KEY)).toBe(persistedBefore);
  });

  it('keeps favorites when the API returns only part of the catalog', async () => {
    stubFoods([pho]);
    const persistedBefore = seedFavorites(['1', '2', '3']);

    renderHomeFood('/');

    expect(await screen.findByText('Pho')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '2', '3']);
    expect(localStorage.getItem(FAVORITE_STORE_KEY)).toBe(persistedBefore);
  });

  it.each([
    ['an empty object', {}],
    ['an error-shaped object', { message: 'oops' }],
    ['null', null],
    ['a string', 'ok'],
    ['a list containing null', [pho, null]],
    ['a food without an id', [{ name: 'No id' }]],
  ])(
    'shows an error and keeps favorites for a 200 response with %s',
    async (_label, body) => {
      stubFoods(body as unknown[]);
      const persistedBefore = seedFavorites(['1', '2']);

      renderHomeFood('/');

      expect(await screen.findByText(/^Error:/)).toHaveTextContent(
        'Error: Invalid foods response',
      );
      expect(useFavoriteStore.getState().favorites).toEqual(['1', '2']);
      expect(localStorage.getItem(FAVORITE_STORE_KEY)).toBe(persistedBefore);
    },
  );

  it('keeps favorites when the network is unavailable', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const persistedBefore = seedFavorites(['1', '2']);

    renderHomeFood('/');

    expect(await screen.findByText(/^Error:/)).toHaveTextContent(
      'Failed to fetch',
    );
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '2']);
    expect(localStorage.getItem(FAVORITE_STORE_KEY)).toBe(persistedBefore);
  });

  it('keeps favorites while switching between categories and back', async () => {
    stubFetch((url) => {
      const slug = new URL(String(url), 'http://localhost').searchParams.get(
        'categorySlug',
      );
      const foods = {
        lunch: [pho, bunCha],
        dinner: [salad],
      }[slug ?? ''] ?? [pho, bunCha, salad];

      return Promise.resolve({ status: 200, json: async () => foods });
    });
    seedFavorites(['1', '3']);

    const Switcher = () => {
      const [, setSearchParams] = useSearchParams();

      return (
        <>
          <button onClick={() => setSearchParams({ categorySlug: 'dinner' })}>
            dinner
          </button>
          <button onClick={() => setSearchParams({})}>all</button>
          <HomeFood />
        </>
      );
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?categorySlug=lunch']}>
          <Switcher />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Bun Cha')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '3']);

    fireEvent.click(screen.getByText('dinner'));
    expect(await screen.findByText('Salad')).toBeInTheDocument();
    expect(screen.queryByText('Pho')).not.toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '3']);

    fireEvent.click(screen.getByText('all'));
    expect(await screen.findByText('Pho')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '3']);
  });

  it('restores persisted favorites after a reload, including stale ones', async () => {
    stubFoods([pho, salad]);
    // Simulate a fresh page load: empty memory, persisted copy on disk
    useFavoriteStore.setState({ favorites: [] });
    localStorage.setItem(
      FAVORITE_STORE_KEY,
      JSON.stringify({ state: { favorites: ['1', '2'] }, version: 0 }),
    );
    await useFavoriteStore.persist.rehydrate();

    const { container } = renderHomeFood('/');

    expect(await screen.findByText('Pho')).toBeInTheDocument();
    expect(useFavoriteStore.getState().favorites).toEqual(['1', '2']);
    expect(persistedFavorites()).toEqual(['1', '2']);
    // Only the favorite that is in the catalog is highlighted
    expect(container.querySelectorAll('.fill-yellow-400')).toHaveLength(1);
  });

  it('still removes a favorite when the user explicitly unfavorites it', async () => {
    stubFoods([pho, salad]);
    seedFavorites(['1', '99']);

    renderHomeFood('/');
    await screen.findByText('Pho');

    // The first star button belongs to the first food (Pho)
    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(useFavoriteStore.getState().favorites).toEqual(['99']);
    expect(persistedFavorites()).toEqual(['99']);
  });
});
