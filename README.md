<div align="center">

# 🚀 Smart Data Grid

**One Smart Data Grid. Any Data. Any UI.**

An enterprise-grade React data grid with a single-object design system, a headless core, and zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/react-smart-table-grid.svg?color=4f46e5&style=flat-square)](https://www.npmjs.com/package/react-smart-table-grid)
[![downloads](https://img.shields.io/npm/dm/react-smart-table-grid.svg?color=7c3aed&style=flat-square)](https://www.npmjs.com/package/react-smart-table-grid)
[![types](https://img.shields.io/badge/types-included-3178c6?style=flat-square)](#api)
[![license](https://img.shields.io/badge/license-MIT-emerald?style=flat-square)](./LICENSE)
[![bundle](https://img.shields.io/badge/tree--shakable-✓-10b981?style=flat-square)](#ssr)

`npm install react-smart-table-grid`

</div>

---

```tsx
import { SmartDataGrid } from 'react-smart-table-grid';

<SmartDataGrid data={users} columns={columns} />
```

That's a working, accessible, sortable grid. Everything else is opt-in.

---

## Why this one

**⭐ One-stop UI customization.** Change the entire look from one object. No hunting for CSS classes, no `!important`, no wrapper divs.

```tsx
<SmartDataGrid
  data={users}
  columns={columns}
  ui={{
    header: { background: '#111827', color: '#FFFFFF', height: 52 },
    row:    { height: 56, hoverBackground: '#F1F5F9', selectedBackground: '#DBEAFE' },
    cell:   { padding: '12px 16px' },
    pagination: { variant: 'pill' },
  }}
/>
```

- **Zero runtime dependencies.** React is the only peer.
- **Headless-compatible.** `react-smart-table-grid/headless` gives you the pipeline with no UI at all.
- **CSS-framework independent.** Plain CSS, CSS Modules, Tailwind, styled-components, Emotion — all fine. Nothing is required.
- **Tree-shakable** subpath exports: `/grid`, `/theme`, `/headless`, `/export`, `/adapters`, `/cells`.
- **SSR-safe.** No browser API touches the render path. Works in Next.js App Router and Pages Router.

---

## Install

```bash
npm install react-smart-table-grid
```

React 18 or 19 is the only peer dependency. Framework-by-framework setup (Vite, Next.js App and Pages Router, plain JS) is in **[LIVE-VIEW.md](LIVE-VIEW.md)**.

## See it running

From the package source:

```bash
npm install
npm run dev     # → http://localhost:5178 — the live playground
```

Twelve pages covering every feature, including a **live theme builder** and a **1,000,000-row benchmark**.

---

## Quick start

```tsx
import { SmartDataGrid, type ColumnDef } from 'react-smart-table-grid';

interface User { id: string; name: string; email: string; salary: number; status: string }

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name',   header: 'Name' },
  { accessorKey: 'email',  header: 'Email',  type: 'email' },
  { accessorKey: 'status', header: 'Status', type: 'status' },
  { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right', aggregate: 'sum' },
];

<SmartDataGrid
  data={users}
  columns={columns}
  getRowId="id"
  searchable
  filterable
  selectable
  resizable
  exportable
  showFooter
  pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
  onSelectionChange={(rows) => console.log(rows)}
/>
```

---

## Theming

Three layers, each overriding the one below it:

```text
component props  →  ui overrides  →  custom theme  →  preset theme  →  default theme
```

### 1. A preset

```tsx
<SmartDataGrid theme="modern" />
```

22 built in: `default` `modern` `minimal` `compact` `comfortable` `enterprise` `material` `glass` `soft` `dark` `high-contrast` `rounded` `sharp` `borderless` `dense` `luxury` `dashboard` `crm` `hrms` `erp` `saas` `analytics`

### 2. A custom theme

```tsx
import { createGridTheme } from 'react-smart-table-grid/theme';

const myTheme = createGridTheme({
  extends: 'modern',
  colors: { primary: '#2563EB', headerBackground: '#F8FAFC' },
  radius: { container: '14px' },
  header: { height: 52, textTransform: 'uppercase' },
  row: { height: 56, striped: true },
  pagination: { variant: 'pill' },
});

<SmartDataGrid theme={myTheme} />
```

### 3. CSS variables

```css
.my-grid {
  --grid-primary: #7c3aed;
  --grid-header-background: #faf5ff;
  --grid-header-text: #5b21b6;
  --grid-row-hover: #faf5ff;
  --grid-row-selected: #f3e8ff;
  --grid-border: #e9d5ff;
  --grid-radius: 14px;
  --grid-row-height: 56px;
  --grid-header-height: 48px;
  --grid-font-size: 14px;
}
```

### Slots

Every slot takes `className`, `style`, `variant` and `size`, plus its own properties:

`table` `header` `headerCell` `body` `row` `cell` `footer` `toolbar` `search` `filter` `pagination` `checkbox` `loading` `emptyState` `errorState` `scrollbar` `icon` `actions` `button`

### Application presets

```tsx
<SmartDataGrid preset="enterprise" />
```

`admin` `crm` `hrms` `erp` `analytics` `saas` `enterprise` `minimal` `dashboard` `ecommerce` — each bundles a theme, density, toolbar and feature set. Your own props always win.

---

## Features

<details open>
<summary><b>Data & columns</b></summary>

- Dot-path accessors (`profile.address.city`) and `accessorFn`
- Computed columns, custom cell/header/footer renderers
- Multi-level header groups
- Footer aggregation: `sum` `avg` `min` `max` `count` `countDistinct` `first` `last` or a function
- 28 built-in cell types — text, number, currency, percentage, date, datetime, relativeTime, avatar, avatarGroup, badge, status, progress, rating, boolean, checkbox, switch, link, email, phone, image, icon, action, button, dropdown, tags, code, json, trend

</details>

<details>
<summary><b>Sorting, search, filtering</b></summary>

- Single and multi-column sorting (shift-click), custom comparators, empty-value placement
- Global search, per-column search, fuzzy search with relevance ranking, debouncing, highlighting
- 15 filter operators and a nested **AND / OR / NOT** filter builder

```tsx
filters={[{
  operator: 'AND',
  conditions: [
    { field: 'name',   operator: 'contains',    value: 'John' },
    { field: 'age',    operator: 'greaterThan', value: 25 },
    { operator: 'OR', conditions: [
      { field: 'status', operator: 'equals', value: 'active' },
      { field: 'status', operator: 'equals', value: 'pending' },
    ]},
  ],
}]}
```

</details>

<details>
<summary><b>Columns & rows</b></summary>

- Visibility, drag-to-reorder, drag-to-resize (double-click to auto-size), left/right pinning, sticky header/footer
- Responsive priority columns, min/max/auto width, `flex` growth
- Expandable rows with custom content, tree data (nested or parent-pointer), row grouping with per-group aggregates
- Row actions as buttons, icon buttons or a dropdown; bulk actions on selection
- Built-in **Column Settings** panel

</details>

<details>
<summary><b>Editing</b></summary>

- Editors: text, number, select, multi-select, checkbox, switch, date, datetime, textarea, custom
- Per-column validation, undo/redo, optimistic updates, `onRowUpdate` for persistence

</details>

<details>
<summary><b>Scale</b></summary>

- Row virtualization that keeps `<table>` semantics (spacer rows, not absolute positioning) — verified to 1,000,000 rows
- Infinite scroll with end detection and error retry
- Memoized rows and cells; the pipeline only recomputes what changed

</details>

<details>
<summary><b>Server-side</b></summary>

```tsx
const provider = createDataProvider({
  fetch: async ({ page, pageSize, sorting, filters, search, signal }) => {
    const res = await api.users({ page, pageSize, sorting, filters, search, signal });
    return { rows: res.data, total: res.total };
  },
});

<SmartDataGrid columns={columns} dataProvider={provider} searchable sortable pagination />
```

Or declaratively:

```tsx
<SmartDataGrid
  columns={columns}
  dataSource={{
    url: '/api/users',
    method: 'GET',
    paramMap: { pageSize: 'limit' },
    transform: (res) => ({ rows: res.data, total: res.meta.total }),
  }}
/>
```

Requests are keyed on the state the server cares about, aborted when superseded, and never fire for client-only changes like column resizing. Optional adapters for fetch, axios, React Query, SWR and RTK Query live in `react-smart-table-grid/adapters` — none of those libraries are dependencies.

</details>

<details>
<summary><b>Export</b></summary>

CSV · JSON · Excel · PDF · Print · Clipboard, scoped to `all` / `page` / `selected` / `filtered`.

```tsx
grid.exportData({ format: 'excel', scope: 'selected', filename: 'team' });
```

CSV output neutralises formula injection (`=`, `+`, `-`, `@`) and ships a UTF-8 BOM so Excel gets the encoding right.

</details>

<details>
<summary><b>Presentation</b></summary>

- Density: `dense` `compact` `comfortable` `spacious`
- Dark mode: `light` `dark` `system` (respects `prefers-color-scheme`)
- RTL: `dir="rtl"` mirrors pinning, chevrons, drag, switches
- Responsive: `horizontal-scroll` `stacked` `card` `priority`, with a mobile card view and bottom-sheet filters
- Loading: skeleton, spinner, progress, shimmer, overlay, minimal
- Empty and error states with retry
- Animations honour `prefers-reduced-motion`, or turn them off with `animations={false}`

</details>

<details>
<summary><b>Accessibility</b></summary>

- `role="grid"`, `aria-rowcount`/`aria-colcount`, `aria-sort`, `aria-selected`, `aria-busy`
- Arrow-key cell navigation, Home/End, PageUp/PageDown
- <kbd>Enter</kbd> edit · <kbd>Esc</kbd> cancel · <kbd>Space</kbd> select · <kbd>Ctrl/⌘+A</kbd> select all · <kbd>Ctrl/⌘+F</kbd> search · <kbd>Ctrl/⌘+E</kbd> export — all rebindable via `shortcuts`
- Focus management and a polite live region for result counts

</details>

<details>
<summary><b>State</b></summary>

Controlled, uncontrolled, or a mix — every slice is independent.

```tsx
<SmartDataGrid state={{ sorting, filters, pagination }} onStateChange={setState} />
```

Plus optional URL sync (`?page=2&search=john&sort=name.asc`) and `localStorage` persistence:

```tsx
<SmartDataGrid urlState persist={{ key: 'users-grid' }} />
```

</details>

---

## Imperative API

```tsx
<SmartDataGrid onReady={(grid) => (apiRef.current = grid)} />
```

`getAllRows` `getFilteredRows` `getPageRows` `getSelectedRows` `getState` `setState` `resetState` `setSorting` `toggleSort` `clearSorting` `setFilters` `addFilter` `removeFilter` `clearFilters` `setSearch` `setColumnSearch` `clearSearch` `setPage` `nextPage` `previousPage` `firstPage` `lastPage` `setPageSize` `selectRow` `toggleRow` `selectAll` `clearSelection` `toggleColumnVisibility` `setColumnOrder` `moveColumn` `resizeColumn` `autoSizeColumn` `pinColumn` `resetColumns` `toggleExpanded` `expandAll` `collapseAll` `setGrouping` `startEditing` `stopEditing` `updateRow` `undo` `redo` `setDensity` `toggleFullscreen` `exportData` `refresh` `scrollToRow` `scrollToTop` `getTheme`

---

## Headless

```tsx
import {
  resolveColumns, searchRows, filterRows, sortRows, createInitialState,
} from 'react-smart-table-grid/headless';

const resolved = resolveColumns({ columns, state: createInitialState(), defaults });
const rows = sortRows(filterRows(searchRows({ … }), filters, resolved.byId), sorting, resolved.byId);
```

Or keep the engine and bring your own markup:

```tsx
<SmartDataGrid headless data={rows} columns={columns}>
  {({ grid }) => <MyOwnTable rows={grid.getPageRows()} />}
</SmartDataGrid>
```

---

## Plugins

```tsx
<SmartDataGrid plugins={[auditPlugin(), highlightPlugin()]} />
```

A plugin can seed initial state, transform columns, transform rows, contribute toolbar UI, and observe state changes.

---

## TypeScript

Fully generic over your row type, with no `any` in the public surface.

```tsx
<SmartDataGrid<User> data={users} columns={columns} />
```

`ColumnDef<T>`, `CellContext<T>`, `GridApi<T>`, `GridState`, `GridTheme`, `GridUIConfig`, `DataProvider<T>`, `ExportOptions<T>` and everything else are exported.

---

## Compatibility

| | |
| --- | --- |
| React | 17, 18, 19 |
| Next.js | App Router, Pages Router, SSR, CSR |
| Bundlers | Vite, webpack, Rollup, esbuild, Turbopack |
| Output | ESM + CJS + `.d.ts` |
| Languages | TypeScript and JavaScript |

---

## Project status

See **[PROGRESS.md](PROGRESS.md)** for the full feature checklist, including what is still pending.

## Docs

- **[LIVE-VIEW.md](LIVE-VIEW.md)** — run the playground, install into other projects, framework setup
- **[docs/](docs/)** — API reference, theming guide, Next.js guide, migration notes
- **[CONTRIBUTING.md](CONTRIBUTING.md)**
- **[CHANGELOG.md](CHANGELOG.md)**

## License

MIT License - Copyright (c) 2026 **Yogesh Gabani**

Built by **Yogesh Gabani**.
