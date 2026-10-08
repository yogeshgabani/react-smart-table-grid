# API Reference

## `<SmartDataGrid<T>>`

### Data

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `T[]` | `[]` | Client-side rows. Omit when using `dataProvider`/`dataSource`. |
| `columns` | `ColumnDef<T>[]` | — | **Required.** |
| `getRowId` | `keyof T \| (row, index) => string` | `'id'` then index | Stable row identity — selection and expansion depend on it. |
| `rowCount` | `number` | — | Total for server-side pagination. |
| `loading` | `boolean \| LoadingSlot` | `false` | `true` shows the loading state; an object only styles it, e.g. `{ variant: 'overlay' }`. |
| `error` | `Error \| string \| null` | `null` | |

### Server-side

| Prop | Type | Notes |
| --- | --- | --- |
| `dataProvider` | `DataProvider<T>` | From `createDataProvider()`. |
| `dataSource` | `DataSourceConfig<T>` | Declarative URL config. |
| `manual` | `boolean \| { sorting, filtering, pagination, search }` | Defaults to `true` when a provider is present. |

### Feature flags

| Prop | Type | Default |
| --- | --- | --- |
| `sortable` | `boolean` | `true` |
| `multiSort` | `boolean` | `false` |
| `searchable` | `boolean` | `false` |
| `searchDebounce` | `number` | `300` |
| `searchMode` | `'contains' \| 'startsWith' \| 'exact' \| 'fuzzy' \| 'words'` | `'contains'` |
| `highlightSearch` | `boolean` | `false` |
| `filterable` | `boolean` | `false` |
| `pagination` | `boolean \| PaginationConfig` | `false` |
| `selectable` | `boolean \| 'none' \| 'single' \| 'multiple'` | `false` |
| `resizable` | `boolean` | `false` |
| `reorderable` | `boolean` | `false` |
| `virtualized` | `boolean \| VirtualizationConfig` | `false` |
| `editable` | `boolean` | `false` |
| `exportable` | `boolean \| ExportFormat[]` | `false` |
| `expandable` | `boolean` | `false` |
| `groupable` | `boolean` | `false` |
| `stickyHeader` | `boolean` | `true` |
| `stickyFooter` | `boolean` | `false` |
| `showFooter` | `boolean` | auto — shown when a column declares `aggregate` or `footer` |
| `infiniteScroll` | `boolean \| InfiniteScrollConfig` | `false` |
| `tree` | `boolean \| TreeConfig<T>` | `false` |
| `keyboard` | `boolean` | `true` |
| `shortcuts` | `KeyboardShortcuts` | — |

### Presentation

