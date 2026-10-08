import { describe, expect, it } from 'vitest';
import {
  compareValues,
  createInitialState,
  evaluateOperator,
  filterRows,
  fuzzyScore,
  getPageTokens,
  highlightChunks,
  paginateRows,
  parseSorting,
  resolveColumns,
  runAggregate,
  searchRows,
  serializeSorting,
  sortRows,
  toggleSorting,
  buildTree,
  flattenTree,
  getByPath,
  toCsv,
  toExcelXml,
  createGridTheme,
  themeToCssVars,
  resolveTheme,
  buildGroupedRows,
  toDate,
  formatDate,
  safeHref,
} from '../src/index';
import { collapsedGroupKey } from '../src/core/rows';
import type { ColumnDef, FiltersState } from '../src/types';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  age: number;
  active: boolean;
  joined: string;
  profile: { city: string };
}

const rows: Row[] = [
  { id: '1', name: 'Ada', age: 36, active: true, joined: '2021-03-01', profile: { city: 'London' } },
  { id: '2', name: 'grace', age: 45, active: false, joined: '2019-07-15', profile: { city: 'Boston' } },
  { id: '3', name: 'Alan', age: 28, active: true, joined: '2023-01-20', profile: { city: 'Cambridge' } },
  { id: '4', name: 'Item 10', age: 51, active: false, joined: '2020-11-05', profile: { city: 'Oslo' } },
  { id: '5', name: 'Item 2', age: 28, active: true, joined: '2022-06-30', profile: { city: 'Paris' } },
];

const columnDefs: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
  { accessorKey: 'active', header: 'Active' },
  { accessorKey: 'joined', header: 'Joined' },
  { accessorKey: 'profile.city', header: 'City', id: 'city' },
];

const defaults = {
  sortable: true,
  filterable: true,
  resizable: false,
  reorderable: false,
  editable: false,
  searchable: true,
  hideable: true,
  pinnable: true,
};

function resolve() {
  return resolveColumns<Row>({ columns: columnDefs, state: createInitialState(), defaults });
}

/* ------------------------------------------------------------------ */

describe('accessors', () => {
  it('reads dot paths', () => {
    expect(getByPath(rows[0], 'profile.city')).toBe('London');
    expect(getByPath(rows[0], 'profile.missing.deep')).toBeUndefined();
  });

  it('resolves nested accessorKey into a column getter', () => {
    const { byId } = resolve();
    expect(byId.get('city')?.getValue(rows[1], 1)).toBe('Boston');
  });
});

describe('sorting', () => {
  it('compares numbers numerically and strings naturally', () => {
    expect(compareValues(9, 10)).toBeLessThan(0);
    expect(compareValues('Item 2', 'Item 10')).toBeLessThan(0);
  });

  it('sorts case-insensitively', () => {
    const { byId } = resolve();
    const sorted = sortRows(rows, [{ id: 'name', direction: 'asc' }], byId);
    expect(sorted.map((row) => row.name)).toEqual(['Ada', 'Alan', 'grace', 'Item 2', 'Item 10']);
  });

  it('applies multi-column rules in order', () => {
    const { byId } = resolve();
    const sorted = sortRows(
      rows,
      [
        { id: 'age', direction: 'asc' },
        { id: 'name', direction: 'desc' },
      ],
      byId,
    );
    expect(sorted.slice(0, 2).map((row) => row.name)).toEqual(['Item 2', 'Alan']);
  });

  it('cycles asc → desc → none', () => {
    let sorting = toggleSorting([], 'name', false);
    expect(sorting).toEqual([{ id: 'name', direction: 'asc' }]);
    sorting = toggleSorting(sorting, 'name', false);
    expect(sorting).toEqual([{ id: 'name', direction: 'desc' }]);
    sorting = toggleSorting(sorting, 'name', false);
    expect(sorting).toEqual([]);
  });

  it('round-trips through the URL format', () => {
    const sorting = [
      { id: 'name', direction: 'asc' as const },
      { id: 'age', direction: 'desc' as const },
    ];
    expect(serializeSorting(sorting)).toBe('name.asc,age.desc');
    expect(parseSorting('name.asc,age.desc')).toEqual(sorting);
  });

  it('keeps empty values last regardless of direction', () => {
    const { byId } = resolve();
    const withGaps: Row[] = [...rows, { ...rows[0], id: '6', name: '' }];
    const desc = sortRows(withGaps, [{ id: 'name', direction: 'desc' }], byId);
    expect(desc[desc.length - 1].name).toBe('');
  });
});

