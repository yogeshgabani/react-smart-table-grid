import * as React from 'react';
import { SmartDataGrid, type ColumnDef } from 'react-smart-table-grid';
import { groupedUserColumns } from '../columns';
import { makeOrgTree, makeUsers, type TreeNodeRow, type User } from '../data';
import { useGridMode } from '../theme';
import { Button, Demo, Icon, cx } from '../ui';

const tree = makeOrgTree();
const users = makeUsers(150);

const treeColumns: ColumnDef<TreeNodeRow>[] = [
  { accessorKey: 'name', header: 'Name', width: 300 },
  { accessorKey: 'type', header: 'Type', type: 'badge', width: 150 },
  { accessorKey: 'headcount', header: 'Headcount', type: 'number', align: 'right', width: 130, aggregate: 'sum' },
  {
    accessorKey: 'budget',
    header: 'Budget',
    type: 'currency',
    align: 'right',
    width: 160,
    aggregate: 'sum',
    cellOptions: { decimals: 0, notation: 'compact' },
  },
];

const GROUPABLE = [
  { id: 'department', label: 'Department' },
  { id: 'status', label: 'Status' },
  { id: 'country', label: 'Country' },
];

export function TreeAndGrouping(): React.JSX.Element {
  const mode = useGridMode();
  const [grouping, setGrouping] = React.useState<string[]>(['department']);

  const toggle = (id: string): void =>
    setGrouping((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  return (
    <>
      <Demo
        icon="tree"
        title="Tree data"
        description="Nested rows through a `children` key. The expander lands in the first data column and each level indents."
        code={`<SmartDataGrid
  data={orgChart}
  columns={columns}
  getRowId="id"
  tree={{ childrenKey: 'children', indent: 20 }}
  showFooter
/>`}
      >
        <SmartDataGrid<TreeNodeRow>
          data={tree}
          columns={treeColumns}
          getRowId="id"
          darkMode={mode}
          tree={{ childrenKey: 'children', indent: 20 }}
          sortable
          searchable
          showFooter
          stickyHeader
          toolbar={{ search: true, columns: true }}
          height={460}
        />
      </Demo>

      <Demo
        icon="layers"
        title="Row grouping & aggregation"
        description="Group by one or more columns; click a group row to collapse it. Sums and averages sit under their own columns, per group and in the footer."
        code={`const columns = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'name',  header: 'Name' },
      { accessorKey: 'email', header: 'Email', type: 'email' },
    ],
  },
  {
    id: 'compensation',
    header: 'Compensation',
    columns: [
      { accessorKey: 'salary',      header: 'Salary',      type: 'currency', aggregate: 'sum' },
      { accessorKey: 'performance', header: 'Performance', type: 'progress', aggregate: 'avg' },
    ],
  },
];

<SmartDataGrid
  data={users}
  columns={columns}
  groupable
  state={{ grouping }}
  onStateChange={(next) => setGrouping(next.grouping)}
  showFooter
/>`}
        toolbar={
          <>
            <span className="pg-toolbar-label">Group by</span>
            {GROUPABLE.map((column) => {
              const position = grouping.indexOf(column.id);
              return (
                <button
                  key={column.id}
                  type="button"
                  className={cx('pg-toggle-chip', position !== -1 && 'pg-toggle-chip--on')}
                  aria-pressed={position !== -1}
                  onClick={() => toggle(column.id)}
                >
                  {position !== -1 ? <span className="pg-toggle-chip-order">{position + 1}</span> : <Icon name="layers" size={13} />}
                  {column.label}
                </button>
              );
            })}
            <Button size="sm" variant="ghost" icon="x" onClick={() => setGrouping([])} disabled={grouping.length === 0}>
              Clear
            </Button>
          </>
        }
      >
        <SmartDataGrid<User>
          data={users}
          columns={groupedUserColumns}
          getRowId="id"
          darkMode={mode}
          groupable
          state={{ grouping }}
          onStateChange={(next) => setGrouping(next.grouping)}
          sortable
          searchable
          showFooter
          stickyHeader
          pagination={{ pageSize: 50 }}
          toolbar={{ search: true, columns: true, export: true }}
          height={560}
        />
      </Demo>
    </>
  );
}
