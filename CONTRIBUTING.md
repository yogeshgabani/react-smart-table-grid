# Contributing

## Setup

```bash
npm install
npm run dev      # playground at http://localhost:5178
```

The dev server aliases `react-smart-table-grid` at `src/`, so editing package source hot-reloads the playground with no build step.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Playground dev server |
| `npm run build` | Build the publishable package into `dist/` |
| `npm run build:playground` | Build the playground into `playground-dist/` |
| `npm run test` | Vitest + React Testing Library |
| `npm run test:watch` | Tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` over `src/`, `playground/` and `tests/` |
| `npm run css` | Regenerate `src/styles/css.generated.ts` from `src/styles/grid.css` |

## Layout

```text
src/
├── core/        pure data engine — no React, no DOM
├── hooks/       React bindings
├── components/  UI layer
├── theme/       tokens, presets, CSS-variable generation
├── presets/     application presets (admin, crm, …)
├── data/        data providers
├── adapters/    optional integrations
├── export/      CSV / JSON / Excel / PDF / print / clipboard
├── styles/      grid.css (source of truth) + generated TS module
├── entries/     subpath export entry points
└── types/       the entire public type surface
```

## Ground rules

**Keep `core/` pure.** Nothing in `src/core/` may import React or touch the DOM. That boundary is what makes headless mode work and what makes the engine testable without a renderer.

**No runtime dependencies.** React is the only peer. If you need a utility, write it in `src/utils/`. Optional integrations belong in `src/adapters/` and must accept the client as an argument rather than importing it.

**Style through variables.** Every value in `src/styles/grid.css` reads from a `--grid-*` custom property. If you need a new visual knob, add the token in `src/theme/tokens.ts`, expose it in `src/theme/cssVars.ts`, then use it in the stylesheet. Never hard-code a colour or size in CSS.

**No `any` in the public API.** Internals may use `unknown` and narrow at the point of use.

**SSR safety.** No `window`, `document` or `navigator` access during render. Put browser work in effects, and guard with `typeof window === 'undefined'` in shared code.

**Edit `grid.css`, not the generated file.** `src/styles/css.generated.ts` is produced by `npm run css` and is regenerated on every build.

## Tests

- `tests/core.test.ts` — the pure engine: sorting, search, filtering, pagination, aggregation, tree, columns, theme resolution, export
- `tests/grid.test.tsx` — rendering and interaction through React Testing Library

Test through public behaviour (roles, labels, visible text) rather than internal classes, so refactors don't break the suite.

## Commits and versioning

Conventional Commits, semantic versioning. Add a `CHANGELOG.md` entry under `[Unreleased]` with any user-visible change.
