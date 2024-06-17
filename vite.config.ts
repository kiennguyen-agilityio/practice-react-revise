import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import react from '@vitejs/plugin-react';
import EnvironmentPlugin from 'vite-plugin-environment';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    EnvironmentPlugin('all'),
    viteCompression(),
  ],

  server: {
    port: 3000,
  },
});
