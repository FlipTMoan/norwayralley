import { defineConfig } from 'vite';

// A relative base makes one build run anywhere: GitHub Pages serves it at
// https://fliptmoan.github.io/norwayralley/, a PC serves the same `dist/`
// from any folder of any static file server (or `npm run preview`). Code
// that fetches runtime files builds URLs from import.meta.env.BASE_URL
// ('./' here), never from a leading '/'.
export default defineConfig({
  base: './',
});
