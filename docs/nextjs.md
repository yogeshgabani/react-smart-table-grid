# Next.js

The grid is SSR-safe: no `window`, `document` or `navigator` is touched during render. Measuring, style injection and media queries all happen in effects.

## App Router

The grid is interactive, so it belongs in a Client Component. Keep the page itself a Server Component and pass data down.

```tsx
// app/users/users-grid.tsx
'use client';

import { SmartDataGrid, type ColumnDef } from 'react-smart-table-grid';

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email', type: 'email' },
  { accessorKey: 'status', header: 'Status', type: 'status' },
];

export function UsersGrid({ users }: { users: User[] }) {
  return (
    <SmartDataGrid
      data={users}
      columns={columns}
      getRowId="id"
      searchable
      filterable
      selectable
      pagination={{ pageSize: 25 }}
      injectStyles={false}
    />
  );
}
```

```tsx
// app/users/page.tsx — stays a Server Component
import { UsersGrid } from './users-grid';

export default async function Page() {
  const users = await db.user.findMany();
  return <UsersGrid users={users} />;
}
```

```tsx
// app/layout.tsx
import 'react-smart-table-grid/styles.css';
```

### Why `injectStyles={false}` + a CSS import

By default the grid injects its stylesheet into `document.head` on mount — great for client-only apps, but on a server-rendered page the first paint arrives before that effect runs, so you get a frame of unstyled table. Importing `react-smart-table-grid/styles.css` in the layout puts the CSS in the document from the start; `injectStyles={false}` then skips the runtime injection.

## Pages Router

```tsx
// pages/_app.tsx
import 'react-smart-table-grid/styles.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

```tsx
// pages/users.tsx
import { SmartDataGrid } from 'react-smart-table-grid';

export async function getServerSideProps() {
  return { props: { users: await fetchUsers() } };
}

export default function Users({ users }) {
  return <SmartDataGrid data={users} columns={columns} injectStyles={false} searchable pagination />;
}
```

## Dynamic import

Optional — use it to keep the grid out of the server bundle entirely.

```tsx
import dynamic from 'next/dynamic';

const SmartDataGrid = dynamic(
  () => import('react-smart-table-grid').then((m) => m.SmartDataGrid),
  { ssr: false, loading: () => <TableSkeleton /> },
);
```

## Server Actions for editing

```tsx
'use client';

import { SmartDataGrid } from 'react-smart-table-grid';
import { updateUser } from './actions';

export function EditableUsers({ users }) {
  return (
    <SmartDataGrid
      data={users}
      columns={columns}
      getRowId="id"
      editable
      onRowUpdate={async ({ rowId, changes }) => {
        await updateUser(rowId, changes);
      }}
    />
  );
}
```

The grid applies the change optimistically and calls `onRowUpdate`; if the action throws, call `grid.undo()`.

## Route Handlers as a data source

```ts
// app/api/users/route.ts
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 25);

  const [rows, total] = await Promise.all([
    db.user.findMany({ skip: (page - 1) * pageSize, take: pageSize }),
    db.user.count(),
  ]);

  return Response.json({ rows, total });
}
```

```tsx
'use client';

<SmartDataGrid
  columns={columns}
  dataSource={{ url: '/api/users' }}
  searchable
  sortable
  pagination={{ pageSize: 25 }}
/>
```

## URL state and the Next.js router

```tsx
<SmartDataGrid urlState={{ prefix: 'users_', history: 'replace' }} … />
```

The grid writes query params with `history.replaceState`, which does **not** trigger a Next.js navigation — so the page won't re-render on every keystroke. Read the params server-side from `searchParams` if you want deep links to work on a cold load.

## Which features need `"use client"`

Everything interactive: sorting, search, filtering, pagination, selection, resizing, reordering, editing, virtualization, export, fullscreen and dark-mode detection. In practice: the grid component itself is always a Client Component. Data fetching, formatting and column definitions can stay on the server.

## Turbopack / webpack

No configuration needed. The package ships ESM and CJS with an `exports` map and marks only its stylesheet as a side effect (`"sideEffects": ["**/*.css"]`), so tree shaking works out of the box and `import 'react-smart-table-grid/styles.css'` is never dropped from a production build.
