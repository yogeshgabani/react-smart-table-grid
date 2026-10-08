import * as React from 'react';
import {
  SmartDataGrid,
  createGridTheme,
  themePresetNames,
  type CheckboxVariant,
  type GridThemeInput,
  type PaginationVariant,
  type SearchVariant,
  type ThemePreset,
} from 'react-smart-table-grid';
import { userColumns } from '../columns';
import { makeUsers } from '../data';
import {
  Button,
  CodeBlock,
  ColorInput,
  Field,
  Icon,
  PanelSection,
  Range,
  Section,
  Select,
  Switch,
  useCopy,
} from '../ui';

const users = makeUsers(14);

interface BuilderState {
  base: ThemePreset;
  primary: string;
  headerBackground: string;
  headerText: string;
  headerHover: string;
  rowBackground: string;
  rowHover: string;
  rowSelected: string;
  rowSelectedHover: string;
  pinShadow: string;
  pinShadowSize: number;
  border: string;
  text: string;
  muted: string;
  fontSize: number;
  headerFontWeight: number;
  radius: number;
  headerHeight: number;
  rowHeight: number;
  cellPaddingX: number;
  cellPaddingY: number;
  shadow: string;
  striped: boolean;
  rowBorder: boolean;
  columnBorder: boolean;
  outerBorder: boolean;
  uppercase: boolean;
  paginationVariant: PaginationVariant;
  searchVariant: SearchVariant;
  checkboxVariant: CheckboxVariant;
  dark: boolean;
}

const INITIAL: BuilderState = {
  base: 'modern',
  primary: '#2563EB',
  headerBackground: '#F8FAFC',
  headerText: '#334155',
  headerHover: '#E9EEF5',
  rowBackground: '#FFFFFF',
  rowHover: '#F1F5F9',
  rowSelected: '#EFF6FF',
  rowSelectedHover: '#DBEAFE',
  pinShadow: 'rgba(15,23,42,0.13)',
  pinShadowSize: 10,
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  fontSize: 14,
  headerFontWeight: 600,
  radius: 12,
  headerHeight: 48,
  rowHeight: 52,
  cellPaddingX: 16,
  cellPaddingY: 12,
  shadow: '0 1px 3px rgba(15,23,42,.06)',
  striped: false,
  rowBorder: true,
  columnBorder: false,
  outerBorder: true,
  uppercase: false,
  paginationVariant: 'pill',
  searchVariant: 'filled',
  checkboxVariant: 'rounded',
  dark: false,
};

/** Quick starting points — each only changes the colours. */
const SWATCHES: Array<{ name: string; colors: Partial<BuilderState> }> = [
  { name: 'Ocean', colors: { primary: '#2563EB', headerBackground: '#F8FAFC', headerText: '#334155', rowHover: '#F1F5F9', rowSelected: '#EFF6FF', rowSelectedHover: '#DBEAFE' } },
  { name: 'Grape', colors: { primary: '#7C3AED', headerBackground: '#FAF5FF', headerText: '#5B21B6', rowHover: '#FAF5FF', rowSelected: '#F3E8FF', rowSelectedHover: '#E9D5FF' } },
  { name: 'Forest', colors: { primary: '#059669', headerBackground: '#F0FDF4', headerText: '#065F46', rowHover: '#F0FDF4', rowSelected: '#DCFCE7', rowSelectedHover: '#BBF7D0' } },
  { name: 'Sunset', colors: { primary: '#EA580C', headerBackground: '#FFF7ED', headerText: '#9A3412', rowHover: '#FFF7ED', rowSelected: '#FFEDD5', rowSelectedHover: '#FED7AA' } },
  { name: 'Ink', colors: { primary: '#0F172A', headerBackground: '#0F172A', headerText: '#E2E8F0', headerHover: '#1E293B', rowHover: '#F1F5F9', rowSelected: '#E2E8F0', rowSelectedHover: '#CBD5E1' } },
];

function toThemeInput(builder: BuilderState): GridThemeInput {
  return {
    name: 'custom',
    extends: builder.base,
    colors: {
      primary: builder.primary,
      headerBackground: builder.headerBackground,
      headerText: builder.headerText,
      rowBackground: builder.rowBackground,
      rowHover: builder.rowHover,
      rowSelected: builder.rowSelected,
      rowSelectedHover: builder.rowSelectedHover,
      pinShadow: builder.pinShadow,
      border: builder.border,
      text: builder.text,
      textMuted: builder.muted,
    },
    typography: {
      fontSize: `${builder.fontSize}px`,
      headerFontWeight: builder.headerFontWeight,
    },
    radius: { container: `${builder.radius}px` },
    shadows: { container: builder.shadow },
    borders: {
      rowBorder: builder.rowBorder,
      columnBorder: builder.columnBorder,
      outerBorder: builder.outerBorder,
    },
    table: { pinShadowSize: builder.pinShadowSize },
    header: {
      height: builder.headerHeight,
      textTransform: builder.uppercase ? 'uppercase' : 'none',
      hoverBackground: builder.headerHover,
    },
    row: { height: builder.rowHeight, striped: builder.striped },
    cell: { padding: `${builder.cellPaddingY}px ${builder.cellPaddingX}px` },
    pagination: { variant: builder.paginationVariant },
    search: { variant: builder.searchVariant },
    checkbox: { variant: builder.checkboxVariant },
  };
}