| Prop | Type | Default |
| --- | --- | --- |
| `preset` | `GridPresetName` | — |
| `theme` | `ThemePreset \| GridTheme \| GridThemeInput` | `'default'` |
| `ui` | `GridUIConfig` | — |
| `density` | `'dense' \| 'compact' \| 'comfortable' \| 'spacious'` | `'comfortable'` |
| `darkMode` | `'light' \| 'dark' \| 'system'` | `'light'` |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` |
| `responsive` | `'horizontal-scroll' \| 'stacked' \| 'card' \| 'priority' \| false` | `'horizontal-scroll'` |
| `animations` | `boolean` | `true` |
| `height` / `maxHeight` | `number \| string` | — |
| `headless` | `boolean` | `false` |
| `injectStyles` | `boolean` | `true` |

### Slots and rendering

`toolbar` · `emptyState` · `errorState` · `rowActions` · `bulkActions` · `renderExpanded` · `renderRow` · `children`
`rowClassName` · `rowStyle` · `isRowDisabled` · `isRowSelectable`

### State

`state` · `defaultState` · `onStateChange` · `urlState` · `persist` · `plugins`

### Events

`onRowClick` · `onRowDoubleClick` · `onCellClick` · `onSelectionChange` · `onSortChange` · `onFilterChange` · `onSearchChange` · `onPageChange` · `onColumnVisibilityChange` · `onColumnOrderChange` · `onColumnResize` · `onRowUpdate` · `onExpandedChange` · `onRefresh` · `onAddRow` · `onExport` · `onReady`

`toolbar` alone shows every standard button. A `toolbar` object starts from the feature flags (`searchable` → search, `filterable` → filter, `resizable`/`reorderable` → columns, `exportable` → export) and adds to or overrides them, so `toolbar={{ refresh: true, addRow: true }}` adds just those two.

---

## `ColumnDef<T>`

```ts
{
  id?: string;                       // defaults to accessorKey
  accessorKey?: string;              // supports 'profile.address.city'
  accessorFn?: (row, index) => unknown;

  header?: ReactNode | ((ctx: HeaderContext<T>) => ReactNode);
  footer?: ReactNode | ((ctx: FooterContext<T>) => ReactNode);
  cell?:   (ctx: CellContext<T>) => ReactNode;

  type?: CellType;                   // built-in renderer
  cellOptions?: CellTypeOptions;
  format?: (value, row) => string;

  columns?: ColumnDef<T>[];          // header group

  width?: number; minWidth?: number; maxWidth?: number; flex?: number;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';

  sortable?: boolean;
  sortComparator?: (a, b, direction) => number;
  sortAccessor?: (row) => unknown;
  emptySort?: 'first' | 'last';

  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  filterOperators?: FilterOperator[];
  filterFn?: (row, condition) => boolean;

  searchable?: boolean;
  hidden?: boolean; hideable?: boolean;
  pinned?: 'left' | 'right' | false; pinnable?: boolean;
  resizable?: boolean; reorderable?: boolean;

  editable?: boolean | ((row) => boolean);
  editor?: EditorType | ((ctx: EditorContext<T>) => ReactNode);
  editorOptions?: FilterOption[];
  validate?: (value, row) => string | null | true | undefined;
  parse?: (input: string) => unknown;

  groupable?: boolean;
  aggregate?: AggregateType | ((rows, columnId) => unknown);

  priority?: number; minViewport?: number;   // responsive
  className?; style?; headerClassName?; headerStyle?;
  truncate?: boolean; tooltip?: boolean | ((ctx) => string);
  meta?: Record<string, unknown>;
}
```

### Cell types

`text` `number` `currency` `percentage` `date` `datetime` `relativeTime` `avatar` `avatarGroup` `badge` `status` `progress` `rating` `boolean` `checkbox` `switch` `link` `email` `phone` `image` `icon` `action` `button` `dropdown` `tags` `code` `json` `trend`

`cellOptions` covers `currency` `locale` `decimals` `notation` `prefix` `suffix` `dateFormat` `timeZone` `colorMap` `max` `showValue` `srcKey` `nameKey` `maxAvatars` `hrefKey` `target` `maxTags` `outOf` `imageWidth` `imageHeight` `actions` `trueLabel` `falseLabel` `trendDirectionKey`.

---

## Filters

### Operators

`equals` `notEquals` `contains` `notContains` `startsWith` `endsWith` `greaterThan` `greaterThanOrEqual` `lessThan` `lessThanOrEqual` `between` `in` `notIn` `isEmpty` `isNotEmpty`

Comparison operators are type-aware: numbers compare numerically, dates chronologically, everything else with a natural-order collator. A condition with no value is treated as inactive rather than as "match nothing", so a half-built filter row never blanks the grid.

### Groups

```ts
filters: [
  {
    operator: 'AND',                       // 'AND' | 'OR' | 'NOT'
    conditions: [
      { field: 'name', operator: 'contains', value: 'John' },
      { operator: 'OR', conditions: [ /* nested */ ] },
    ],
  },
]
```

Top-level groups are ANDed together.

---

## `GridState`

```ts
{
  sorting: SortRule[];
  filters: FilterGroup[];
  search: { query: string; columns: Record<string, string> };
  pagination: { pageIndex: number; pageSize: number; cursor?: string | null };
  selection: string[];
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  columnPinning: { left: string[]; right: string[] };
  expanded: string[];
  grouping: string[];
  density: Density;
  editing: { rowId: string; columnId: string } | null;
  fullscreen: boolean;
}
```

Any subset can be passed as `state` to control it. `onStateChange` receives the full state plus `{ key }` naming the slice that changed — useful for narrow server refetches.

---

## `GridApi<T>`

Obtained via `onReady`, `useGridContext()`, or the `children` render prop.

**Rows** `getAllRows` `getFilteredRows` `getPageRows` `getSelectedRows` `getRowId` `getRowCount`
**Columns** `getColumns` `getVisibleColumns` `toggleColumnVisibility` `setColumnOrder` `moveColumn` `resizeColumn` `autoSizeColumn` `pinColumn` `resetColumns`
**State** `getState` `setState` `resetState`
**Sorting** `setSorting` `toggleSort` `clearSorting`
**Filtering** `setFilters` `addFilter` `removeFilter` `clearFilters`
**Search** `setSearch` `setColumnSearch` `clearSearch`
**Paging** `setPage` `nextPage` `previousPage` `firstPage` `lastPage` `setPageSize` `getPageCount`
**Selection** `selectRow` `toggleRow` `selectAll` `clearSelection` `isRowSelected`
**Expansion** `toggleExpanded` `expandAll` `collapseAll` `isExpanded`
**Grouping** `setGrouping`
**Editing** `startEditing` `stopEditing` `updateRow` `undo` `redo` `canUndo` `canRedo`
**Misc** `setDensity` `toggleFullscreen` `exportData` `refresh` `scrollToRow` `scrollToTop` `getTheme`

---

## Data providers

```ts
const provider = createDataProvider<User>({
  key: 'users',                    // contributes to the request cache key
  fetch: async ({ page, pageIndex, pageSize, cursor, sorting, filters, search, columnSearch, grouping, signal }) => ({
    rows: [], total: 0, nextCursor: null, hasMore: false, aggregates: {},
  }),
  update: async (payload) => {},   // optional write-back for inline editing
  create: async (row) => {},
  delete: async (rowId, row) => {},
});
```

`dataSource` is the declarative equivalent:

```ts
dataSource={{
  url: '/api/users',
  method: 'GET',                                   // GET POST PUT PATCH DELETE
  headers: () => ({ Authorization: token }),
  paramMap: { pageSize: 'limit' },                 // rename params
  serialize: (params) => ({ … }),                  // build the payload yourself
  transform: (res) => ({ rows: res.data, total: res.meta.total }),
  fetcher: (url, init) => myClient(url, init),     // bring your own HTTP client
}}
```

---

## Export

```ts
grid.exportData({
  format: 'csv',        // csv | json | excel | pdf | print | clipboard
  scope: 'filtered',    // all | page | selected | filtered
  filename: 'users',
  columns: ['name', 'email'],
  includeHeaders: true,
  delimiter: ',',
  raw: false,
  formatCell: (value, row, columnId) => String(value),
});
```

`pdf` and `print` open a styled print window (choose "Save as PDF"). `excel` emits SpreadsheetML, which Excel, LibreOffice and Numbers all open natively — no zip dependency.

---

## Keyboard

| Key | Action |
| --- | --- |
| Arrows | Move the focused cell |
| Home / End | First / last row |
| PageUp / PageDown | Previous / next page |
| Enter | Start editing |
| Escape | Cancel editing, clear focus |
| Space | Toggle row selection |
| Ctrl/⌘ + A | Select all on page |
| Ctrl/⌘ + F, Ctrl/⌘ + K | Focus search |
| Ctrl/⌘ + E | Export CSV |
| Ctrl/⌘ + ← / → | Previous / next page |

Rebind with `shortcuts={{ selectAll: 'mod+shift+a', search: false }}`.

---

## Plugins

```ts
const myPlugin: GridPlugin<User> = {
  name: 'my-plugin',
  initState: (state) => ({ ...state, density: 'compact' }),
  columns: (columns) => [...columns, extraColumn],
  transform: (rows, { state }) => rows,
  toolbar: ({ grid }) => <MyButton grid={grid} />,
  onStateChange: (state, meta) => {},
  onMount: ({ grid }) => () => {},
};
```
