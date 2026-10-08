/**
 * Compiles src/styles/grid.css into a TypeScript module so the grid can inject
 * its own styles at runtime. Keeping the .css file as the single source of
 * truth means editors still get CSS tooling, and consumers who prefer an
 * explicit `import 'react-smart-table-grid/styles.css'` get the identical bytes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../src/styles/grid.css');
const target = resolve(here, '../src/styles/css.generated.ts');

const css = readFileSync(source, 'utf8');

const escaped = css
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const out = `/* eslint-disable */
// AUTO-GENERATED from src/styles/grid.css — do not edit by hand.
// Run \`npm run css\` after changing the stylesheet.

export const gridCss = \`${escaped}\`;
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out, 'utf8');

console.log(`[react-smart-table-grid] wrote ${target} (${(css.length / 1024).toFixed(1)} kB of CSS)`);
