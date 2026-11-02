# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Favorites

**Policy: never auto-prune.** A favorite is only removed by an explicit user action (toggling the star). Nothing else may remove one: a missing food, category filtering or switching, an empty or partial list, loading, being offline, a malformed response or an API error. Favorites are stored per browser in `localStorage` (`favorite-foods`) by id.

Acceptance criteria (regression checklist; each is covered by `src/pages/HomeFood.test.tsx`, `src/stores/useStore.test.ts` or `src/helpers/validateFoods.test.ts`):

1. **Toggle**: Given a food, when the user clicks its star, then it is added to or removed from favorites.
2. **Persistence**: Given favorites, when the page reloads, then they are restored; given corrupt stored data, then the app starts with none and does not crash.
3. **Categories**: Given favorites in any category, when a category list loads or the user switches categories and back, then no favorite is removed.
4. **Responses**: Given an empty or partial list, then favorites are unchanged. Given a 200 response that is not an array of foods (`{}`, `null`, a string, items without an `id`), then an error is shown, the page does not crash and favorites are unchanged.
5. **Errors and offline**: Given a 4xx/5xx response, a network failure or a pending request, then favorites are unchanged.
6. **Removed foods**: Given a favorite whose food is not in the catalog, when any list loads, then the favorite is kept.
