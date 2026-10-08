# Recipes

Short, copy-paste answers to the things people actually ask.

---

## Read a nested field

```tsx
{ accessorKey: 'profile.address.city', id: 'city', header: 'City' }
```

Give it an explicit `id` — the dot path works as an id, but a short one is nicer in state and URLs.

## Build a column from several fields

```tsx
{
  id: 'fullName',
  header: 'Name',
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
}
```

Sorting, search and filtering all use the computed value.

## Custom cell rendering

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ value, row, grid }) => (
    <StatusBadge status={String(value)} onClick={() => grid.selectRow(row.id)} />
  ),
}
```

## Reuse the built-in renderers in a custom cell

```tsx
import { Badge, Avatar, ProgressBar, Highlight } from 'react-smart-table-grid';

cell: ({ value, row, highlight }) => (
  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <Avatar src={row.avatar} name={row.name} />
    <Highlight text={String(value)} query={highlight} />
  </span>
)
```

## Conditional row styling

```tsx
<SmartDataGrid
  rowClassName={(row) => (row.overdue ? 'row-overdue' : undefined)}
  rowStyle={(row) => (row.priority === 'high' ? { fontWeight: 600 } : undefined)}
  isRowDisabled={(row) => row.archived}
  isRowSelectable={(row) => !row.archived}
/>
```

## Row actions in a dropdown, revealed on hover

```tsx
<SmartDataGrid
  rowActions={[
    { id: 'view',   label: 'View',   icon: <EyeIcon />,   onClick: (row) => open(row) },
    { id: 'edit',   label: 'Edit',   icon: <EditIcon />,  onClick: (row) => edit(row) },
    { id: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true, divider: true,
      disabled: (row) => row.locked,
      onClick: (row) => remove(row) },
  ]}
  ui={{ actions: { display: 'dropdown', showOnHover: true } }}
/>
```

## Bulk actions on the selection

```tsx
<SmartDataGrid
  selectable
  bulkActions={[
    { id: 'archive', label: 'Archive', onClick: (rows) => archive(rows) },
    { id: 'delete',  label: 'Delete',  danger: true,
      disabled: (rows) => rows.some((r) => r.locked),
      onClick: (rows) => remove(rows) },
  ]}
/>
```

A selection bar appears above the grid with a "Select all N" shortcut.

## Freeze the first and last columns

```tsx
const columns = [
  { accessorKey: 'name',   header: 'Name',   pinned: 'left',  width: 220 },
  /* … */
  { accessorKey: 'actions', header: '',      pinned: 'right', width: 90 },
];
```

Users can also pin from each column's menu. The `rowActions` column pins right automatically.

## Persist column layout per user

```tsx
<SmartDataGrid persist={{ key: `users-grid:${userId}` }} />
```

Saves visibility, order, sizing, pinning, density and page size to `localStorage`. Narrow it with `keys: ['columnSizing', 'columnOrder']`.

## Deep-linkable filters

```tsx
<SmartDataGrid urlState={{ keys: ['page', 'search', 'sort', 'filters'], history: 'replace' }} />
```

Produces `?page=2&search=john&sort=name.asc`.

## Control one slice, leave the rest alone

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

<SmartDataGrid
  state={{ sorting }}
  onStateChange={(next) => setSorting(next.sorting)}
/>
```

Pagination, selection and column layout stay internal.

## React Query

```tsx
const [gridState, setGridState] = useState<GridState>();

const { data, isFetching } = useQuery({
  queryKey: ['users', gridState?.pagination, gridState?.sorting, gridState?.search],
  queryFn: () => api.users(gridState),
  placeholderData: keepPreviousData,
});

<SmartDataGrid
  columns={columns}
  data={data?.rows ?? []}
  rowCount={data?.total}
  loading={isFetching}
  manual
  onStateChange={setGridState}
  searchable
  sortable
  pagination={{ pageSize: 25 }}
/>
```

`manual` tells the grid you're handling sorting/filtering/paging yourself, so it renders `data` as-is.

## Infinite scroll

```tsx
<SmartDataGrid
  data={rows}
  columns={columns}
  pagination={false}
  virtualized
  infiniteScroll={{
    hasMore,
    loading,
    threshold: 300,
    loadMore: () => fetchNextPage(),
    error: fetchError,
  }}
  height={600}
/>
```

## A million rows

```tsx
<SmartDataGrid
  data={rows}
  columns={columns}
  virtualized={{ threshold: 100, overscan: 10, rowHeight: 40 }}
  density="compact"
  pagination={false}
  height={600}
/>
```

