import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// constants
import { FAVORITE_STORE_KEY } from '@app/constants/storeKey';

interface FavoriteState {
  favorites: string[];
  toggleFavorite: (foodId: string) => void;
  pruneFavorites: (validIds: string[]) => void;
}

const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set) => ({
      favorites: [],
      toggleFavorite: (foodId: string) =>
        set((state) => {
          const isFavorite = state.favorites.includes(foodId);
          if (isFavorite) {
            return {
              favorites: state.favorites.filter((id) => id !== foodId),
            };
          } else {
            return { favorites: [...state.favorites, foodId] };
          }
        }),
      pruneFavorites: (validIds: string[]) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => validIds.includes(id)),
        })),
    }),
    {
      name: FAVORITE_STORE_KEY,
      getStorage: () => localStorage,
    },
  ),
);

export default useFavoriteStore;