function serialize(builder: BuilderState): string {
  const json = JSON.stringify(toThemeInput(builder), null, 2)
    // Turn JSON keys into JS identifiers so the snippet is paste-ready.
    .replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')
    .replace(/"/g, "'");
  return `import { createGridTheme } from 'react-smart-table-grid/theme';\n\nexport const myTheme = createGridTheme(${json});\n\n// <SmartDataGrid theme={myTheme} … />`;
}

const COLOR_FIELDS: Array<[keyof BuilderState, string]> = [
  ['primary', 'Primary'],
  ['headerBackground', 'Header background'],
  ['headerText', 'Header text'],
  ['headerHover', 'Header hover'],
  ['rowBackground', 'Row background'],
  ['rowHover', 'Row hover'],
  ['rowSelected', 'Row selected'],
  ['rowSelectedHover', 'Selected hover'],
  ['border', 'Border'],
  ['text', 'Text'],
  ['muted', 'Muted text'],
];

const SIZE_FIELDS: Array<[keyof BuilderState, string, number, number, string]> = [
  ['fontSize', 'Font size', 10, 20, 'px'],
  ['headerFontWeight', 'Header weight', 400, 800, ''],
  ['radius', 'Corner radius', 0, 28, 'px'],
  ['headerHeight', 'Header height', 28, 72, 'px'],
  ['rowHeight', 'Row height', 26, 80, 'px'],
  ['cellPaddingX', 'Cell padding X', 2, 32, 'px'],
  ['cellPaddingY', 'Cell padding Y', 0, 26, 'px'],
];

export function ThemeBuilder(): React.JSX.Element {
  const [builder, setBuilder] = React.useState<BuilderState>(INITIAL);
  const [copied, copy] = useCopy();

  // The real source of truth for pinning. It's still passed to the grid as
  // controlled `state`, but it also absorbs whatever the grid's own UI does
  // (Columns panel pin button, header "⋯" menu) via `onStateChange` below — a
  // value derived from the two switches would snap back on the next render.
  const [columnPinning, setColumnPinning] = React.useState<{ left: string[]; right: string[] }>({
    left: ['name'],
    right: [],
  });
  const freezeFirst = columnPinning.left.includes('name');
  const freezeLast = columnPinning.right.includes('lastActive');

  const set = <K extends keyof BuilderState>(key: K, value: BuilderState[K]): void =>
    setBuilder((previous) => ({ ...previous, [key]: value }));

  const toggleFreezeFirst = (checked: boolean): void =>
    setColumnPinning((previous) => ({
      ...previous,
      left: checked ? [...previous.left.filter((id) => id !== 'name'), 'name'] : previous.left.filter((id) => id !== 'name'),
    }));

  const toggleFreezeLast = (checked: boolean): void =>
    setColumnPinning((previous) => ({
      ...previous,
      right: checked
        ? ['lastActive', ...previous.right.filter((id) => id !== 'lastActive')]
        : previous.right.filter((id) => id !== 'lastActive'),
    }));

  // Rebuilding on every keystroke is the point — the preview must be instant.
  const theme = React.useMemo(() => createGridTheme(toThemeInput(builder)), [builder]);
  const code = React.useMemo(() => serialize(builder), [builder]);

  // Freezing is driven from state so the switches apply without a remount.
  const previewColumns = React.useMemo(() => userColumns.map((column) => ({ ...column, pinned: undefined })), []);

  return (
    <div className="pg-builder">
      <aside className="pg-live-panel pg-builder-panel" aria-label="Theme controls">
        <div className="pg-panel-head">
          <span>
            <Icon name="wand" size={16} /> Controls
          </span>
          <Button
            size="sm"
            variant="ghost"
            icon="reset"
            onClick={() => {
              setBuilder(INITIAL);
              setColumnPinning({ left: ['name'], right: [] });
            }}
          >
            Reset
          </Button>
        </div>

        <PanelSection title="Start from">
          <Field label="Base preset">
            <Select label="Base preset" value={builder.base} onChange={(value) => set('base', value as ThemePreset)} options={themePresetNames} />
          </Field>
          <div className="pg-swatches" role="group" aria-label="Colour palettes">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                className="pg-swatch"
                title={swatch.name}
                onClick={() => setBuilder((previous) => ({ ...previous, ...swatch.colors }))}
              >
                <span style={{ background: swatch.colors.primary }} />
                <span style={{ background: swatch.colors.headerBackground }} />
                <small>{swatch.name}</small>
              </button>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Colours">
          {COLOR_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              <ColorInput label={label} value={String(builder[key])} onChange={(value) => set(key, value as never)} />
            </Field>
          ))}
        </PanelSection>

        <PanelSection title="Frozen columns">
          <Switch label="Freeze first column" checked={freezeFirst} onChange={toggleFreezeFirst} />
          <Switch label="Freeze last column" checked={freezeLast} onChange={toggleFreezeLast} />
          <Field label="Shadow colour">
            <ColorInput label="Frozen shadow" value={builder.pinShadow} onChange={(value) => set('pinShadow', value)} />
          </Field>
          <Field label="Shadow size" stacked>
            <Range label="Shadow size" value={builder.pinShadowSize} min={0} max={28} onChange={(value) => set('pinShadowSize', value)} format={(value) => `${value}px`} />
          </Field>
        </PanelSection>

        <PanelSection title="Type & sizing">
          {SIZE_FIELDS.map(([key, label, min, max, unit]) => (
            <Field key={key} label={label} stacked>
              <Range
                label={label}
                value={Number(builder[key])}
                min={min}
                max={max}
                onChange={(value) => set(key, value as never)}
                format={(value) => `${value}${unit}`}
              />
            </Field>
          ))}
        </PanelSection>

        <PanelSection title="Borders & mode">
          <Switch label="Striped rows" checked={builder.striped} onChange={(value) => set('striped', value)} />
          <Switch label="Row borders" checked={builder.rowBorder} onChange={(value) => set('rowBorder', value)} />
          <Switch label="Column borders" checked={builder.columnBorder} onChange={(value) => set('columnBorder', value)} />
          <Switch label="Outer border" checked={builder.outerBorder} onChange={(value) => set('outerBorder', value)} />
          <Switch label="Uppercase header" checked={builder.uppercase} onChange={(value) => set('uppercase', value)} />
          <Switch label="Dark mode" description="Preview the dark palette" checked={builder.dark} onChange={(value) => set('dark', value)} />
        </PanelSection>

        <PanelSection title="Variants">
          <Field label="Pagination">
            <Select
              label="Pagination variant"
              value={builder.paginationVariant}
              onChange={(value) => set('paginationVariant', value)}
              options={['default', 'minimal', 'compact', 'pill', 'numbered', 'outlined', 'filled', 'simple'] as const}
            />
          </Field>
          <Field label="Search">
            <Select
              label="Search variant"
              value={builder.searchVariant}
              onChange={(value) => set('searchVariant', value)}
              options={['default', 'filled', 'outlined', 'rounded', 'pill', 'minimal'] as const}
            />
          </Field>
          <Field label="Checkbox">
            <Select
              label="Checkbox variant"
              value={builder.checkboxVariant}
              onChange={(value) => set('checkboxVariant', value)}
              options={['square', 'rounded', 'circle', 'switch'] as const}
            />
          </Field>
        </PanelSection>
      </aside>

      <div className="pg-builder-main">
        <section className="pg-card pg-demo">
          <header className="pg-card-head">
            <div className="pg-card-heading">
              <span className="pg-card-icon pg-card-icon--live">
                <span className="pg-live-dot" aria-hidden="true" />
              </span>
              <div>
                <h2 className="pg-card-title">Live preview</h2>
                <p className="pg-card-desc">Every change re-renders immediately.</p>
              </div>
            </div>
          </header>
          <div className="pg-canvas">
            <SmartDataGrid
              data={users}
              columns={previewColumns}
              getRowId="id"
              theme={theme}
              darkMode={builder.dark ? 'dark' : 'light'}
              state={{ columnPinning }}
              onStateChange={(state, meta) => {
                if (meta.key === 'columnPinning') setColumnPinning(state.columnPinning);
              }}
              searchable
              filterable
              selectable
              resizable
              reorderable
              stickyHeader
              showFooter
              exportable
              highlightSearch
              pagination={{ pageSize: 7 }}
              toolbar={{ title: 'Live preview', search: true, filter: true, columns: true, export: true, density: true }}
            />
          </div>
        </section>

        <Section
          icon="code"
          title="Generated theme"
          description="Paste this into your project and pass it as the `theme` prop."
          actions={
            <Button size="sm" variant="primary" icon={copied ? 'check' : 'copy'} onClick={() => copy(code)}>
              {copied ? 'Copied' : 'Copy theme'}
            </Button>
          }
        >
          <CodeBlock code={code} title="my-theme.ts" />
        </Section>
      </div>
    </div>
  );
}
