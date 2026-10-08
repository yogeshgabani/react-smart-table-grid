import * as React from 'react';
import {
  SmartDataGrid,
  themePresetNames,
  type CheckboxVariant,
  type ColumnDef,
  type Density,
  type GridRow,
  type GridUIConfig,
  type HeaderVariant,
  type PaginationVariant,
  type RowAction,
  type SearchVariant,
  type TableVariant,
  type ThemePreset,
  type ToolbarVariant,
} from 'react-smart-table-grid';
import { orderColumns, userColumns } from '../columns';
import { makeOrders, makeUsers } from '../data';
import { useGridMode } from '../theme';
import {
  Button,
  Chip,
  CodeBlock,
  EventLog,
  Field,
  Icon,
  PanelSection,
  Range,
  Segmented,
  Select,
  Switch,
  describe,
  useEventLog,
} from '../ui';

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

type Dataset = 'users' | 'orders';
type ColorChoice = 'page' | 'light' | 'dark';

interface LiveConfig {
  dataset: Dataset;
  rows: number;
  height: number;
  theme: string;
  density: Density;
  color: ColorChoice;
  dir: 'ltr' | 'rtl';
  selectable: 'none' | 'single' | 'multiple';
  pagination: boolean;
  pageSize: number;
  groupBy: string;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  multiSort: boolean;
  resizable: boolean;
  reorderable: boolean;
  expandable: boolean;
  editable: boolean;
  exportable: boolean;
  highlightSearch: boolean;
  stickyHeader: boolean;
  showFooter: boolean;
  rowActions: boolean;
  virtualized: boolean;
  striped: boolean;
  /** '' = whatever the theme says. */
  tableVariant: string;
  headerVariant: string;
  toolbarVariant: string;
  paginationVariant: string;
  searchVariant: string;
  checkboxVariant: string;
}

const DEFAULTS: LiveConfig = {
  dataset: 'users',
  rows: 120,
  height: 560,
  theme: 'modern',
  density: 'comfortable',
  color: 'page',
  dir: 'ltr',
  selectable: 'multiple',
  pagination: true,
  pageSize: 10,
  groupBy: '',
  searchable: true,
  filterable: true,
  sortable: true,
  multiSort: false,
  resizable: true,
  reorderable: true,
  expandable: false,
  editable: false,
  exportable: true,
  highlightSearch: true,
  stickyHeader: true,
  showFooter: true,
  rowActions: true,
  virtualized: false,
  striped: false,
  tableVariant: '',
  headerVariant: '',
  toolbarVariant: '',
  paginationVariant: '',
  searchVariant: '',
  checkboxVariant: '',
};

const STORAGE_KEY = 'sdg-playground:live';

/** Restore saved choices, keeping only keys whose type still matches. */
function loadConfig(): LiveConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as Array<keyof LiveConfig>) {
      if (typeof saved[key] === typeof DEFAULTS[key]) next[key] = saved[key];
    }
    return next as unknown as LiveConfig;
  } catch {
    return DEFAULTS;
  }
}

const GROUP_OPTIONS: Record<Dataset, Array<{ value: string; label: string }>> = {
  users: [
    { value: '', label: 'No grouping' },
    { value: 'department', label: 'Department' },
    { value: 'status', label: 'Status' },
    { value: 'country', label: 'Country' },
    { value: 'role', label: 'Role' },
  ],
  orders: [
    { value: '', label: 'No grouping' },
    { value: 'company', label: 'Company' },
    { value: 'channel', label: 'Channel' },
    { value: 'status', label: 'Status' },
  ],
};

const FEATURE_SWITCHES: Array<[keyof LiveConfig, string, string?]> = [
  ['searchable', 'Search', 'Global search box'],
  ['highlightSearch', 'Highlight matches'],
  ['filterable', 'Filters', 'AND / OR filter builder'],
  ['sortable', 'Sorting'],
  ['multiSort', 'Multi-sort', 'Shift-click headers'],
  ['resizable', 'Resize columns'],
  ['reorderable', 'Reorder columns', 'Drag headers'],
  ['expandable', 'Expandable rows'],
  ['editable', 'Inline editing', 'Double-click a cell'],
  ['rowActions', 'Row actions'],
  ['exportable', 'Export menu'],
  ['stickyHeader', 'Sticky header'],
  ['showFooter', 'Footer aggregates'],
  ['virtualized', 'Virtualize rows', 'Best with pagination off'],
];

const variantOptions = (values: string[]): Array<{ value: string; label: string }> => [
  { value: '', label: 'Theme default' },
  ...values.map((value) => ({ value, label: value })),
];

/* ------------------------------------------------------------------ *
 * Code generation
 * ------------------------------------------------------------------ */

