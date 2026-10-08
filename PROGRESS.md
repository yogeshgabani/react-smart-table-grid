# 📋 Smart Data Grid — Build Progress Checklist

> Derived from [SMART-DATA-GRID-PROMPT.md](SMART-DATA-GRID-PROMPT.md).
>
> `[x]` = built and working · `[~]` = partially built (details noted) · `[ ]` = not started
>
> **Status:** `react-smart-table-grid` v0.1.0 — ready for first npm publish · build ✅ · typecheck ✅ · 81/81 tests ✅ · playground ✅ · `npm audit`: 0 vulnerabilities
> **Last updated:** 2026-10-08 (security + bug-fix pass, plugin hooks wired, playground redesign with a Live playground page)

**Quick check:** `npm run dev` → <http://localhost:5178> shows every `[x]` below working.
Installation into other projects: **[LIVE-VIEW.md](LIVE-VIEW.md)**.

---

## 🏗️ Phase 0 — Foundation

- [x] Repo scaffolding (`src/`, `playground/`, `docs/`, `tests/`, `scripts/`)
- [x] `package.json` with ESM + CJS + types exports map
- [x] Strict TypeScript config
- [x] `tsup` build pipeline (ESM, CJS, `.d.ts`, sourcemaps)
- [x] Subpath exports (`/grid`, `/theme`, `/headless`, `/export`, `/adapters`, `/cells`, `/styles.css`)
- [x] Zero runtime dependencies in core
- [x] `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `README.md`

## 🔐 TypeScript surface

- [x] Row types (generic `<T>`)
- [x] Column types
- [x] Cell context types
- [x] Filter types
- [x] Sorting types
- [x] Pagination types
- [x] Selection types
- [x] Theme types
- [x] UI config types
- [x] Event types
- [x] Data provider types
- [x] Export types
- [x] Editing types
- [x] No `any` in the public API

---

## 📊 Phase 1 — Core

- [x] Dynamic data
- [x] Dynamic columns
- [x] Nested object access (dot paths)
- [x] Column accessor (`accessorKey` / `accessorFn`)
- [x] Computed columns
- [x] Custom cell rendering
- [x] Custom header rendering
- [x] Custom footer rendering
- [x] Footer aggregation

### Sorting
- [x] Single-column sorting
- [x] Multi-column sorting (shift-click)
- [x] Ascending / Descending / Clear
- [x] Custom sort functions (`sortComparator`, `sortAccessor`)
- [x] Server-side sorting
- [x] `onSortChange`
- [x] Type-aware comparison (numbers, dates, natural string order)
- [x] Empty values sink to the bottom in both directions

### Pagination
- [x] Client-side pagination
- [x] Server-side pagination
- [x] Offset pagination
- [~] Cursor pagination — cursor flows through `DataProviderParams` / `DataProviderResult`; the pagination UI is still page-number based
- [x] Page size selector
- [x] First / Last / Prev / Next
- [x] Jump to page
- [x] Total record count
- [x] Ellipsis page tokens

### Selection
- [x] Single selection (radio controls, no select-all)
- [x] Multiple selection (checkboxes)
- [x] Select all (page)
- [x] Select current page
- [x] Select all filtered rows
- [x] Controlled selection
- [x] Uncontrolled selection
- [x] Disabled / non-selectable rows
- [x] `onSelectionChange`
- [x] Selection bar with bulk actions

---

## 🔍 Phase 2 — Advanced Grid

### Search
- [x] Global search
- [x] Column search
- [x] Fuzzy search with relevance ranking
- [x] Debounced search (input stays instant, processing is debounced)
- [x] Server-side search
- [x] Search highlighting

### Filtering
- [x] Text / Number / Date / Date Range
- [x] Select / Multi Select
- [x] Boolean
- [~] Checkbox / Radio — evaluate correctly; the panel renders them as select inputs
- [~] Slider — evaluates via `between`; the panel renders number inputs, not a slider widget
- [x] Custom filter (`filterFn`)
- [x] Operators: equals, notEquals, contains, notContains, startsWith, endsWith
- [x] Operators: greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual
- [x] Operators: between, in, notIn, isEmpty, isNotEmpty
- [x] Filter builder with AND / OR / NOT
- [x] Nested filter groups
- [x] Filter panel UI with per-type value inputs
- [x] Distinct-value collection for select filters
- [x] Incomplete conditions treated as inactive

### Column management
- [x] Column visibility
- [x] Column reorder (drag & drop, in the header and the panel)
- [x] Column resize (pointer drag, live)
- [x] Column pinning (left / right)
- [x] Frozen columns with sticky offsets, themeable shadow (`colors.pinShadow`, `ui.table.pinShadowSize`), RTL mirroring and a hairline boundary
- [x] Selection / expander / drag columns freeze left and always render first; actions freezes right
- [x] Header order always matches body order, including when pinning splits a header group
- [x] Sticky header
- [x] Sticky footer
- [x] Column grouping (multi-level headers)
- [~] Column spanning — `colSpan` / `rowSpan` exist on `ColumnDef` and drive header groups; per-cell spanning is not rendered
- [x] Min width / Max width / `flex` growth
- [~] Auto width — double-clicking the resizer clears the manual size; it does not measure content
- [x] Responsive columns (`minViewport` + `responsive="priority"`)
- [x] Column Settings panel
- [x] Persisted widths (`persist`)

### Rows
- [x] Expandable rows + custom expanded content
- [x] Row actions (view/edit/delete/duplicate/download/archive/custom)
- [x] Row action display: buttons, icon buttons, dropdown
- [~] Context-menu display — the type is accepted and falls back to the dropdown renderer
- [x] Show-actions-on-hover

### Inline editing
- [x] Editors: text, number, select, multi-select, checkbox, switch, date, datetime, textarea, custom
- [x] Save (Enter / blur / Tab)
- [x] Cancel (Escape)
- [x] Undo / Redo
- [x] Validation with inline error
- [x] `onRowUpdate`
- [x] Optimistic local updates

---

## 🏢 Phase 3 — Enterprise

- [x] Row virtualization (spacer rows, so table layout and column alignment survive)
- [ ] Column virtualization — horizontal windowing is not implemented
- [x] Overscan
- [x] Dynamic row height (per-index resolver)
- [x] Infinite scroll (load more, end detection, error retry)
- [x] Server-side `dataSource` (GET/POST/PUT/PATCH/DELETE + custom fetcher)
- [x] `createDataProvider` API
- [x] Request keying, abort-on-supersede, out-of-order response rejection
- [x] Adapters: fetch, axios, React Query, SWR, RTK Query, in-memory — all optional
- [x] Row grouping
- [x] Nested grouping
- [x] Aggregations: sum, avg, min, max, count, countDistinct, first, last, custom
- [x] Tree data (nested `children` and flat `parentKey`)
- [x] Tree expand / collapse with indentation
- [ ] Tree lazy loading — `TreeConfig.loadChildren` is typed but not wired
- [ ] Tree cascade selection — `TreeConfig.cascadeSelection` is typed but not wired
- [~] Tree sorting / filtering — applies to root rows; nested children are not re-sorted
- [x] Bulk actions
- [x] Export: CSV (with formula-injection guard + UTF-8 BOM)
- [x] Export: JSON
- [x] Export: Excel (SpreadsheetML, no zip dependency)
- [x] Export: PDF (styled print window → Save as PDF)
- [x] Export: Print
- [x] Export: Clipboard (TSV, with a non-secure-context fallback)
- [x] Export scopes: page / selected / filtered / all + custom columns + filename + `formatCell`

---

## 🎨 Phase 4 — Design System (the differentiator)

- [x] `createGridTheme()` theme engine
- [x] Design tokens (colors, typography, spacing, borders, radius, shadows, sizing, motion)
- [x] 90+ CSS variables for every token
- [x] **One-stop `ui` config** covering 19 slots
- [x] Slot support for `className` / `style` / `variant` / `size`
- [x] Resolution priority: props → ui → custom theme → preset theme → default
- [x] `extends` for building on a preset
- [x] `dark` block for dark-only token overrides
- [x] `cssVars` escape hatch
- [x] 22 theme presets
- [x] Table variants (9)
- [x] Header variants (5)
- [x] Pagination variants (8)
- [x] Search variants (6)
- [x] Checkbox variants (4)
- [x] Toolbar variants (5)
- [x] Density (compact, comfortable, spacious, dense)
- [x] Dark mode (light / dark / system + `prefers-color-scheme`)
- [x] RTL support (pinning, chevrons, drag, switches, logical properties)
- [x] Responsive modes (horizontal-scroll, stacked, card, priority)
- [x] Mobile card view
- [x] Bottom-sheet filters and column panel on small screens
- [x] Mobile column selector
- [ ] Swipe actions on mobile cards
- [x] Loading states (skeleton, spinner, progress, shimmer, overlay, minimal)
- [x] Empty states (default, minimal, illustration, search, filtered, custom)
- [x] Error states (default, retry, network, server, custom)
- [x] Animation system + `prefers-reduced-motion` + `animations={false}`
- [x] Framework independence (plain CSS / modules / Tailwind / styled / emotion)
- [x] Themeable hover / active / focus states across rows, headers, buttons, menus, pagination, expanders and cards
- [x] Contrast-relative overlays so controls stay legible on any header or toolbar colour

## 🧱 Built-in cell types

- [x] Text, Number, Currency, Percentage
- [x] Date, DateTime, Relative Time
- [x] Avatar, Avatar Group
- [x] Badge, Status, Progress, Rating
- [x] Boolean, Checkbox, Switch
- [x] Link, Email, Phone
- [x] Image, Icon
- [x] Action, Button, Dropdown
- [x] Tags, Code, JSON
- [x] Trend (bonus — for analytics tables)
- [x] Cached `Intl` formatters
- [x] Renderers exported for reuse in custom cells

## ♿ Accessibility & keyboard

- [x] ARIA grid roles (`role="grid"`, `aria-rowcount`, `aria-colcount`, `aria-sort`, `aria-selected`, `aria-busy`)
- [x] Keyboard navigation (arrows, Home/End, PageUp/PageDown)
- [x] Enter / Escape / Space
- [x] Ctrl/Cmd+A, Ctrl/Cmd+F, Ctrl/Cmd+K, Ctrl/Cmd+E, Ctrl/Cmd+←/→
- [x] Customizable shortcuts (`shortcuts` prop, `false` to disable any)
- [x] Focus management (focus ring tracked by coordinate, survives virtualization)
- [x] Screen-reader live region for result counts
- [x] Accessible sorting / filtering / selection / pagination
- [ ] Full audit against WCAG 2.2 AA with an automated tool

## 🔄 State

- [x] Controlled state (`state` + `onStateChange`, slice-by-slice)
- [x] Uncontrolled state
- [x] `onStateChange` reports which slice changed
- [x] URL state sync (`?page=2&search=john&sort=name.asc`)
- [x] State persistence (`localStorage` / `sessionStorage`)
- [x] Reset to defaults

## 🧩 Extensibility

- [x] Plugin architecture (`initState`, `columns`, `transform`, `onStateChange`, `onMount`) — `initState` and `onStateChange` were typed but not called until 2026-10-08
- [x] Plugin toolbar contributions (`GridPlugin.toolbar`)
- [x] Presets (admin, crm, hrms, erp, analytics, saas, enterprise, minimal, dashboard, ecommerce)
- [x] Headless mode (`headless` prop and the `/headless` entry point)
- [x] Custom UI slots / component overrides
- [x] Developer-friendly errors (`SmartDataGridError`, warn-once dev warnings)

## ⚛️ Framework support

- [x] React 18 / 19 (peer `>=18` — `useSyncExternalStore`)
- [x] Next.js App Router
- [x] Next.js Pages Router
- [x] SSR safety (no browser APIs during render)
- [x] Vite
- [x] JavaScript + TypeScript consumers
- [x] Tree shaking (`sideEffects: ["**/*.css"]` so the stylesheet import survives production builds, subpath entries, code splitting)

---

## 🚀 Phase 5 — Developer Ecosystem

- [x] Playground app (live view) — 13 pages: page search (Ctrl/⌘ K), light/dark/system theme driving every grid, Preview/Code tabs, and a Live playground (props panel → grid → generated JSX → event log)
- [x] Theme Builder with live preview + copy theme (colours, hover states, frozen columns, sizing, variants)
- [x] Benchmark page (1K → 1M rows, FPS, render time, DOM count, heap)
- [x] Example gallery (basic, admin, CRM, HRMS, ERP, analytics, SaaS, enterprise, minimal, dashboard, ecommerce, editable, server-side, virtualized, tree, mobile, dark, custom theme, custom UI, headless)
- [x] Unit tests (Vitest) — 41 engine tests
- [x] Integration tests (React Testing Library) — 39 component tests
- [x] SSR test (`node` environment) — renders every feature with no browser APIs and no React warnings
- [ ] E2E tests (Playwright)
- [ ] Storybook
- [~] Documentation — written as markdown in [`docs/`](docs/); not yet a hosted site
- [x] `LIVE-VIEW.md` — preview + consume the package in other projects
- [ ] Migration guides (from other grid libraries)

---

## 🧪 Verification

- [x] `npm run build` passes — ESM + CJS + `.d.ts` for 7 entry points
- [x] `npm run typecheck` passes — `src/`, `playground/`, `tests/`
- [x] `npm run test` passes — 81/81
- [x] `npm run dev` serves the playground at :5178
- [x] `npm run build:playground` produces a static build
- [x] `npm pack` tarball installed into a separate app and smoke-tested end to end — CJS `require`, ESM `import`, every subpath, `styles.css`, warning-free SSR, and type-checking under `bundler`, `node16` CJS and `node16` ESM resolution
- [x] `npm publish --dry-run` — `react-smart-table-grid@0.1.0`, 97 files, public

---

## 📌 What's left, in priority order

1. **Column virtualization** — needed for grids with 100+ columns; row virtualization already handles 1M rows.
2. **Tree lazy loading and cascade selection** — both are typed, neither is wired.
3. **Storybook + Playwright** — the playground covers manual verification today.
4. **Per-cell column spanning** — header groups work; body spanning does not.
5. **Content-measuring auto-width** — currently only clears a manual override.
6. **Real slider / radio filter widgets** — the operators work, the inputs are plain.
7. **Swipe actions** on mobile cards.
8. **Hosted docs site + migration guides.**
