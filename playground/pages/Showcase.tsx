import * as React from 'react';
import { SmartDataGrid, type GridApi, type RowAction } from 'react-smart-table-grid';
import { userColumns } from '../columns';
import { makeUsers, type User } from '../data';
import { useGridMode } from '../theme';
import { Button, Demo, EventLog, Icon, Kbd, MOD_KEY, Stat, StatGrid, describe, useEventLog } from '../ui';

const users = makeUsers(240);

const CODE = `<SmartDataGrid
  data={users}
  columns={columns}
  getRowId="id"
  preset="admin"
  searchable filterable selectable resizable reorderable
  expandable groupable multiSort highlightSearch stickyHeader showFooter
  exportable={['csv', 'excel', 'json', 'print', 'clipboard']}
  rowActions={rowActions}
  bulkActions={bulkActions}
  toolbar={{ title: 'Team directory', refresh: true, density: true, fullscreen: true, settings: true }}
  pagination={{ pageSize: 12, pageSizeOptions: [12, 25, 50], showJumpToPage: true }}
  renderExpanded={({ row }) => <EmployeeDetails row={row} />}
  onSelectionChange={(rows) => setSelected(rows)}
/>`;

const TIPS: Array<[React.ReactNode, React.ReactNode]> = [
  [<Kbd key="k">Shift</Kbd>, 'click a second header to sort by more than one column'],
  ['Drag', 'a header to reorder columns, or its right edge to resize'],
  ['⋯', 'in a header opens pin, hide and group-by options'],
  [<Kbd key="k">{MOD_KEY} F</Kbd>, 'inside the grid jumps to its search box'],
  ['▸', 'on a row expands its detail panel'],
  ['Tick rows', 'to reveal the bulk-action bar'],
];

export function Showcase(): React.JSX.Element {
  const mode = useGridMode();
  const [selected, setSelected] = React.useState<User[]>([]);
  const [visibleCount, setVisibleCount] = React.useState(users.length);
  const gridRef = React.useRef<GridApi<User> | null>(null);
  const { entries, log, clear } = useEventLog();

  const rowActions = React.useMemo<RowAction<User>[]>(
    () => [
      { id: 'view', label: 'View', onClick: (row) => log('rowAction', `view · ${row.name}`) },
      { id: 'edit', label: 'Edit', onClick: (row) => log('rowAction', `edit · ${row.name}`) },
      { id: 'duplicate', label: 'Duplicate', onClick: (row) => log('rowAction', `duplicate · ${row.name}`) },
      { id: 'delete', label: 'Delete', danger: true, divider: true, onClick: (row) => log('rowAction', `delete · ${row.name}`) },
    ],
    [log],
  );

  // Read the filtered count after any state change so the stat tracks search and
  // filters — once on the next frame, and again after the 300ms search debounce.
  const syncCount = (): void => {
    const read = (): void => setVisibleCount(gridRef.current?.getRowCount() ?? users.length);
    window.requestAnimationFrame(read);
    window.setTimeout(read, 360);
  };

  return (
    <>
      <StatGrid>
        <Stat icon="table" value={users.length} label="rows in memory" />
        <Stat icon="search" tone="neutral" value={visibleCount} label="match search + filters" />
        <Stat icon="check" tone="success" value={selected.length} label="selected" />
        <Stat icon="activity" tone="warning" value={entries.length} label="events this session" />
      </StatGrid>

      <Demo
        icon="layers"
        title="Team directory"
        description="The admin preset with every interactive feature switched on."
        code={CODE}
        toolbar={
          <>
            <Button size="sm" icon="check" onClick={() => gridRef.current?.selectAll('filtered')}>
              Select all filtered
            </Button>
            <Button size="sm" icon="x" onClick={() => gridRef.current?.clearSelection()} disabled={selected.length === 0}>
              Clear selection
            </Button>
            <Button size="sm" icon="download" onClick={() => void gridRef.current?.exportData({ format: 'csv' })}>
              Export CSV
            </Button>
            <Button size="sm" icon="reset" variant="ghost" onClick={() => gridRef.current?.resetState()}>
              Reset state
            </Button>
          </>
        }
      >
        <SmartDataGrid<User>
          data={users}
          columns={userColumns}
          getRowId="id"
          preset="admin"
          darkMode={mode}
          searchable
          filterable
          selectable
          resizable
          reorderable
          expandable
          groupable
          multiSort
          highlightSearch
          stickyHeader
          showFooter
          exportable={['csv', 'excel', 'json', 'print', 'clipboard']}
          height={600}
          rowActions={rowActions}
          bulkActions={[
            { id: 'archive', label: 'Archive', onClick: (rows) => log('bulkAction', `archive · ${rows.length} rows`) },
            { id: 'delete', label: 'Delete', danger: true, onClick: (rows) => log('bulkAction', `delete · ${rows.length} rows`) },
          ]}
          toolbar={{
            title: 'Team directory',
            search: true,
            filter: true,
            columns: true,
            export: true,
            refresh: true,
            density: true,
            fullscreen: true,
            settings: true,
          }}
          pagination={{ pageSize: 12, pageSizeOptions: [12, 25, 50], showJumpToPage: true }}
          onSelectionChange={(rows) => {
            setSelected(rows);
            log('onSelectionChange', `${rows.length} selected`);
          }}
          onSortChange={(sorting) => log('onSortChange', describe(sorting))}
          onSearchChange={(query) => log('onSearchChange', query ? `“${query}”` : '(cleared)')}
          onFilterChange={(filters) =>
            log('onFilterChange', `${filters.reduce((sum, group) => sum + group.conditions.length, 0)} condition(s)`)
          }
          onPageChange={(page) => log('onPageChange', describe(page))}
          onExpandedChange={(expanded) => log('onExpandedChange', `${expanded.length} open`)}
          onRefresh={() => log('onRefresh')}
          onStateChange={syncCount}
          onReady={(api) => {
            gridRef.current = api;
          }}
          renderExpanded={({ row }) => (
            <div className="pg-detail-grid">
              <div>
                <h4>Contact</h4>
                <p>{row.email}</p>
                <p>{row.profile.phone}</p>
                <p>
                  {row.profile.city}, {row.country}
                </p>
              </div>
              <div>
                <h4>Employment</h4>
                <p>Manager · {row.profile.manager}</p>
                <p>Department · {row.department}</p>
                <p>Tags · {row.tags.join(', ')}</p>
              </div>
            </div>
          )}
        />
      </Demo>

      <div className="pg-two-col">
        <EventLog entries={entries} onClear={clear} />

        <section className="pg-card">
          <header className="pg-card-head">
            <div className="pg-card-heading">
              <span className="pg-card-icon">
                <Icon name="cursor" size={16} />
              </span>
              <div>
                <h2 className="pg-card-title">Things to try</h2>
                <p className="pg-card-desc">Each of these lands in the event log.</p>
              </div>
            </div>
          </header>
          <ul className="pg-tips">
            {TIPS.map(([key, text], index) => (
              <li key={index}>
                <span className="pg-tips-key">{key}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
