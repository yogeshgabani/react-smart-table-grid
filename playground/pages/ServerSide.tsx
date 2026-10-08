import * as React from 'react';
import { SmartDataGrid, createDataProvider, type DataProviderParams } from 'react-smart-table-grid';
import { compactUserColumns } from '../columns';
import { makeUsers, type User } from '../data';
import { useGridMode } from '../theme';
import { CodeBlock, Demo, EventLog, Field, Range, Section, Stat, StatGrid, Switch, describe, useEventLog } from '../ui';

/** A fake API that sorts, searches and pages on the "server". */
const database = makeUsers(5000);

function query(params: DataProviderParams): { rows: User[]; total: number } {
  let rows = database;

  if (params.search) {
    const needle = params.search.toLowerCase();
    rows = rows.filter((row) =>
      `${row.name} ${row.email} ${row.department} ${row.status}`.toLowerCase().includes(needle),
    );
  }

  for (const rule of [...params.sorting].reverse()) {
    const key = rule.id as keyof User;
    rows = rows.slice().sort((a, b) => {
      const av = a[key] as string | number;
      const bv = b[key] as string | number;
      const result = av > bv ? 1 : av < bv ? -1 : 0;
      return rule.direction === 'desc' ? -result : result;
    });
  }

  const start = (params.page - 1) * params.pageSize;
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length };
}

const PROVIDER_CODE = `const provider = createDataProvider({
  key: 'users',
  fetch: async ({ page, pageSize, search, sorting, filters, signal }) => {
    const res = await api.users.list({ page, pageSize, search, sorting, filters }, { signal });
    return { rows: res.data, total: res.total };
  },
});

<SmartDataGrid columns={columns} dataProvider={provider} searchable pagination={{ pageSize: 15 }} />`;

export function ServerSide(): React.JSX.Element {
  const mode = useGridMode();
  const [latency, setLatency] = React.useState(450);
  const [failing, setFailing] = React.useState(false);
  const [stats, setStats] = React.useState({ requests: 0, aborted: 0 });
  const { entries, log, clear } = useEventLog();

  // The provider is created once; it reads the live knobs through a ref.
  const knobs = React.useRef({ latency, failing });
  knobs.current = { latency, failing };

  const provider = React.useMemo(
    () =>
      createDataProvider<User>({
        key: 'fake-users',
        fetch: (params) =>
          new Promise((resolve, reject) => {
            setStats((previous) => ({ ...previous, requests: previous.requests + 1 }));
            log(
              'fetch',
              `page ${params.page} · ${params.pageSize}/page${params.search ? ` · “${params.search}”` : ''}${
                params.sorting.length ? ` · ${describe(params.sorting)}` : ''
              }`,
            );

            let settled = false;
            const timer = window.setTimeout(() => {
              settled = true;
              if (knobs.current.failing) {
                log('error', '503 Service Unavailable');
                reject(new Error('The server responded with 503. Try again in a moment.'));
                return;
              }
              const result = query(params);
              log('resolve', `${result.rows.length} rows of ${result.total.toLocaleString()}`);
              resolve(result);
            }, knobs.current.latency);

            // The grid aborts the previous request's signal on every new one,
            // finished or not — only an in-flight request counts as aborted.
            params.signal?.addEventListener('abort', () => {
              if (settled) return;
              settled = true;
              window.clearTimeout(timer);
              setStats((previous) => ({ ...previous, aborted: previous.aborted + 1 }));
              log('abort', 'superseded by a newer request');
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      }),
    [log],
  );

  return (
    <>
      <StatGrid>
        <Stat icon="server" value={database.length.toLocaleString()} label="rows on the “server”" />
        <Stat icon="activity" tone="success" value={stats.requests} label="requests issued" />
        <Stat icon="x" tone="warning" value={stats.aborted} label="aborted (superseded)" />
        <Stat icon="gauge" tone="neutral" value={`${latency} ms`} label="simulated latency" />
      </StatGrid>

      <Demo
        icon="server"
        title="Server-side pagination, sorting and search"
        description="Sorting or paging fires exactly one request; resizing and selection fire none. Type quickly in the search box to watch stale requests get aborted."
        code={PROVIDER_CODE}
        toolbar={
          <>
            <Field label="Latency">
              <Range label="Latency" value={latency} min={0} max={2000} step={50} onChange={setLatency} format={(value) => `${value} ms`} />
            </Field>
            <Switch label="Simulate failures" checked={failing} onChange={setFailing} />
          </>
        }
      >
        <SmartDataGrid<User>
          columns={compactUserColumns}
          getRowId="id"
          dataProvider={provider}
          darkMode={mode}
          searchable
          sortable
          stickyHeader
          exportable={['csv']}
          pagination={{ pageSize: 15, pageSizeOptions: [15, 30, 60] }}
          toolbar={{ search: true, columns: true, export: true, refresh: true }}
          height={560}
          loading={{ variant: 'overlay' }}
        />
      </Demo>

      <div className="pg-two-col">
        <EventLog title="Network" entries={entries} onClear={clear} empty="Requests will appear here." />
        <Section
          icon="globe"
          title="Or point at a URL"
          description="A declarative `dataSource` uses fetch() — or your own client — and maps any response shape."
        >
          <CodeBlock
            title="dataSource"
            code={`<SmartDataGrid
  columns={columns}
  dataSource={{
    url: '/api/users',
    method: 'GET',
    // rename params to match your API
    paramMap: { pageSize: 'limit', page: 'offset' },
    // map any response shape into { rows, total }
    transform: (res) => ({ rows: res.data, total: res.meta.total }),
  }}
  searchable
  sortable
  pagination={{ pageSize: 25 }}
/>`}
          />
        </Section>
      </div>
    </>
  );
}