describe('search', () => {
  it('matches across every searchable column', () => {
    const { all } = resolve();
    const result = searchRows({ rows, search: { query: 'boston', columns: {} }, columns: all });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('grace');
  });

  it('scopes column search to that column', () => {
    const { all } = resolve();
    const result = searchRows({ rows, search: { query: '', columns: { name: 'ala' } }, columns: all });
    expect(result.map((row) => row.name)).toEqual(['Alan']);
  });

  it('scores fuzzy matches', () => {
    expect(fuzzyScore('Senior Engineer', 'sengr')).toBeGreaterThan(0);
    expect(fuzzyScore('Senior Engineer', 'zzz')).toBe(0);
  });

  it('splits highlight chunks', () => {
    const chunks = highlightChunks('Ada Lovelace', 'love');
    expect(chunks.filter((chunk) => chunk.match).map((chunk) => chunk.text)).toEqual(['Love']);
  });
});

describe('filtering', () => {
  it('evaluates every operator family', () => {
    expect(evaluateOperator('hello', { field: 'x', operator: 'contains', value: 'ELL' })).toBe(true);
    expect(evaluateOperator('hello', { field: 'x', operator: 'startsWith', value: 'he' })).toBe(true);
    expect(evaluateOperator('hello', { field: 'x', operator: 'endsWith', value: 'lo' })).toBe(true);
    expect(evaluateOperator(5, { field: 'x', operator: 'greaterThan', value: 3 })).toBe(true);
    expect(evaluateOperator(5, { field: 'x', operator: 'lessThanOrEqual', value: 5 })).toBe(true);
    expect(evaluateOperator(5, { field: 'x', operator: 'between', value: 1, value2: 10 })).toBe(true);
    expect(evaluateOperator('b', { field: 'x', operator: 'in', value: ['a', 'b'] })).toBe(true);
    expect(evaluateOperator('c', { field: 'x', operator: 'notIn', value: ['a', 'b'] })).toBe(true);
    expect(evaluateOperator('', { field: 'x', operator: 'isEmpty' })).toBe(true);
    expect(evaluateOperator('x', { field: 'x', operator: 'isNotEmpty' })).toBe(true);
  });

  it('treats a value-less condition as inactive', () => {
    expect(evaluateOperator('anything', { field: 'x', operator: 'equals', value: '' })).toBe(true);
  });

  it('treats a date-only filter value as the whole local day', () => {
    const lateThatDay = new Date(2024, 0, 5, 23, 30).toISOString();
    const nextMorning = new Date(2024, 0, 6, 0, 15).toISOString();
    const day = '2024-01-05';

    expect(evaluateOperator(lateThatDay, { field: 'x', operator: 'equals', value: day })).toBe(true);
    expect(evaluateOperator(nextMorning, { field: 'x', operator: 'equals', value: day })).toBe(false);
    expect(evaluateOperator(lateThatDay, { field: 'x', operator: 'greaterThan', value: day })).toBe(false);
    expect(evaluateOperator(nextMorning, { field: 'x', operator: 'greaterThan', value: day })).toBe(true);
    expect(evaluateOperator(lateThatDay, { field: 'x', operator: 'lessThanOrEqual', value: day })).toBe(true);
    expect(
      evaluateOperator(lateThatDay, { field: 'x', operator: 'between', value: '2024-01-01', value2: day }),
    ).toBe(true);
  });

  it('applies AND groups', () => {
    const { byId } = resolve();
    const filters: FiltersState = [
      {
        operator: 'AND',
        conditions: [
          { field: 'active', operator: 'equals', value: true },
          { field: 'age', operator: 'lessThan', value: 30 },
        ],
      },
    ];
    expect(filterRows(rows, filters, byId).map((row) => row.name)).toEqual(['Alan', 'Item 2']);
  });

  it('applies OR and NOT groups, including nesting', () => {
    const { byId } = resolve();
    const or: FiltersState = [
      {
        operator: 'OR',
        conditions: [
          { field: 'name', operator: 'equals', value: 'Ada' },
          { field: 'name', operator: 'equals', value: 'Alan' },
        ],
      },
    ];
    expect(filterRows(rows, or, byId)).toHaveLength(2);

    const nested: FiltersState = [
      {
        operator: 'AND',
        conditions: [
          { field: 'active', operator: 'equals', value: true },
          {
            operator: 'NOT',
            conditions: [{ field: 'name', operator: 'equals', value: 'Ada' }],
          },
        ],
      },
    ];
    expect(filterRows(rows, nested, byId).map((row) => row.name)).toEqual(['Alan', 'Item 2']);
  });
});