function buildUi(config: LiveConfig): GridUIConfig | undefined {
  const ui: GridUIConfig = {};
  if (config.tableVariant) ui.table = { variant: config.tableVariant as TableVariant };
  if (config.headerVariant) ui.header = { variant: config.headerVariant as HeaderVariant };
  if (config.toolbarVariant) ui.toolbar = { variant: config.toolbarVariant as ToolbarVariant };
  if (config.searchVariant) ui.search = { variant: config.searchVariant as SearchVariant };
  if (config.paginationVariant) ui.pagination = { variant: config.paginationVariant as PaginationVariant };
  if (config.checkboxVariant) ui.checkbox = { variant: config.checkboxVariant as CheckboxVariant };
  if (config.striped) ui.row = { striped: true };
  return Object.keys(ui).length ? ui : undefined;
}

/** A JS object literal — short ones stay on one line. */
function literal(value: unknown, indent: string): string {
  if (typeof value === 'string') return `'${value}'`;
  if (value === null || typeof value !== 'object') return String(value);
  const entries = Object.entries(value).map(([key, entry]) => `${key}: ${literal(entry, `${indent}  `)}`);
  const inline = `{ ${entries.join(', ')} }`;
  if (inline.length <= 56) return inline;
  return `{\n${entries.map((entry) => `${indent}  ${entry}`).join(',\n')},\n${indent}}`;
}

