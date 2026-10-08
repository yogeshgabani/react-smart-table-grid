# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-10-08

First public release, published to npm as **`react-smart-table-grid`**.

### Added

**Core**
- Generic `<SmartDataGrid<T>>` with dynamic data and columns
- Dot-path accessors, `accessorFn`, computed columns
- Custom cell, header and footer renderers
- Multi-level header groups that stay aligned with the body when columns are pinned
- Footer and group aggregation (`sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `first`, `last`, custom), formatted in the column's own style
- 28 built-in cell types, from currency and relative time to avatars, progress, rating, tags and trend

**Sorting, search, filtering**
- Single and multi-column sorting with custom comparators and empty-value placement
- Global, per-column and fuzzy search with debouncing and highlighting
- 15 filter operators plus a nested AND/OR/NOT filter builder and filter panel
- Date filters that treat a `YYYY-MM-DD` value as the whole local day

**Columns and rows**
- Visibility, drag reorder, drag resize with auto-size, left/right pinning with themeable frozen-column shadows (RTL-aware)
- Sticky header and footer (`stickyHeader`, `stickyFooter`)
- Responsive priority columns, min/max/auto widths, flexible growth
- Expandable rows, tree data (nested and parent-pointer), collapsible row grouping
- Single (radio) and multiple (checkbox) selection, select page / filtered / all — disabled and non-selectable rows are skipped
- Row actions (buttons, icon buttons, or a "⋯" menu — chosen automatically when actions have no icons) and bulk actions
- Columns panel with an optional Save hook (`onSaveColumns`)

**Editing**
- Ten editor types, per-column validation, keyboard commits, undo/redo, optimistic updates
- `onRowUpdate`, and `onAddRow` for the toolbar's "Add row" button

**Scale**
- Row virtualization that preserves table semantics, verified to 1,000,000 rows
- Infinite scroll with end detection and error retry

**Server-side**
- `createDataProvider`, declarative `dataSource`, request keying and abort-on-supersede
- Optional adapters for fetch, axios, React Query, SWR, RTK Query — none of them dependencies

**Export**
- CSV, JSON, Excel (SpreadsheetML), PDF, Print and Clipboard, scoped to all / page / selected / filtered
- CSV formula-injection neutralisation (numbers stay numeric) and a UTF-8 BOM

**Design system**
- `createGridTheme()` with tokens for colours, typography, spacing, borders, radius, shadows, sizing, motion
- One-stop `ui` config across 19 slots, each with `className` / `style` / `variant` / `size`
- 90+ `--grid-*` CSS variables, including hover / active overlay and frozen-shadow tokens
- 22 theme presets and 10 application presets
- Density, dark mode (`light` / `dark` / `system`) that keeps brand colours and swaps light surfaces, RTL, four responsive modes, mobile card view
- Loading, empty and error state variants; themed dropdowns; consistent hover, active and focus-visible states
- Motion honouring `prefers-reduced-motion`

**Platform**
- ESM + CJS + per-condition type declarations, subpath exports for `/grid`, `/theme`, `/headless`, `/export`, `/adapters`, `/cells` and `/styles.css`
- Zero runtime dependencies; React 18 or 19 is the only peer
- SSR-safe; Next.js App Router and Pages Router supported
- ARIA grid roles, keyboard navigation and rebindable shortcuts
- Controlled/uncontrolled state, URL sync, `localStorage` persistence
- Plugin architecture: `initState`, `columns`, `transform`, `onStateChange`, `onMount` and toolbar contributions
- Headless mode and the `/headless` entry point
- 81 unit, integration and server-rendering tests

**Security**
- `link` cells only render `http(s)`, `mailto`, `tel`, `ftp` and relative URLs; `javascript:`, `data:` and similar URLs from row data are shown as text (`safeHref` is exported for custom cells)

### Known limitations
- Column virtualization is not implemented (row virtualization is).
- Typed but not yet wired: `TreeConfig.loadChildren`, `TreeConfig.cascadeSelection`, `renderSubRow`, `editMode`.
- Per-cell column spanning, content-measuring auto-width, and swipe actions on mobile cards are not implemented.
- Tree sorting and filtering apply to root rows only.
