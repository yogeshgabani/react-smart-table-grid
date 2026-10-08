// @vitest-environment node
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SmartDataGrid } from '../src/index';
import type { ColumnDef } from '../src/types';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  salary: number;
}

const data: Row[] = [
  { id: '1', name: 'Ada', salary: 120000 },
  { id: '2', name: 'Grace', salary: 180000 },
];

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'salary', header: 'Salary', type: 'currency', aggregate: 'sum', cellOptions: { locale: 'en-US' } },
];

describe('server rendering', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders every feature without browser APIs or React warnings', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const html = renderToString(
      <SmartDataGrid
        data={data}
        columns={columns}
        getRowId="id"
        searchable
        filterable
        selectable
        resizable
        exportable
        expandable
        showFooter
        pagination={{ pageSize: 10 }}
        toolbar={{ density: true, fullscreen: true, settings: true }}
        rowActions={[{ id: 'view', label: 'View', onClick: () => {} }]}
      />,
    );

    expect(typeof window).toBe('undefined');
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    expect(html).toContain('role="grid"');
    expect(html).toContain('$300,000.00');
  });
});
