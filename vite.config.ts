import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Playground / live-view dev server.
 *
 * `react-smart-table-grid` is aliased straight at `src/` so every edit to the package
 * hot-reloads instantly — no build step, no `npm link`, no watch mode.
 */
export default defineConfig({
  root: resolve(__dirname, 'playground'),
  // `.env` lives next to package.json, not inside playground/.
  envDir: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      'react-smart-table-grid/theme': resolve(__dirname, 'src/entries/theme.ts'),
      'react-smart-table-grid/headless': resolve(__dirname, 'src/entries/headless.ts'),
      'react-smart-table-grid/export': resolve(__dirname, 'src/entries/export.ts'),
      'react-smart-table-grid/adapters': resolve(__dirname, 'src/entries/adapters.ts'),
      'react-smart-table-grid/cells': resolve(__dirname, 'src/entries/cells.ts'),
      'react-smart-table-grid/grid': resolve(__dirname, 'src/entries/grid.ts'),
      'react-smart-table-grid': resolve(__dirname, 'src/index.ts'),
    },
  },
  server: {
    port: 5178,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, 'playground-dist'),
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    root: __dirname,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: [resolve(__dirname, 'tests/setup.ts')],
  },
} as never);
