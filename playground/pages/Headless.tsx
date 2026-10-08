import * as React from 'react';
import { createInitialState, filterRows, resolveColumns, searchRows, sortRows } from 'react-smart-table-grid/headless';
import type { ColumnDef, SortingState } from 'react-smart-table-grid';
import { makeUsers, type User } from '../data';
import { Chip, Demo, Icon, cx } from '../ui';

const users = makeUsers(60);

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'salary', header: 'Salary' },
];

const CODE = `import {
  resolveColumns, searchRows, filterRows, sortRows, createInitialState,
} from 'react-smart-table-grid/headless';

const resolved = resolveColumns({ columns, state: createInitialState(), defaults });

const rows = sortRows(
  filterRows(
    searchRows({ rows: data, search: { query, columns: {} }, columns: resolved.all, mode: 'fuzzy' }),
    filters,
    resolved.byId,
  ),
  sorting,
  resolved.byId,
);

// …then render rows with any markup you like.`;

/**
 * The data engine with zero grid UI — the same functions `<SmartDataGrid>` uses
 * internally, driving completely custom markup.
 */
export function Headless(): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'salary', direction: 'desc' }]);

  const resolved = React.useMemo(
    () =>
      resolveColumns<User>({
        columns,
        state: createInitialState(),
        defaults: {
          sortable: true,
          filterable: true,
          resizable: false,
          reorderable: false,
          editable: false,
          searchable: true,
          hideable: true,
          pinnable: true,
        },
      }),
    [],
  );

  const { rows, total } = React.useMemo(() => {
    const searched = searchRows({
      rows: users,
      search: { query, columns: {} },
      columns: resolved.all,
      mode: 'fuzzy',
    });
    const filtered = filterRows(searched, [], resolved.byId);
    const sorted = sortRows(filtered, sorting, resolved.byId);
    return { rows: sorted.slice(0, 8), total: sorted.length };
  }, [query, sorting, resolved]);

  const sortBy = (id: string): void =>
    setSorting([
      {
        id,
        direction: sorting[0]?.id === id && sorting[0].direction === 'asc' ? 'desc' : 'asc',
      },
    ]);

  return (
    <Demo
      icon="code"
      title="A people list, no table in sight"
      description="Fuzzy search ranks the best matches first — try “engr” or “ada lv”."
      code={CODE}
      toolbar={
        <>
          <label className="pg-search-field">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fuzzy search…"
              aria-label="Fuzzy search"
            />
          </label>
          <span className="pg-toolbar-label">Sort</span>
          {resolved.all.map((column) => {
            const active = sorting[0]?.id === column.id;
            return (
              <button
                key={column.id}
                type="button"
                className={cx('pg-toggle-chip', active && 'pg-toggle-chip--on')}
                aria-pressed={active}
                onClick={() => sortBy(column.id)}
              >
                {String(column.header)}
                {active && <span aria-hidden="true">{sorting[0].direction === 'asc' ? '↑' : '↓'}</span>}
              </button>
            );
          })}
          <span className="pg-spacer" />
          <Chip>{total} matches</Chip>
        </>
      }
    >
      <ul className="pg-people">
        {rows.map((row) => (
          <li key={row.id} className="pg-person">
            <img src={row.avatar} alt="" width={40} height={40} />
            <span className="pg-person-text">
              <b>{row.name}</b>
              <small>
                {row.role} · {row.department}
              </small>
            </span>
            <Chip tone={row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'neutral'}>
              {row.status}
            </Chip>
            <span className="pg-person-salary">${row.salary.toLocaleString()}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="pg-empty">No one matches “{query}”.</li>}
      </ul>
    </Demo>
  );
}
