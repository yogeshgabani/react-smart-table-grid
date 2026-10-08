import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    grid: 'src/entries/grid.ts',
    theme: 'src/entries/theme.ts',
    headless: 'src/entries/headless.ts',
    export: 'src/entries/export.ts',
    adapters: 'src/entries/adapters.ts',
    cells: 'src/entries/cells.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  async onSuccess() {
    // Ship the raw stylesheet for consumers who prefer importing CSS
    // instead of relying on the auto-injected <style> element.
    mkdirSync('dist', { recursive: true });
    copyFileSync('src/styles/grid.css', 'dist/styles.css');
  },
});