describe('pagination', () => {
  it('slices the requested page', () => {
    expect(paginateRows(rows, { pageIndex: 1, pageSize: 2 }).map((row) => row.id)).toEqual(['3', '4']);
  });

  it('builds page tokens with ellipses', () => {
    expect(getPageTokens(0, 3, 1)).toEqual([0, 1, 2]);
    const tokens = getPageTokens(10, 30, 1);
    expect(tokens[0]).toBe(0);
    expect(tokens).toContain('ellipsis');
    expect(tokens[tokens.length - 1]).toBe(29);
  });
});

describe('aggregation', () => {
  it('computes each built-in aggregate', () => {
    const values = [1, 2, 3, 4];
    expect(runAggregate('sum', values)).toBe(10);
    expect(runAggregate('avg', values)).toBe(2.5);
    expect(runAggregate('min', values)).toBe(1);
    expect(runAggregate('max', values)).toBe(4);
    expect(runAggregate('count', values)).toBe(4);
    expect(runAggregate('countDistinct', [1, 1, 2])).toBe(2);
  });
});

describe('grouping', () => {
  it('starts groups open and collapses one through its collapse key', () => {
    const { byId } = resolve();
    const build = (expanded: Set<string>) =>
      buildGroupedRows({
        rows,
        grouping: ['active'],
        columns: byId,
        aggregateColumnList: [],
        expanded,
        getRowId: (row) => row.id,
      });

    const open = build(new Set());
    const groups = open.filter((row) => row.kind === 'group');
    expect(groups).toHaveLength(2);
    expect(open).toHaveLength(2 + rows.length);

    const collapsed = build(new Set([collapsedGroupKey(groups[0].id)]));
    expect(collapsed.find((row) => row.id === groups[0].id)).toMatchObject({ expanded: false });
    expect(collapsed).toHaveLength(2 + rows.length - (groups[0] as { count: number }).count);
  });
});

describe('dates', () => {
  it('reads a date-only string as a local calendar day', () => {
    const date = toDate('2024-01-05');
    expect(date && [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2024, 0, 5, 0]);
    expect(formatDate('2024-01-05', { dateFormat: 'iso' })).toBe('2024-01-05');
  });
});

describe('tree data', () => {
  it('flattens only expanded branches', () => {
    const nested = [
      { id: 'a', children: [{ id: 'a1', children: [] }] },
      { id: 'b', children: [] },
    ];
    const tree = buildTree(nested, {}, (row) => String((row as { id: string }).id));

    expect(flattenTree(tree, new Set())).toHaveLength(2);
    expect(flattenTree(tree, new Set(['a']))).toHaveLength(3);
  });

  it('builds a tree from flat parent pointers', () => {
    const flat = [
      { id: 'a', parentId: null },
      { id: 'a1', parentId: 'a' },
      { id: 'a2', parentId: 'a' },
    ];
    const tree = buildTree(flat, { parentKey: 'parentId' }, (row) => String((row as { id: string }).id));
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
  });
});

