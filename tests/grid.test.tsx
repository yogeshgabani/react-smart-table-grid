import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartDataGrid } from '../src/index';
import type { ColumnDef, GridApi, GridPlugin } from '../src/types';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  role: string;
  salary: number;
  status: string;
}

const data: Row[] = [
  { id: '1', name: 'Ada', role: 'Engineer', salary: 120000, status: 'active' },
  { id: '2', name: 'Grace', role: 'Director', salary: 180000, status: 'pending' },
  { id: '3', name: 'Alan', role: 'Lead', salary: 150000, status: 'inactive' },
];

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  // Pin the locale so grouping separators don't depend on the test machine.
  { accessorKey: 'salary', header: 'Salary', type: 'currency', align: 'right', cellOptions: { locale: 'en-US' } },
  { accessorKey: 'status', header: 'Status', type: 'status' },
];

/** First-cell text of every body row, ignoring the header and footer. */
function bodyRowNames(): string[] {
  const body = document.querySelector('tbody');
  if (!body) return [];
  return within(body as HTMLElement)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '');
}

describe('<SmartDataGrid>', () => {
  it('renders headers and rows', () => {
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(bodyRowNames()).toEqual(['Ada', 'Grace', 'Alan']);
  });

  it('formats built-in cell types', () => {
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" />);
    expect(screen.getByText('$120,000.00')).toBeInTheDocument();
  });

  it('sorts when a header is clicked and reports it', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" onSortChange={onSortChange} />);

    const header = screen.getByRole('columnheader', { name: /name/i });
    await user.click(header);

    expect(bodyRowNames()).toEqual(['Ada', 'Alan', 'Grace']);
    expect(onSortChange).toHaveBeenCalledWith([{ id: 'name', direction: 'asc' }]);
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(header);
    expect(bodyRowNames()).toEqual(['Grace', 'Alan', 'Ada']);
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('filters through the search box', async () => {
    const user = userEvent.setup();
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" searchable />);

    await user.type(screen.getByRole('searchbox'), 'grace');

    // Search is debounced, so wait for the pipeline to catch up.
    await waitFor(() => expect(screen.queryByText('Ada')).not.toBeInTheDocument());
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });

  it('selects rows and reports the selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByLabelText('Select row 1'));

    expect(onSelectionChange).toHaveBeenCalled();
    const calls = onSelectionChange.mock.calls;
    const [rows, ids] = calls[calls.length - 1];
    expect(ids).toEqual(['1']);
    expect(rows[0].name).toBe('Ada');
  });

  // Regression: the selection column used to land after any user-pinned column,
  // and the header rendered in definition order while the body rendered in
  // pin-sorted order — so headings sat above the wrong cells.
  it('puts the selection column first, even when a user column is pinned left', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={[{ accessorKey: 'name', header: 'Name', pinned: 'left' }, ...columns.slice(1)]}
        getRowId="id"
        selectable
      />,
    );

    const headerCells = within(document.querySelector('thead') as HTMLElement)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headerCells[1]).toBe('Name');

    const firstRow = within(document.querySelector('tbody') as HTMLElement).getAllByRole('row')[0];
    const cells = within(firstRow).getAllByRole('cell');
    expect(within(cells[0]).getByLabelText('Select row 1')).toBeInTheDocument();
    expect(cells[1]).toHaveTextContent('Ada');
  });

  it('keeps every heading above its own column when pinning reorders them', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        state={{ columnPinning: { left: ['status'], right: ['name'] } }}
      />,
    );

    const headers = within(document.querySelector('thead') as HTMLElement)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.trim());
    expect(headers).toEqual(['Status', 'Role', 'Salary', 'Name']);

    const firstRow = within(document.querySelector('tbody') as HTMLElement).getAllByRole('row')[0];
    const cells = within(firstRow).getAllByRole('cell').map((cell) => cell.textContent);
    expect(cells[0]).toBe('active');
    expect(cells[1]).toBe('Engineer');
    expect(cells[3]).toBe('Ada');
  });

  // Regression: only the header applied the sticky-pinned class; body cells
  // got the `left`/`right` offset style but stayed `position: static`, so the
  // offset had no effect and pinned columns scrolled away under a header that
  // stayed put.
  it('marks pinned body cells sticky, not just the header', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={[{ accessorKey: 'name', header: 'Name', pinned: 'left' }, ...columns.slice(1)]}
        getRowId="id"
      />,
    );

    const headerCell = within(document.querySelector('thead') as HTMLElement).getAllByRole('columnheader')[0];
    expect(headerCell.className).toContain('sdg-cell--pinned');

    const firstRow = within(document.querySelector('tbody') as HTMLElement).getAllByRole('row')[0];
    const bodyCell = within(firstRow).getAllByRole('cell')[0];
    expect(bodyCell.className).toContain('sdg-cell--pinned');
  });

  it('uses radios for single selection and allows only one', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        selectable="single"
        onSelectionChange={onSelectionChange}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    // No select-all control makes sense for single selection.
    expect(screen.queryByLabelText('Select all rows on this page')).not.toBeInTheDocument();

    await user.click(radios[0]);
    await user.click(radios[2]);

    const calls = onSelectionChange.mock.calls;
    expect(calls[calls.length - 1][1]).toEqual(['3']);
  });

  it('selects every row on the page from the header checkbox', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByLabelText('Select all rows on this page'));
    const calls = onSelectionChange.mock.calls;
    expect(calls[calls.length - 1][1]).toEqual(['1', '2', '3']);
  });

  it('paginates', async () => {
    const user = userEvent.setup();
    render(
      <SmartDataGrid data={data} columns={columns} getRowId="id" pagination={{ pageSize: 2 }} />,
    );

    expect(bodyRowNames()).toEqual(['Ada', 'Grace']);
    expect(screen.getByText(/Showing 1–2 of 3/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(bodyRowNames()).toEqual(['Alan']);
  });

  // Regression: the page-size control used to be a native <select>; it's now
  // a themed Popover-backed dropdown, so it must still change the page size.
  it('changes page size through the themed rows-per-page dropdown', async () => {
    const user = userEvent.setup();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        pagination={{ pageSize: 1, pageSizeOptions: [1, 2, 3] }}
      />,
    );

    expect(bodyRowNames()).toEqual(['Ada']);

    await user.click(screen.getByRole('button', { name: 'Rows per page' }));
    await user.click(screen.getByRole('option', { name: '2' }));

    expect(bodyRowNames()).toEqual(['Ada', 'Grace']);
  });

  // Regression: FilterPanel renders inside its own Popover (the Toolbar's
  // "Filter" button), and its Column/Operator/Value dropdowns are themed
  // Selects — also Popovers. Both used to listen for Escape independently,
  // so one Escape press closed the nested dropdown AND the whole filter
  // panel at once. Escape should now unwind one level at a time.
  it('closes a nested filter dropdown before the filter panel itself on Escape', async () => {
    const user = userEvent.setup();
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" filterable />);

    await user.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add condition/i }));
    await user.click(screen.getByRole('button', { name: 'Column' }));
    expect(screen.getByRole('listbox', { name: 'Column' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox', { name: 'Column' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it('navigates the themed dropdown with arrow keys, like a native select', async () => {
    const user = userEvent.setup();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        pagination={{ pageSize: 1, pageSizeOptions: [1, 2, 3] }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Rows per page' }));
    // Opening focuses the current value (1) so arrow keys work immediately.
    expect(screen.getByRole('option', { name: '1' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: '2' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: '3' })).toHaveFocus();

    // Wraps back to the first option instead of falling off the end.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: '1' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: '3' })).toHaveFocus();

    // Selecting the focused option still works via a real click.
    await user.click(screen.getByRole('option', { name: '3' }));
    expect(bodyRowNames()).toEqual(['Ada', 'Grace', 'Alan']);
  });

  it('shows an empty state', () => {
    render(<SmartDataGrid data={[]} columns={columns} getRowId="id" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('shows an error state with a retry', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(
      <SmartDataGrid
        data={[]}
        columns={columns}
        getRowId="id"
        error="Boom"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders a custom cell renderer', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ value, row }) => <b data-testid="custom">{`${row.name}:${String(value)}`}</b>,
          },
        ]}
        getRowId="id"
      />,
    );
    expect(screen.getAllByTestId('custom')[0]).toHaveTextContent('Ada:active');
  });

  it('computes footer aggregates', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'salary', header: 'Salary', aggregate: 'sum' },
        ]}
        getRowId="id"
        showFooter
      />,
    );
    // 120000 + 180000 + 150000
    expect(screen.getByText('450000')).toBeInTheDocument();
  });

  it('fires row click handlers', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" onRowClick={onRowClick} />);

    await user.click(screen.getByText('Ada'));
    expect(onRowClick).toHaveBeenCalledWith(data[0], expect.objectContaining({ rowId: '1', rowIndex: 0 }));
  });

  it('honours a controlled state prop', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        state={{ sorting: [{ id: 'salary', direction: 'desc' }] }}
      />,
    );
    expect(bodyRowNames()).toEqual(['Grace', 'Alan', 'Ada']);
  });

  it('hides columns via state', () => {
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        state={{ columnVisibility: { role: false } }}
      />,
    );
    expect(screen.queryByRole('columnheader', { name: /role/i })).not.toBeInTheDocument();
  });

  it('applies ui overrides as CSS variables', () => {
    const { container } = render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        ui={{ header: { background: 'rgb(1, 2, 3)', height: 61 }, row: { height: 71 } }}
      />,
    );
    const root = container.querySelector('.sdg-root') as HTMLElement;
    expect(root.style.getPropertyValue('--grid-header-background')).toBe('rgb(1, 2, 3)');
    expect(root.style.getPropertyValue('--grid-header-height')).toBe('61px');
    expect(root.style.getPropertyValue('--grid-row-height')).toBe('71px');
  });

  it('exposes the imperative API through onReady', () => {
    const onReady = vi.fn();
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" onReady={onReady} />);

    const api = onReady.mock.calls[0][0];
    expect(api.getRowCount()).toBe(3);
    expect(api.getAllRows()).toHaveLength(3);
    expect(api.getVisibleColumns().map((c: { id: string }) => c.id)).toEqual([
      'name',
      'role',
      'salary',
      'status',
    ]);
  });

  it('renders expanded content', async () => {
    const user = userEvent.setup();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        expandable
        renderExpanded={({ row }) => <div data-testid="detail">Detail for {row.name}</div>}
      />,
    );

    await user.click(screen.getAllByLabelText('Expand row')[0]);
    expect(screen.getByTestId('detail')).toHaveTextContent('Detail for Ada');
  });

  it('edits a cell and reports the update', async () => {
    const user = userEvent.setup();
    const onRowUpdate = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={[{ accessorKey: 'name', header: 'Name', editable: true }]}
        getRowId="id"
        editable
        onRowUpdate={onRowUpdate}
      />,
    );

    await user.dblClick(screen.getByText('Ada'));
    const input = screen.getByDisplayValue('Ada');
    await user.clear(input);
    await user.type(input, 'Ada L{Enter}');

    expect(onRowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ rowId: '1', columnId: 'name', changes: { name: 'Ada L' } }),
    );
  });

  it('blocks an edit that fails validation', async () => {
    const user = userEvent.setup();
    const onRowUpdate = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={[
          {
            accessorKey: 'name',
            header: 'Name',
            editable: true,
            validate: (value) => (String(value).length < 3 ? 'Too short' : null),
          },
        ]}
        getRowId="id"
        editable
        onRowUpdate={onRowUpdate}
      />,
    );

    await user.dblClick(screen.getByText('Ada'));
    const input = screen.getByDisplayValue('Ada');
    await user.clear(input);
    await user.type(input, 'Ab{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
    expect(onRowUpdate).not.toHaveBeenCalled();
  });

  it('renders card view when responsive="card"', () => {
    const { container } = render(
      <SmartDataGrid data={data} columns={columns} getRowId="id" responsive="card" />,
    );
    expect(container.querySelectorAll('.sdg-card')).toHaveLength(3);
  });

  it('marks up an accessible grid', () => {
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" aria-label="People" />);
    const grid = screen.getByRole('grid', { name: 'People' });
    expect(grid).toHaveAttribute('aria-rowcount', '3');
    expect(grid).toHaveAttribute('aria-colcount', '4');
  });

  it('collapses and reopens a group when its row is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SmartDataGrid data={data} columns={columns} getRowId="id" groupable defaultState={{ grouping: ['status'] }} />,
    );
    const firstGroup = (): Element => container.querySelectorAll('.sdg-group-row')[0];

    expect(screen.getByText('Ada')).toBeInTheDocument();
    await user.click(firstGroup());
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();
    expect(firstGroup().querySelector('button')).toHaveAttribute('aria-expanded', 'false');

    await user.click(firstGroup());
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('lines group aggregates up under their own columns, formatted', () => {
    const { container } = render(
      <SmartDataGrid
        data={data}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'salary', header: 'Salary', type: 'currency', aggregate: 'sum', cellOptions: { locale: 'en-US' } },
          { accessorKey: 'role', header: 'Role' },
        ]}
        getRowId="id"
        groupable
        defaultState={{ grouping: ['role'] }}
      />,
    );
    const cells = container.querySelector('.sdg-group-row')!.querySelectorAll('td');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('colspan', '1');
    expect(cells[1]).toHaveTextContent('$120,000.00');
    expect(cells[2]).toBeEmptyDOMElement();
  });

  it('never turns a javascript: URL from row data into a link', () => {
    render(
      <SmartDataGrid
        data={[
          { id: '1', site: 'javascript:alert(1)' },
          { id: '2', site: 'https://example.com' },
        ]}
        columns={[{ accessorKey: 'site', header: 'Site', type: 'link' }]}
        getRowId="id"
      />,
    );
    expect(screen.getByText('javascript:alert(1)').closest('a')).toBeNull();
    expect(screen.getByText('https://example.com').closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('skips unselectable rows when selecting every filtered row', () => {
    const onSelectionChange = vi.fn();
    let grid: GridApi<Row> | null = null;
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        selectable
        isRowSelectable={(row) => row.id !== '2'}
        onSelectionChange={onSelectionChange}
        onReady={(api) => {
          grid = api;
        }}
      />,
    );
    act(() => grid!.selectAll('filtered'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([data[0], data[2]], ['1', '3']);
  });

  it('keeps the injected stylesheet while any grid is still mounted', () => {
    const selector = 'style[data-react-smart-table-grid-styles]';
    const first = render(<SmartDataGrid data={data} columns={columns} getRowId="id" />);
    const second = render(<SmartDataGrid data={data} columns={columns} getRowId="id" />);

    first.unmount();
    expect(document.querySelector(selector)).not.toBeNull();
    second.unmount();
    expect(document.querySelector(selector)).toBeNull();
  });

  it('runs plugin initState, onStateChange and toolbar hooks', async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    const plugin: GridPlugin<Row> = {
      name: 'demo',
      initState: (state) => ({ ...state, sorting: [{ id: 'salary', direction: 'desc' }] }),
      onStateChange,
      toolbar: ({ grid }) => (
        <button type="button" onClick={() => grid.clearSorting()}>
          Plugin action
        </button>
      ),
    };
    render(<SmartDataGrid data={data} columns={columns} getRowId="id" plugins={[plugin]} />);

    expect(bodyRowNames()).toEqual(['Grace', 'Alan', 'Ada']);
    await user.click(screen.getByRole('button', { name: 'Plugin action' }));
    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ sorting: [] }), { key: 'sorting' });
    expect(bodyRowNames()).toEqual(['Ada', 'Grace', 'Alan']);
  });

  it('opens the date editor on the local calendar day and treats an untouched save as no edit', async () => {
    const user = userEvent.setup();
    const onRowUpdate = vi.fn();
    // Local midnight: the previous day in UTC for anyone east of Greenwich.
    const joined = new Date(2024, 0, 5).toISOString();
    render(
      <SmartDataGrid
        data={[{ id: '1', joined }]}
        columns={[
          { accessorKey: 'joined', header: 'Joined', type: 'date', editable: true, editor: 'date', cellOptions: { locale: 'en-US' } },
        ]}
        getRowId="id"
        editable
        onRowUpdate={onRowUpdate}
      />,
    );

    await user.dblClick(screen.getByText('Jan 5, 2024'));
    expect(screen.getByDisplayValue('2024-01-05')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onRowUpdate).not.toHaveBeenCalled();
  });

  it('builds the toolbar from feature flags plus what the toolbar object adds', () => {
    const { rerender } = render(
      <SmartDataGrid data={data} columns={columns} getRowId="id" searchable toolbar={{ refresh: true }} />,
    );
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /filter/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();

    rerender(<SmartDataGrid data={data} columns={columns} getRowId="id" toolbar />);
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('treats a loading slot object as styling, not as a loading flag', () => {
    const { container, rerender } = render(
      <SmartDataGrid data={data} columns={columns} getRowId="id" loading={{ variant: 'overlay' }} />,
    );
    expect(screen.getByRole('grid')).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.sdg-overlay')).toBeNull();

    rerender(<SmartDataGrid data={data} columns={columns} getRowId="id" loading />);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows icon-less row actions as a menu rather than bare initials', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(
      <SmartDataGrid
        data={data.slice(0, 1)}
        columns={columns}
        getRowId="id"
        rowActions={[
          { id: 'view', label: 'View', onClick: onView },
          { id: 'delete', label: 'Delete', danger: true, onClick: vi.fn() },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Row actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith(data[0], expect.objectContaining({ rowId: '1' }));
  });

  it('fires onAddRow — not onRefresh — from the toolbar button', async () => {
    const user = userEvent.setup();
    const onAddRow = vi.fn();
    const onRefresh = vi.fn();
    render(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        toolbar={{ addRow: true }}
        onAddRow={onAddRow}
        onRefresh={onRefresh}
      />,
    );
    await user.click(screen.getByRole('button', { name: /add row/i }));
    expect(onAddRow).toHaveBeenCalledTimes(1);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
