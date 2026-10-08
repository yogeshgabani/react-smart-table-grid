import * as React from 'react';
import { SmartDataGrid, type RowUpdatePayload } from 'react-smart-table-grid';
import { editableUserColumns } from '../columns';
import { makeUsers, type User } from '../data';
import { useGridMode } from '../theme';
import { Demo, EventLog, Icon, Kbd, describe, useEventLog } from '../ui';

const KEYS: Array<[React.ReactNode, string]> = [
  ['Double-click', 'or focus a cell and press Enter to edit'],
  [<Kbd key="enter">Enter</Kbd>, 'or blur commits the value'],
  [<Kbd key="tab">Tab</Kbd>, 'commits and moves to the next cell'],
  [<Kbd key="esc">Esc</Kbd>, 'cancels and restores the old value'],
  ['↶ ↷', 'in the toolbar undo and redo edits'],
];

export function Editable(): React.JSX.Element {
  const mode = useGridMode();
  const [rows, setRows] = React.useState<User[]>(() => makeUsers(25));
  const { entries, log, clear } = useEventLog();

  const handleUpdate = (payload: RowUpdatePayload<User>): void => {
    // Persist to your API here; the grid has already applied the change optimistically.
    setRows((current) => current.map((row) => (row.id === payload.rowId ? { ...row, ...payload.changes } : row)));
    log('onRowUpdate', `${payload.row.name} · ${payload.columnId} → ${describe(Object.values(payload.changes)[0])}`);
  };

  return (
    <>
      <Demo
        icon="pencil"
        title="Editable grid"
        description="Salary is validated between 30,000 and 500,000 — try typing 10."
        code={`const columns = [
  { accessorKey: 'name', header: 'Name', editable: true },
  {
    accessorKey: 'role',
    header: 'Role',
    editable: true,
    editor: 'select',
    editorOptions: [{ label: 'Engineer', value: 'Engineer' }, /* … */],
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    type: 'currency',
    editable: true,
    editor: 'number',
    validate: (value) => (value < 30000 ? 'Minimum is 30,000' : null),
  },
  { accessorKey: 'joinedAt', header: 'Joined', type: 'date', editable: true, editor: 'date' },
];

<SmartDataGrid data={rows} columns={columns} editable onRowUpdate={save} />`}
      >
        <SmartDataGrid<User>
          data={rows}
          columns={editableUserColumns}
          getRowId="id"
          darkMode={mode}
          editable
          searchable
          sortable
          selectable
          stickyHeader
          exportable={['csv', 'json']}
          onRowUpdate={handleUpdate}
          pagination={{ pageSize: 10 }}
          toolbar={{ title: 'Editable grid', search: true, columns: true, export: true }}
          height={540}
        />
      </Demo>

      <div className="pg-two-col">
        <EventLog title="Change log" entries={entries} onClear={clear} empty="No edits yet — double-click any cell." />
        <section className="pg-card">
          <header className="pg-card-head">
            <div className="pg-card-heading">
              <span className="pg-card-icon">
                <Icon name="keyboard" size={16} />
              </span>
              <div>
                <h2 className="pg-card-title">Keyboard</h2>
                <p className="pg-card-desc">Editing never needs the mouse.</p>
              </div>
            </div>
          </header>
          <ul className="pg-tips">
            {KEYS.map(([key, text], index) => (
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
