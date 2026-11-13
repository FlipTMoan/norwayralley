import { defineConfig } from 'vite';

// Served from https://fliptmoan.github.io/norwayralley/ — every asset and
// fetch must be prefixed with the repo name, see import.meta.env.BASE_URL.
export default defineConfig({
  base: '/norwayralley/',
});