function generateCode(config: LiveConfig): string {
  const props: string[] = [`data={${config.dataset}}`, 'columns={columns}', 'getRowId="id"'];

  if (config.theme !== 'default') props.push(`theme="${config.theme}"`);
  if (config.density !== 'comfortable') props.push(`density="${config.density}"`);
  if (config.color !== 'page') props.push(`darkMode="${config.color}"`);
  if (config.dir === 'rtl') props.push('dir="rtl"');

  if (config.selectable === 'multiple') props.push('selectable');
  if (config.selectable === 'single') props.push('selectable="single"');

  const flags: Array<keyof LiveConfig> = [
    'searchable',
    'highlightSearch',
    'filterable',
    'multiSort',
    'resizable',
    'reorderable',
    'exportable',
    'stickyHeader',
    'showFooter',
    'virtualized',
  ];
  for (const flag of flags) if (config[flag]) props.push(flag);
  if (!config.sortable) props.push('sortable={false}');

  if (config.pagination) props.push(`pagination={{ pageSize: ${config.pageSize} }}`);
  if (config.groupBy) props.push('groupable', `defaultState={{ grouping: ['${config.groupBy}'] }}`);
  if (config.rowActions) props.push('rowActions={rowActions}');
  if (config.expandable) props.push('expandable', 'renderExpanded={({ row }) => <RowDetails row={row} />}');
  if (config.editable) props.push('editable', 'onRowUpdate={(update) => api.save(update)}');

  const ui = buildUi(config);
  if (ui) props.push(`ui={${literal(ui, '  ')}}`);
  props.push(`height={${config.height}}`);

  return `import { SmartDataGrid } from 'react-smart-table-grid';\n\n<SmartDataGrid\n${props.map((prop) => `  ${prop}`).join('\n')}\n/>`;
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

function rowLabel(row: GridRow): string {
  return String(row.name ?? row.orderNo ?? row.id);
}

export function LivePlayground(): React.JSX.Element {
  const pageMode = useGridMode();
  const [config, setConfig] = React.useState<LiveConfig>(loadConfig);
  const { entries, log, clear } = useEventLog();

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* fine — the playground just won't remember */
    }
  }, [config]);

  const set = <K extends keyof LiveConfig>(key: K, value: LiveConfig[K]): void =>
    setConfig((previous) => ({ ...previous, [key]: value }));

  const data = React.useMemo<GridRow[]>(
    () => (config.dataset === 'users' ? makeUsers(config.rows) : makeOrders(config.rows)),
    [config.dataset, config.rows],
  );

  const columns = React.useMemo(
    () => (config.dataset === 'users' ? userColumns : orderColumns) as unknown as ColumnDef<GridRow>[],
    [config.dataset],
  );

  const rowActions = React.useMemo<RowAction<GridRow>[]>(
    () => [
      { id: 'view', label: 'View', onClick: (row) => log('rowAction', `view · ${rowLabel(row)}`) },
      { id: 'edit', label: 'Edit', onClick: (row) => log('rowAction', `edit · ${rowLabel(row)}`) },
      {
        id: 'delete',
        label: 'Delete',
        danger: true,
        divider: true,
        onClick: (row) => log('rowAction', `delete · ${rowLabel(row)}`),
      },
    ],
    [log],
  );

  const ui = React.useMemo(() => buildUi(config), [config]);
  const code = React.useMemo(() => generateCode(config), [config]);

  // Initial-state props only apply on mount, so changing them remounts the grid.
  const gridKey = [config.dataset, config.rows, config.pagination, config.pageSize, config.groupBy].join('|');
  const enabled = FEATURE_SWITCHES.filter(([key]) => config[key]).length;

  return (
    <div className="pg-live">
      <div className="pg-live-main">
        <section className="pg-card pg-demo">
          <header className="pg-card-head">
            <div className="pg-card-heading">
              <span className="pg-card-icon pg-card-icon--live">
                <span className="pg-live-dot" aria-hidden="true" />
              </span>
              <div>
                <h2 className="pg-card-title">Live preview</h2>
                <p className="pg-card-desc">
                  {config.rows.toLocaleString()} {config.dataset} · theme “{config.theme}” · {enabled} features on
                </p>
              </div>
            </div>
            <div className="pg-card-actions">
              <Chip tone="success">auto-updates</Chip>
            </div>
          </header>
          <div className="pg-canvas">
            <SmartDataGrid<GridRow>
              key={gridKey}
              data={data}
              columns={columns}
              getRowId="id"
              theme={config.theme as ThemePreset}
              density={config.density}
              darkMode={config.color === 'page' ? pageMode : config.color}
              dir={config.dir}
              selectable={config.selectable}
              searchable={config.searchable}
              highlightSearch={config.highlightSearch}
              filterable={config.filterable}
              sortable={config.sortable}
              multiSort={config.multiSort}
              resizable={config.resizable}
              reorderable={config.reorderable}
              expandable={config.expandable}
              editable={config.editable}
              exportable={config.exportable}
              stickyHeader={config.stickyHeader}
              showFooter={config.showFooter}
              virtualized={config.virtualized ? { threshold: 30 } : false}
              groupable={Boolean(config.groupBy)}
              defaultState={config.groupBy ? { grouping: [config.groupBy] } : undefined}
              pagination={config.pagination ? { pageSize: config.pageSize, pageSizeOptions: [5, 10, 25, 50, 100] } : false}
              rowActions={config.rowActions ? rowActions : undefined}
              ui={ui}
              height={config.height}
              toolbar={{
                title: config.dataset === 'users' ? 'Team directory' : 'Orders',
                search: config.searchable,
                filter: config.filterable,
                columns: true,
                export: config.exportable,
                density: true,
                fullscreen: true,
              }}
              renderExpanded={({ row }) => (
                <dl className="pg-details">
                  {Object.entries(row)
                    .filter(([, value]) => typeof value !== 'object' && !String(value).startsWith('data:'))
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                </dl>
              )}
              onSortChange={(sorting) => log('onSortChange', describe(sorting))}
              onSearchChange={(query) => log('onSearchChange', query ? `“${query}”` : '(cleared)')}
              onFilterChange={(filters) =>
                log('onFilterChange', `${filters.reduce((sum, group) => sum + group.conditions.length, 0)} condition(s)`)
              }
              onPageChange={(page) => log('onPageChange', describe(page))}
              onSelectionChange={(rows) => log('onSelectionChange', `${rows.length} selected`)}
              onColumnOrderChange={(order) => log('onColumnOrderChange', describe(order))}
              onColumnVisibilityChange={(visibility) =>
                log('onColumnVisibilityChange', `${Object.values(visibility).filter((visible) => !visible).length} hidden`)
              }
              onExpandedChange={(expanded) => log('onExpandedChange', `${expanded.length} open`)}
              onRowUpdate={(update) => log('onRowUpdate', `${update.columnId} → ${describe(Object.values(update.changes)[0])}`)}
              onExport={(options) => log('onExport', String(options.format ?? 'csv'))}
            />
          </div>
        </section>

        <div className="pg-live-bottom">
          <section className="pg-card">
            <header className="pg-card-head">
              <div className="pg-card-heading">
                <span className="pg-card-icon">
                  <Icon name="code" size={16} />
                </span>
                <div>
                  <h2 className="pg-card-title">Generated code</h2>
                  <p className="pg-card-desc">Only the props you changed from the defaults.</p>
                </div>
              </div>
            </header>
            <div className="pg-card-body">
              <CodeBlock code={code} title="UsersTable.tsx" />
            </div>
          </section>

          <EventLog entries={entries} onClear={clear} />
        </div>
      </div>

      <aside className="pg-live-panel" aria-label="Grid props">
        <div className="pg-panel-head">
          <span>
            <Icon name="sliders" size={16} /> Props
          </span>
          <Button size="sm" variant="ghost" icon="reset" onClick={() => setConfig(DEFAULTS)}>
            Reset
          </Button>
        </div>

        <PanelSection title="Data">
          <Segmented<Dataset>
            label="Dataset"
            stretch
            value={config.dataset}
            onChange={(value) => setConfig((previous) => ({ ...previous, dataset: value, groupBy: '' }))}
            options={[
              { value: 'users', label: 'Users' },
              { value: 'orders', label: 'Orders' },
            ]}
          />
          <Field label="Rows" stacked>
            <Range label="Rows" value={config.rows} min={10} max={5000} step={10} onChange={(value) => set('rows', value)} format={(value) => value.toLocaleString()} />
          </Field>
          <Field label="Height" stacked>
            <Range label="Height" value={config.height} min={320} max={860} step={20} onChange={(value) => set('height', value)} format={(value) => `${value}px`} />
          </Field>
          <Field label="Group by">
            <Select label="Group by" value={config.groupBy} onChange={(value) => set('groupBy', value)} options={GROUP_OPTIONS[config.dataset]} />
          </Field>
        </PanelSection>

        <PanelSection title="Selection & paging">
          <Segmented
            label="Selection"
            stretch
            value={config.selectable}
            onChange={(value) => set('selectable', value)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'single', label: 'Single' },
              { value: 'multiple', label: 'Multiple' },
            ]}
          />
          <Switch label="Pagination" checked={config.pagination} onChange={(value) => set('pagination', value)} />
          {config.pagination && (
            <Field label="Page size">
              <Select
                label="Page size"
                value={String(config.pageSize)}
                onChange={(value) => set('pageSize', Number(value))}
                options={['5', '10', '25', '50', '100']}
              />
            </Field>
          )}
        </PanelSection>

        <PanelSection title="Features">
          {FEATURE_SWITCHES.map(([key, label, description]) => (
            <Switch
              key={key}
              label={label}
              description={description}
              checked={Boolean(config[key])}
              onChange={(value) => set(key, value as never)}
            />
          ))}
        </PanelSection>

        <PanelSection title="Appearance">
          <Field label="Theme">
            <Select label="Theme" value={config.theme} onChange={(value) => set('theme', value)} options={themePresetNames} />
          </Field>
          <Field label="Density" stacked>
            <Segmented<Density>
              label="Density"
              stretch
              value={config.density}
              onChange={(value) => set('density', value)}
              options={[
                { value: 'dense', label: 'Dense' },
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfy' },
                { value: 'spacious', label: 'Roomy' },
              ]}
            />
          </Field>
          <Field label="Colour scheme" stacked>
            <Segmented<ColorChoice>
              label="Colour scheme"
              stretch
              value={config.color}
              onChange={(value) => set('color', value)}
              options={[
                { value: 'page', label: 'Page', icon: 'monitor' },
                { value: 'light', label: 'Light', icon: 'sun' },
                { value: 'dark', label: 'Dark', icon: 'moon' },
              ]}
            />
          </Field>
          <Field label="Direction" stacked>
            <Segmented
              label="Direction"
              stretch
              value={config.dir}
              onChange={(value) => set('dir', value)}
              options={[
                { value: 'ltr', label: 'Left to right' },
                { value: 'rtl', label: 'Right to left' },
              ]}
            />
          </Field>
        </PanelSection>

        <PanelSection title="UI slots" defaultOpen={false}>
          <Field label="Table">
            <Select label="Table variant" value={config.tableVariant} onChange={(value) => set('tableVariant', value)} options={variantOptions(['minimal', 'bordered', 'borderless', 'striped', 'compact', 'comfortable', 'dense', 'card'])} />
          </Field>
          <Field label="Header">
            <Select label="Header variant" value={config.headerVariant} onChange={(value) => set('headerVariant', value)} options={variantOptions(['filled', 'gradient', 'transparent', 'floating'])} />
          </Field>
          <Field label="Toolbar">
            <Select label="Toolbar variant" value={config.toolbarVariant} onChange={(value) => set('toolbarVariant', value)} options={variantOptions(['filled', 'minimal', 'floating', 'bordered'])} />
          </Field>
          <Field label="Search">
            <Select label="Search variant" value={config.searchVariant} onChange={(value) => set('searchVariant', value)} options={variantOptions(['filled', 'outlined', 'rounded', 'pill', 'minimal'])} />
          </Field>
          <Field label="Pagination">
            <Select label="Pagination variant" value={config.paginationVariant} onChange={(value) => set('paginationVariant', value)} options={variantOptions(['minimal', 'compact', 'pill', 'numbered', 'outlined', 'filled', 'simple'])} />
          </Field>
          <Field label="Checkbox">
            <Select label="Checkbox variant" value={config.checkboxVariant} onChange={(value) => set('checkboxVariant', value)} options={variantOptions(['square', 'rounded', 'circle', 'switch'])} />
          </Field>
          <Switch label="Striped rows" checked={config.striped} onChange={(value) => set('striped', value)} />
        </PanelSection>
      </aside>
    </div>
  );
}
