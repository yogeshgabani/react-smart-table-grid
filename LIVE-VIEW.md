# 👀 Live View — see the grid, and use it in your other projects

Two separate things live here:

1. **[Run the playground](#1-run-the-playground)** — a local app that renders every feature of this package. Use it to *see* the grid.
2. **[Install it into another project](#2-use-it-in-another-project)** — three ways to consume this package from a different app on your machine, before it is ever published to npm.

---

## 1. Run the playground

```bash
cd "react-smart-grid"
npm install      # first time only
npm run dev
```

Opens <http://localhost:5178> automatically.

**Footer social links** come from a `.env` file next to `package.json` — copy `.env.example` to `.env` and fill in the `VITE_SOCIAL_*` URLs. Any link left empty still shows its icon but opens a "Coming soon" dialog. Restart `npm run dev` after editing `.env`. When deploying (Netlify, Vercel…), add the same variables in the host's environment settings and redeploy, because `.env` isn't committed and the values are fixed at build time.

The dev server aliases `react-smart-table-grid` straight at `src/`, so **editing any file in `src/` hot-reloads the playground instantly** — no build step, no watch process, no `npm link`.

### What's in there

Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> (or <kbd>/</kbd>) to jump to any page. The sun / moon / monitor switch in the top bar sets light, dark or system theme for the page **and every grid on it**. Each demo has **Preview / Code** tabs with a copy button.

| Page | What it proves |
| --- | --- |
| **Introduction** | Install, the two-prop grid, then feature flags |
| **Live playground** | Toggle any prop in a side panel; the grid updates live, the matching JSX is generated, and an event log shows every callback firing |
| **Full showcase** | Search, filters, grouping, selection, expansion, row actions, export, fullscreen — all at once, with an event log |
| **One-stop UI** | Four completely different designs from one `ui` object |
| **Theme presets** | All 22 built-in themes side by side, light and dark |
| **Theme builder** | Live controls → instant preview → copy the generated theme |
| **App presets** | `admin` · `crm` · `hrms` · `erp` · `analytics` · `saas` · `enterprise` · `minimal` · `dashboard` · `ecommerce` |
| **Server-side data** | Data providers, request de-duplication, abort-on-change, adjustable latency and a simulated-failure switch for the error state |
| **Tree & grouping** | Nested rows, multi-level grouping, aggregates |
| **Inline editing** | Typed editors, validation, undo/redo |
| **Responsive & RTL** | Card/stacked layouts, priority columns, RTL, dark mode |
| **Benchmark** | Up to 1,000,000 rows with live FPS and render timings |
| **Headless** | The pipeline with none of the UI |

### Other commands

```bash
npm run build            # build the publishable package into dist/
npm run build:playground # build the playground into playground-dist/
npm run preview          # serve that production build
npm run test             # vitest + React Testing Library
npm run typecheck        # tsc --noEmit
npm run css              # regenerate the injected stylesheet after editing src/styles/grid.css
```

---

## 2. Use it in another project

Pick **one** of these three. All of them work today, with no npm publish.

### Option A — `npm pack` + install the tarball *(recommended: closest to the real thing)*

This installs exactly what npm users would get, so you catch packaging mistakes (missing files, broken `exports`) before publishing.

```bash
# 1. in this repo
cd "react-smart-grid"
npm run build
npm pack
#  → react-smart-table-grid-0.1.0.tgz
```

```bash
# 2. in your other project
npm install "C:/yogesh/New folder (3)/react-smart-grid/react-smart-table-grid-0.1.0.tgz"
```

Re-run `npm run build && npm pack` and re-install after each change.

> **Tip:** add `"react-smart-table-grid": "file:../react-smart-grid/react-smart-table-grid-0.1.0.tgz"` to your app's `package.json` so teammates get it too.

---

### Option B — `npm link` *(fastest edit loop across two projects)*

```bash
# 1. in this repo
cd "react-smart-grid"
npm run build
npm link
```

```bash
# 2. in your other project
npm link react-smart-table-grid
```

Then keep a rebuild running while you work:

```bash
# back in this repo
npx tsup --watch
```

**React "Invalid hook call" with `npm link`?** You now have two copies of React. Point your bundler at one:

```ts
// vite.config.ts in your app
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { react: resolve(__dirname, 'node_modules/react') },
  },
  optimizeDeps: { exclude: ['react-smart-table-grid'] },
});
```

```js
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias.react = require.resolve('react');
    config.resolve.alias['react-dom'] = require.resolve('react-dom');
    return config;
  },
};
```

Undo with `npm unlink react-smart-table-grid` in your app and `npm unlink -g react-smart-table-grid` here.

---

### Option C — `file:` dependency *(no build step, source-linked)*

```jsonc
// your app's package.json
{
  "dependencies": {
    "react-smart-table-grid": "file:../react-smart-grid"
  }
}
```

```bash
npm install
```

npm copies (or symlinks) the folder. You still need `npm run build` in this repo, because `package.json` points `exports` at `dist/`.

---

## 3. Wire it up in your app

### Vite + React

```tsx
// src/App.tsx
import { SmartDataGrid } from 'react-smart-table-grid';

const columns = [
  { accessorKey: 'name',   header: 'Name' },
  { accessorKey: 'email',  header: 'Email',  type: 'email' },
  { accessorKey: 'status', header: 'Status', type: 'status' },
  { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right' },
];

export default function App() {
  return (
    <SmartDataGrid
      data={users}
      columns={columns}
      getRowId="id"
      searchable
      filterable
      selectable
      resizable
      pagination={{ pageSize: 10 }}
    />
  );
}
```

Nothing else needed — the grid injects its own stylesheet on the client.

### Next.js — App Router

The grid is interactive, so it lives in a Client Component.

```tsx
// app/users/users-grid.tsx
'use client';

import { SmartDataGrid } from 'react-smart-table-grid';
import type { User } from './types';

export function UsersGrid({ users }: { users: User[] }) {
  return <SmartDataGrid data={users} columns={columns} getRowId="id" searchable pagination />;
}
```

```tsx
// app/users/page.tsx  — stays a Server Component
import { UsersGrid } from './users-grid';

export default async function Page() {
  const users = await db.users.findMany();
  return <UsersGrid users={users} />;
}
```

**For SSR, import the stylesheet instead of relying on runtime injection** — otherwise the server-rendered HTML paints unstyled for a frame:

```tsx
// app/layout.tsx
import 'react-smart-table-grid/styles.css';
```

```tsx
<SmartDataGrid injectStyles={false} … />
```

### Next.js — Pages Router

```tsx
// pages/_app.tsx
import 'react-smart-table-grid/styles.css';
```

```tsx
// pages/users.tsx
import dynamic from 'next/dynamic';

const SmartDataGrid = dynamic(
  () => import('react-smart-table-grid').then((m) => m.SmartDataGrid),
  { ssr: false },
);
```

`dynamic(..., { ssr: false })` is optional — the grid renders fine on the server. Use it if you want to keep the grid out of the server bundle entirely.

### Plain JavaScript (no TypeScript)

Everything works unchanged; you just lose autocomplete.

```jsx
import { SmartDataGrid } from 'react-smart-table-grid';

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'salary', header: 'Salary', type: 'currency' },
];

export const Table = ({ rows }) => <SmartDataGrid data={rows} columns={columns} searchable />;
```

---

## 4. Verify the install worked

Paste this into your app — it exercises theming, formatting and interaction in one screen:

```tsx
import { SmartDataGrid } from 'react-smart-table-grid';

const rows = [
  { id: 1, name: 'Ada Lovelace',  role: 'Engineer', status: 'active',   salary: 182000, score: 92 },
  { id: 2, name: 'Grace Hopper',  role: 'Director', status: 'pending',  salary: 210000, score: 78 },
  { id: 3, name: 'Alan Turing',   role: 'Lead',     status: 'inactive', salary: 165000, score: 64 },
];

export function SmokeTest() {
  return (
    <SmartDataGrid
      data={rows}
      columns={[
        { accessorKey: 'name',   header: 'Name' },
        { accessorKey: 'role',   header: 'Role' },
        { accessorKey: 'status', header: 'Status', type: 'status' },
        { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right', aggregate: 'sum' },
        { accessorKey: 'score',  header: 'Score',  type: 'progress' },
      ]}
      getRowId="id"
      theme="modern"
      searchable
      filterable
      selectable
      resizable
      exportable
      showFooter
      pagination={{ pageSize: 5 }}
    />
  );
}
```

You should see: a rounded card, an uppercase header, a search box and filter/columns/export buttons in the toolbar, coloured status pills, `$182,000.00`, a progress bar, checkboxes, and a summed footer.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Grid renders unstyled | Stylesheet blocked or `injectStyles={false}` without importing CSS | `import 'react-smart-table-grid/styles.css'` |
| "Invalid hook call" | Two copies of React (`npm link`) | Dedupe React — see [Option B](#option-b--npm-link-fastest-edit-loop-across-two-projects) |
| `Cannot find module 'react-smart-table-grid'` types | Package not built | `npm run build` in this repo |
| Nothing hot-reloads in the playground | Editing `dist/` instead of `src/` | Edit `src/` — the playground is aliased to it |
| CSS edits don't show up | The injected stylesheet is generated | `npm run css` (already part of `npm run dev`) |
| Flash of unstyled grid in Next.js | Runtime injection on an SSR page | Import the CSS in your layout + `injectStyles={false}` |
| Export downloads nothing | Called during SSR, or pop-up blocked for PDF/print | Trigger from a client event; allow pop-ups |