describe('columns', () => {
  it('honours visibility, order and pinning from state', () => {
    const state = createInitialState({
      columnVisibility: { age: false },
      columnOrder: ['city', 'name', 'age', 'active', 'joined'],
      columnPinning: { left: ['city'], right: ['joined'] },
      columnSizing: { name: 300 },
    });
    const resolved = resolveColumns<Row>({ columns: columnDefs, state, defaults });

    expect(resolved.visible.map((column) => column.id)).toEqual(['city', 'name', 'active', 'joined']);
    expect(resolved.leftPinned.map((c) => c.id)).toEqual(['city']);
    expect(resolved.rightPinned.map((c) => c.id)).toEqual(['joined']);
    expect(resolved.byId.get('name')?.computedWidth).toBe(300);
  });

  it('flattens grouped headers into leaves', () => {
    const grouped: ColumnDef<Row>[] = [
      { id: 'group', header: 'Group', columns: [{ accessorKey: 'name' }, { accessorKey: 'age' }] },
    ];
    const resolved = resolveColumns<Row>({ columns: grouped, state: createInitialState(), defaults });
    expect(resolved.all.map((c) => c.id)).toEqual(['name', 'age']);
    expect(resolved.headerRows).toHaveLength(2);
    expect(resolved.headerRows[0][0].colSpan).toBe(2);
  });

  // Regression: the header used to be built from the definition tree while the
  // body used the pin-sorted order, so pinning shifted every heading by one.
  it('keeps the header in the same order as the body when columns are pinned', () => {
    const state = createInitialState({ columnPinning: { left: ['joined'], right: ['name'] } });
    const resolved = resolveColumns<Row>({ columns: columnDefs, state, defaults });

    expect(resolved.visible.map((column) => column.id)).toEqual([
      'joined',
      'age',
      'active',
      'city',
      'name',
    ]);
    expect(resolved.headerRows[0].map((node) => node.column.id)).toEqual(
      resolved.visible.map((column) => column.id),
    );
  });

  it('keeps a group contiguous when pinning only reorders within it', () => {
    const grouped: ColumnDef<Row>[] = [
      {
        id: 'group',
        header: 'Group',
        columns: [{ accessorKey: 'name' }, { accessorKey: 'age' }, { accessorKey: 'active' }],
      },
    ];
    const state = createInitialState({ columnPinning: { left: ['age'], right: [] } });
    const resolved = resolveColumns<Row>({ columns: grouped, state, defaults });

    expect(resolved.visible.map((c) => c.id)).toEqual(['age', 'name', 'active']);
    expect(resolved.headerRows[0].map((node) => node.colSpan)).toEqual([3]);
    expect(resolved.headerRows[1].map((node) => node.column.id)).toEqual(['age', 'name', 'active']);
  });

  it('splits a group header when pinning interleaves another group', () => {
    const grouped: ColumnDef<Row>[] = [
      { id: 'a', header: 'A', columns: [{ accessorKey: 'name' }, { accessorKey: 'age' }] },
      { id: 'b', header: 'B', columns: [{ accessorKey: 'active' }] },
    ];
    // `name` and `active` pin left, leaving `age` (also group A) behind them.
    const state = createInitialState({ columnPinning: { left: ['name', 'active'], right: [] } });
    const resolved = resolveColumns<Row>({ columns: grouped, state, defaults });

    expect(resolved.visible.map((c) => c.id)).toEqual(['name', 'active', 'age']);

    const groupRow = resolved.headerRows[0];
    expect(groupRow.map((node) => node.column.id)).toEqual(['a', 'b', 'a']);
    expect(groupRow.map((node) => node.colSpan)).toEqual([1, 1, 1]);
    // The leaf row still lines up with the body, one cell per visible column.
    expect(resolved.headerRows[1].map((node) => node.column.id)).toEqual(resolved.visible.map((c) => c.id));
  });

  it('sorts grid-generated columns to the edges', () => {
    const withSystem: ColumnDef<Row>[] = [
      { id: '__select__', pinned: 'left' },
      { accessorKey: 'name', pinned: 'left' },
      { accessorKey: 'age' },
      { id: '__actions__', pinned: 'right' },
    ];
    const resolved = resolveColumns<Row>({
      columns: withSystem,
      state: createInitialState(),
      defaults,
    });

    expect(resolved.visible.map((c) => c.id)).toEqual(['__select__', 'name', 'age', '__actions__']);
    expect(resolved.leftPinned[0].id).toBe('__select__');
    expect(resolved.leftPinned[0].pinnedOffset).toBe(0);
  });
});

