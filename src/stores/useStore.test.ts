import { beforeEach, describe, expect, it } from 'vitest';

// constants
import { FAVORITE_STORE_KEY } from '@app/constants/storeKey';

// store
import useFavoriteStore from '@app/stores/useStore';

const readPersisted = () =>
  JSON.parse(localStorage.getItem(FAVORITE_STORE_KEY) ?? 'null');

describe('useFavoriteStore', () => {
  // The store is a module singleton, so reset both the in-memory state and
  // the persisted copy before every test
  beforeEach(() => {
    localStorage.clear();
    useFavoriteStore.setState({ favorites: [] });
  });

  it('adds a favorite and removes it when toggled again', () => {
    const { toggleFavorite } = useFavoriteStore.getState();

    toggleFavorite('1');
    expect(useFavoriteStore.getState().favorites).toEqual(['1']);

    toggleFavorite('1');
    expect(useFavoriteStore.getState().favorites).toEqual([]);
  });

  it('persists favorites to localStorage', () => {
    useFavoriteStore.getState().toggleFavorite('1');
    useFavoriteStore.getState().toggleFavorite('2');

    expect(readPersisted().state).toEqual({ favorites: ['1', '2'] });
  });

  it('restores favorites from localStorage on rehydrate', async () => {
    localStorage.setItem(
      FAVORITE_STORE_KEY,
      JSON.stringify({ state: { favorites: ['7', '8'] }, version: 0 }),
    );

    await useFavoriteStore.persist.rehydrate();

    expect(useFavoriteStore.getState().favorites).toEqual(['7', '8']);
  });
});
