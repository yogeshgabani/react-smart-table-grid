import * as React from 'react';
import { SmartDataGrid, type GridUIConfig } from 'react-smart-table-grid';
import { compactUserColumns, userColumns } from '../columns';
import { makeUsers, type User } from '../data';
import { useGridMode } from '../theme';
import { Callout, CodeBlock, Demo, Section, cx } from '../ui';

const users = makeUsers(24);

interface Recipe {
  name: string;
  note: string;
  swatch: [string, string];
  ui: GridUIConfig;
  /** Column ids frozen to each edge, for the frozen-columns recipe. */
  pinning?: { left: string[]; right: string[] };
}

/** Ready-made `ui` objects that show how far one object can move the design. */
const RECIPES: Recipe[] = [
  {
    name: 'Dark header',
    note: 'Header colour and height without touching a stylesheet. Hover a header cell and a row — both states are theme-driven.',
    swatch: ['#111827', '#DBEAFE'],
    ui: {
      header: {
        background: '#111827',
        color: '#FFFFFF',
        height: 52,
        textTransform: 'uppercase',
        // Header controls tint with the header's own text colour by default;
        // set this to take over explicitly.
        hoverBackground: 'rgba(255,255,255,0.12)',
      },
      row: { height: 56, hoverBackground: '#E8EEF7', selectedBackground: '#DBEAFE', selectedHoverBackground: '#BFDBFE' },
      cell: { padding: '12px 16px' },
      pagination: { variant: 'pill' },
    },
  },
  {
    name: 'Frozen columns',
    note: 'Name frozen left, Joined frozen right. Scroll sideways — the frozen columns stay put and cast a shadow over the content.',
    swatch: ['#0F172A', '#EEF2FF'],
    ui: {
      table: { minWidth: 1400, pinShadowSize: 12 },
      header: { background: '#0F172A', color: '#E2E8F0', height: 48 },
      row: { height: 52, hoverBackground: '#EEF2FF' },
      cell: { padding: '10px 16px' },
      pagination: { variant: 'outlined' },
    },
    pinning: { left: ['name'], right: ['joinedAt'] },
  },
  {
    name: 'Zebra, no borders',
    note: 'Striped rows carry the rhythm instead of border lines.',
    swatch: ['#F1F5F9', '#FFFFFF'],
    ui: {
      table: { variant: 'borderless', radius: 16 },
      header: { border: false, background: 'transparent' },
      row: { striped: true, border: false, height: 46 },
      pagination: { variant: 'simple' },
      search: { variant: 'minimal' },
    },
  },
  {
    name: 'Dense spreadsheet',
    note: 'Column borders, tight padding, square checkboxes.',
    swatch: ['#EFF3F8', '#94A3B8'],
    ui: {
      table: { variant: 'bordered' },
      header: { height: 32, fontSize: 11, background: '#EFF3F8' },
      row: { height: 28 },
      cell: { padding: '2px 8px', fontSize: 12 },
      checkbox: { variant: 'square', size: 'sm' },
      pagination: { variant: 'compact', size: 'xs' },
    },
  },
  {
    name: 'Soft cards',
    note: 'Rounded everything, pill controls, an accent bar on selected rows.',
    swatch: ['#6366F1', '#F5F6FF'],
    ui: {
      table: { radius: 20, shadow: '0 8px 30px rgba(99,102,241,.14)' },
      header: { background: '#F5F6FF', color: '#4B5563', height: 46, border: false },
      row: { height: 58, border: false, selectedAccent: '#6366F1', selectedBackground: '#EEF0FF' },
      search: { variant: 'pill' },
      pagination: { variant: 'pill' },
      checkbox: { variant: 'circle' },
      button: { radius: 999 },
    },
  },
];

function toLiteral(ui: GridUIConfig): string {
  return JSON.stringify(ui, null, 2)
    .replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')
    .replace(/"/g, "'");
}

export function UiPlayground(): React.JSX.Element {
  const mode = useGridMode();
  const [index, setIndex] = React.useState(0);
  const recipe = RECIPES[index];

  return (
    <>
      <div className="pg-recipes" role="radiogroup" aria-label="Design recipe">
        {RECIPES.map((entry, i) => (
          <button
            key={entry.name}
            type="button"
            role="radio"
            aria-checked={i === index}
            className={cx('pg-recipe', i === index && 'pg-recipe--active')}
            onClick={() => setIndex(i)}
          >
            <span className="pg-recipe-swatch" aria-hidden="true">
              <i style={{ background: entry.swatch[0] }} />
              <i style={{ background: entry.swatch[1] }} />
            </span>
            <b>{entry.name}</b>
          </button>
        ))}
      </div>

      <Demo
        icon="sliders"
        title={recipe.name}
        description={recipe.note}
        code={`<SmartDataGrid\n  data={users}\n  columns={columns}\n  ui={${toLiteral(recipe.ui).replace(/\n/g, '\n  ')}}\n/>`}
      >
        <SmartDataGrid<User>
          key={recipe.name}
          data={users}
          columns={recipe.pinning ? userColumns.map((column) => ({ ...column, pinned: undefined })) : compactUserColumns}
          getRowId="id"
          ui={recipe.ui}
          darkMode={mode}
          defaultState={recipe.pinning ? { columnPinning: recipe.pinning } : undefined}
          searchable
          filterable
          selectable
          resizable
          stickyHeader
          pagination={{ pageSize: 7 }}
          toolbar={{ search: true, filter: true, columns: true }}
        />
      </Demo>

      {mode === 'dark' && (
        <Callout title="These recipes hard-code light colours">
          A `ui` object wins over the theme, so the explicit hex values above stay light even in dark mode. Use a
          theme&apos;s <code>dark</code> block for colours that should flip.
        </Callout>
      )}

      <Section
        icon="code"
        title="Or just override CSS variables"
        description="Every token is a CSS custom property, so plain CSS, CSS modules, Tailwind or styled-components all work."
      >
        <CodeBlock
          language="css"
          title="grid.css"
          code={`.my-grid {
  --grid-primary: #7c3aed;
  --grid-header-background: #faf5ff;
  --grid-header-text: #5b21b6;
  --grid-row-hover: #faf5ff;
  --grid-radius: 14px;
  --grid-row-height: 56px;
}`}
        />
      </Section>
    </>
  );
}