describe('theme', () => {
  it('layers a preset under user overrides', () => {
    const theme = createGridTheme({ extends: 'modern', colors: { primary: '#ff0000' } });
    expect(theme.colors.primary).toBe('#ff0000');
    // still inherits modern's header height
    expect(theme.ui.header?.height).toBe(46);
  });

  it('lets `ui` beat the theme', () => {
    const theme = resolveTheme({
      theme: { header: { background: '#111111' } },
      ui: { header: { background: '#222222' } },
    });
    expect(theme.ui.header?.background).toBe('#222222');
    expect(themeToCssVars(theme)['--grid-header-background' as never]).toBe('#222222');
  });

  it('switches to the dark palette', () => {
    const theme = resolveTheme({ colorMode: 'dark' });
    expect(theme.mode).toBe('dark');
    expect(theme.colors.background).not.toBe('#FFFFFF');
  });

  it('drops a light preset’s surfaces in dark mode but keeps its brand colours', () => {
    const light = resolveTheme({ theme: 'modern' });
    const dark = resolveTheme({ theme: 'modern', colorMode: 'dark' });
    const plainDark = resolveTheme({ colorMode: 'dark' });

    expect(light.colors.headerBackground).toBe('#FFFFFF');
    expect(dark.colors.headerBackground).toBe(plainDark.colors.headerBackground);
    expect(dark.colors.headerText).toBe(plainDark.colors.headerText);
    expect(dark.colors.border).toBe(plainDark.colors.border);
    expect(dark.colors.primary).toBe(light.colors.primary);
  });

  it('keeps explicit colours that still read on a dark surface', () => {
    const theme = resolveTheme({
      theme: { colors: { headerBackground: '#111827', headerText: '#FFFFFF', rowHover: 'rgba(0,0,0,0.1)' } },
      colorMode: 'dark',
    });
    expect(theme.colors.headerBackground).toBe('#111827');
    expect(theme.colors.headerText).toBe('#FFFFFF');
    expect(theme.colors.rowHover).toBe('rgba(0,0,0,0.1)');
  });

  it('emits the documented CSS variables', () => {
    const vars = themeToCssVars(createGridTheme()) as unknown as Record<string, string>;
    for (const name of ['--grid-primary', '--grid-row-height', '--grid-header-height', '--grid-radius']) {
      expect(vars[name]).toBeTruthy();
    }
  });
});

describe('export', () => {
  it('escapes CSV and neutralises formulas', () => {
    const { visible } = resolve();
    const csv = toCsv({
      rows: [{ ...rows[0], name: '=SUM(A1)' }, { ...rows[1], name: 'a,b' }],
      columns: visible,
      options: { columns: ['name'] },
    });
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Name');
    expect(lines[1]).toBe("'=SUM(A1)");
    expect(lines[2]).toBe('"a,b"');
  });

  it('leaves negative numbers numeric while still guarding formulas', () => {
    const { visible } = resolve();
    const csv = toCsv({
      rows: [
        { ...rows[0], name: '-42' },
        { ...rows[1], name: '-1,234.50' },
        { ...rows[2], name: '-2+3' },
      ],
      columns: visible,
      options: { columns: ['name'], includeHeaders: false },
    });
    expect(csv.split('\r\n')).toEqual(['-42', '"-1,234.50"', "'-2+3"]);
  });

  it('only types genuine numbers as Excel numbers', () => {
    const { visible } = resolve();
    const xml = toExcelXml({
      rows: ['1,200', '0x1F', 'Infinity', ' '].map((name, index) => ({ ...rows[index], name })),
      columns: visible,
      options: { columns: ['name'], includeHeaders: false },
    });
    expect(xml).toContain('<Data ss:Type="Number">1200</Data>');
    expect(xml).toContain('<Data ss:Type="String">0x1F</Data>');
    expect(xml).toContain('<Data ss:Type="String">Infinity</Data>');
    expect(xml).toContain('<Data ss:Type="String"> </Data>');
  });
});

describe('safeHref', () => {
  it('lets web, mail, phone and relative links through', () => {
    for (const url of ['https://example.com', 'http://x.io/a?b=1', 'mailto:a@b.co', 'tel:+15550100', '/users/1', '#top', '?page=2']) {
      expect(safeHref(url)).toBe(url);
    }
  });

  it('blocks script and data URLs, however they are disguised', () => {
    for (const url of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:msgbox(1)']) {
      expect(safeHref(url)).toBeUndefined();
    }
  });
});