Keep `cell` renderers cheap — they run for every visible row on every scroll frame.

## Variable row heights

```tsx
virtualized={{ rowHeight: (index) => (rows[index].expanded ? 120 : 44) }}
```

## Export only what's selected

```tsx
grid.exportData({ format: 'excel', scope: 'selected', filename: 'chosen-users' });
```

Scopes: `all` (every row), `filtered` (after search + filters), `page` (current page), `selected`.

## Custom export formatting

```tsx
grid.exportData({
  format: 'csv',
  columns: ['name', 'email', 'salary'],
  formatCell: (value, row, columnId) =>
    columnId === 'salary' ? `$${Number(value).toLocaleString()}` : String(value ?? ''),
});
```

## Inline editing with a select

```tsx
{
  accessorKey: 'role',
  header: 'Role',
  editable: true,
  editor: 'select',
  editorOptions: [
    { label: 'Engineer', value: 'engineer' },
    { label: 'Manager',  value: 'manager' },
  ],
  validate: (value) => (value ? null : 'Role is required'),
}
```

## A completely custom editor

```tsx
{
  accessorKey: 'assignee',
  editable: true,
  editor: ({ value, setValue, save, cancel }) => (
    <UserPicker
      value={value as string}
      onChange={setValue}
      onConfirm={save}
      onCancel={cancel}
      autoFocus
    />
  ),
}
```

## Tree data

```tsx
// nested
<SmartDataGrid tree={{ childrenKey: 'children', indent: 20 }} data={nested} />

// flat with parent pointers
<SmartDataGrid tree={{ parentKey: 'parentId' }} data={flat} />

// lazy children
<SmartDataGrid tree={{ loadChildren: async (row) => api.children(row.id) }} data={roots} />
```

## Group and aggregate

```tsx
<SmartDataGrid
  groupable
  showFooter
  defaultState={{ grouping: ['department'] }}
  columns={[
    { accessorKey: 'department', header: 'Department', groupable: true },
    { accessorKey: 'salary', header: 'Salary', type: 'currency', aggregate: 'sum' },
    { accessorKey: 'score',  header: 'Score',  aggregate: (rows) => rows.length },
  ]}
/>
```

## Expandable detail rows

```tsx
<SmartDataGrid
  expandable
  renderExpanded={({ row, grid }) => (
    <OrderDetails order={row} onClose={() => grid.toggleExpanded(row.id, false)} />
  )}
/>
```

## Mobile card view

```tsx
<SmartDataGrid responsive="card" />
```

The first non-system column becomes the card title; the rest render as label/value rows. Filters open as a bottom sheet on small screens.

## Hide low-priority columns on narrow screens

```tsx
<SmartDataGrid
  responsive="priority"
  columns={[
    { accessorKey: 'name',    header: 'Name' },                    // always visible
    { accessorKey: 'email',   header: 'Email',   minViewport: 700 },
    { accessorKey: 'country', header: 'Country', minViewport: 900 },
  ]}
/>
```

## Fuzzy search

```tsx
<SmartDataGrid searchable searchMode="fuzzy" highlightSearch searchDebounce={200} />
```

Results are ranked by match quality — `"jdoe"` finds "John Doe".

## Programmatic control

```tsx
const gridRef = useRef<GridApi<User>>(null);

<SmartDataGrid onReady={(api) => (gridRef.current = api)} />

gridRef.current?.setSorting([{ id: 'name', direction: 'asc' }]);
gridRef.current?.selectAll('filtered');
gridRef.current?.scrollToRow(500);
gridRef.current?.toggleFullscreen();
```

## Headless — keep the engine, replace the UI

```tsx
<SmartDataGrid headless data={rows} columns={columns} searchable>
  {({ grid }) => (
    <MyList
      rows={grid.getPageRows()}
      onSearch={grid.setSearch}
      onNext={grid.nextPage}
    />
  )}
</SmartDataGrid>
```

Or skip React entirely and call `runPipeline()` from `react-smart-table-grid/headless`.

## Style with Tailwind

```tsx
<SmartDataGrid
  className="rounded-xl shadow-lg ring-1 ring-slate-200"
  ui={{
    header: { className: 'bg-slate-900 text-white' },
    row:    { className: 'hover:bg-slate-50' },
    cell:   { className: 'text-sm' },
  }}
/>
```

Tailwind is never required — this is just one of the supported ways in.
