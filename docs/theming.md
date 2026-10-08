# Theming

## The resolution order

```text
component props        highest — e.g. density="compact", stickyHeader
      ↓
ui overrides           the `ui` prop
      ↓
custom theme           createGridTheme({ … })
      ↓
preset theme           theme="modern"
      ↓
default theme          lowest
```

Each layer only needs to state what it changes; everything else falls through.

---

## Level 1 — a preset

```tsx
<SmartDataGrid theme="modern" />
```

| Preset | Character |
| --- | --- |
| `default` | Neutral slate, balanced density |
| `modern` | Indigo, uppercase headers, pill pagination, soft shadow |
| `minimal` | No outer border, no shadow, transparent header |
| `compact` / `comfortable` | Density-first variants |
| `enterprise` | IBM-ish blue, square corners, column borders |
| `material` | Material 3 purple, Roboto, 16px radius |
| `glass` | Translucent surfaces with backdrop blur |
| `soft` | Pastel indigo, borderless striped rows, circle checkboxes |
| `dark` | Dark palette |
| `high-contrast` | WCAG-max contrast, 2px borders, black/white |
| `rounded` / `sharp` | Radius extremes |
| `borderless` | No lines at all — stripes carry the rhythm |
| `dense` | 30px rows, 12px type |
| `luxury` | Serif, gold on near-black header |
| `dashboard` | Sky blue, compact, minimal pagination |
| `crm` | Purple, hover row actions |
| `hrms` | Teal, roomy |
| `erp` | Bordered spreadsheet feel, 36px rows |
| `saas` | Monochrome, simple pagination |
| `analytics` | Dark header, mono numerics, striped |

Use `theme="system"` to follow `prefers-color-scheme`.

---

## Level 2 — a custom theme

```tsx
import { createGridTheme } from 'react-smart-table-grid/theme';

export const myTheme = createGridTheme({
  extends: 'modern',        // start from a preset

  colors: {
    primary: '#2563EB',
    headerBackground: '#0F172A',
    headerText: '#E2E8F0',
    rowHover: '#F8FAFC',
    rowSelected: '#EFF6FF',
    border: '#E2E8F0',
  },

  typography: { fontSize: '14px', headerFontWeight: 600 },
  spacing:    { cellPaddingX: '16px', cellPaddingY: '12px' },
  radius:     { container: '14px', md: '8px' },
  shadows:    { container: '0 1px 3px rgba(15,23,42,.06)' },
  borders:    { rowBorder: true, columnBorder: false, outerBorder: true },
  sizing:     { headerHeight: 48, rowHeight: 56 },
  motion:     { enabled: true, duration: '160ms' },

  // slot defaults live at the top level, same shape as the `ui` prop
  header:     { textTransform: 'uppercase', sticky: true },
  row:        { striped: false, selectedAccent: true },
  pagination: { variant: 'pill' },
  search:     { variant: 'filled' },
  checkbox:   { variant: 'rounded' },

  // applied only when the grid resolves to dark mode
  dark: {
    colors: { headerBackground: '#020617', rowHover: '#1E293B' },
  },
});
```

### Token groups

| Group | Keys |
| --- | --- |
| `colors` | `primary` `primaryHover` `primaryContrast` `secondary` `success` `warning` `danger` `info` `background` `surface` `surfaceAlt` `text` `textMuted` `textInverse` `border` `borderStrong` `overlay` `focusRing` `headerBackground` `headerText` `rowBackground` `rowAltBackground` `rowHover` `rowSelected` `rowSelectedHover` `scrollbarThumb` `scrollbarTrack` `pinShadow` `hoverOverlay` `activeOverlay` |
| `typography` | `fontFamily` `monoFamily` `fontSize` `headerFontSize` `fontWeight` `headerFontWeight` `lineHeight` `letterSpacing` |
| `spacing` | `unit` `cellPaddingX` `cellPaddingY` `headerPaddingX` `headerPaddingY` `gap` |
| `borders` | `width` `style` `headerBorder` `rowBorder` `columnBorder` `outerBorder` |
| `radius` | `none` `sm` `md` `lg` `xl` `full` `container` |
| `shadows` | `none` `sm` `md` `lg` `container` `pinned` `sticky` |
| `sizing` | `headerHeight` `rowHeight` `toolbarHeight` `footerHeight` `paginationHeight` |
| `motion` | `enabled` `duration` `easing` |

---

## Level 3 — the `ui` prop

The headline feature: change the entire design from one object, per grid instance.

```tsx
<SmartDataGrid
  ui={{
    table:      { variant: 'bordered', radius: 16, shadow: '0 8px 30px rgba(0,0,0,.08)' },
    header:     { height: 52, background: '#111827', color: '#fff', sticky: true, textTransform: 'uppercase' },
    headerCell: { padding: '12px 16px' },
    row:        { height: 56, striped: true, hoverBackground: '#F8FAFC', selectedBackground: '#DBEAFE', selectedAccent: true },
    cell:       { padding: '12px 16px', fontSize: 14 },
    footer:     { sticky: true, background: '#F1F5F9' },
    toolbar:    { height: 56, variant: 'filled', align: 'between' },
    search:     { variant: 'pill', size: 'md', width: 280, placeholder: 'Find anyone…' },
    filter:     { placement: 'popover' },
    pagination: { variant: 'pill', position: 'bottom-right', size: 'md' },
    checkbox:   { variant: 'circle', size: 'md' },
    loading:    { variant: 'skeleton', rows: 8 },
    emptyState: { variant: 'illustration', title: 'No users found', description: 'Try changing your filters' },
    errorState: { variant: 'retry', retry: true },
    scrollbar:  { width: 8, autoHide: true },
    icon:       { sortAsc: <MyUpIcon /> },
    actions:    { display: 'dropdown', showOnHover: true },
    button:     { radius: 999 },
  }}
/>
```

Every slot also accepts `className`, `style`, `variant` and `size`.

### Variants

| Slot | Variants |
| --- | --- |
| `table` | `default` `minimal` `bordered` `borderless` `striped` `compact` `comfortable` `dense` `card` |
| `header` | `default` `filled` `gradient` `transparent` `floating` |
| `pagination` | `default` `minimal` `compact` `pill` `numbered` `outlined` `filled` `simple` |
| `search` | `default` `filled` `outlined` `rounded` `pill` `minimal` |
| `checkbox` | `square` `rounded` `circle` `switch` |
| `loading` | `skeleton` `spinner` `progress` `shimmer` `overlay` `minimal` |
| `emptyState` | `default` `minimal` `illustration` `search` `filtered` `custom` |
| `errorState` | `default` `retry` `network` `server` `custom` |
| `toolbar` | `default` `filled` `minimal` `floating` `bordered` |

Sizes are `xs` `sm` `md` `lg` `xl`.

---

## Level 4 — CSS variables

Every token becomes a `--grid-*` custom property on the grid root, so you can restyle from plain CSS, a CSS Module, Tailwind's `@layer`, or a design-system stylesheet.

```css
.my-grid {
  --grid-primary: #7c3aed;
  --grid-background: #ffffff;
  --grid-header-background: #faf5ff;
  --grid-header-text: #5b21b6;
  --grid-row-background: #ffffff;
  --grid-row-hover: #faf5ff;
  --grid-row-selected: #f3e8ff;
  --grid-border: #e9d5ff;
  --grid-text: #1e1b4b;
  --grid-muted: #7c7c96;
  --grid-radius: 14px;
  --grid-spacing: 4px;
  --grid-font-size: 14px;
  --grid-header-height: 48px;
  --grid-row-height: 56px;
}
```

```tsx
<SmartDataGrid className="my-grid" … />
```

There are 90+ variables in total — see `themeToCssVars` in `src/theme/cssVars.ts` for the complete list. The fifteen above are the documented, stable core.

---

## Hover and interaction states

Three things control how interaction reads:

| Token | Applies to |
| --- | --- |
| `colors.rowHover` / `colors.rowSelectedHover` | Body rows |
| `ui.header.hoverBackground` | Sortable header cells |
| `colors.hoverOverlay` / `colors.activeOverlay` | Buttons, menu items, pagination, expanders |

```tsx
createGridTheme({
  colors: {
    rowHover: '#EEF2FF',
    rowSelectedHover: '#C7D2FE',
    hoverOverlay: 'rgba(79, 70, 229, 0.08)',
    activeOverlay: 'rgba(79, 70, 229, 0.16)',
  },
  header: { hoverBackground: 'rgba(255,255,255,0.12)' },
});
```

**Controls on unknown backgrounds resolve themselves.** A header can be any colour, so buttons inside it don't use `hoverOverlay` — they tint with `color-mix(in srgb, currentColor …)`, which derives contrast from the header's own text colour. A white button box never lands on a dark header, and you don't have to restate hover colours every time you restyle a header.

Header action buttons (the per-column `⋮` menu) stay hidden until the header cell is hovered or focused, and are always visible on touch devices where there is no hover.

Setting `ui.header.hoverBackground` takes over from the automatic mix.

---

## Frozen columns

Freeze by column definition or by state:

```tsx
// per column
{ accessorKey: 'name', header: 'Name', pinned: 'left' }

// or from state, so it can be toggled at runtime
<SmartDataGrid state={{ columnPinning: { left: ['name'], right: ['actions'] } }} />
```

The grid's own columns — drag handle, selection checkbox, expander — are frozen left automatically and always sort ahead of your pinned columns; the row-actions column freezes right. So the checkbox stays visible while the grid scrolls sideways, and it is always the first column in the row.

Style the separation:

| Token | Effect |
| --- | --- |
| `colors.pinShadow` | Colour of the gradient a frozen column casts over scrolling content |
| `ui.table.pinShadowSize` | Width of that gradient in px (default `8`) |
| `colors.border` | The hairline that marks the freeze boundary before you scroll |

```tsx
createGridTheme({
  colors: { pinShadow: 'rgba(15, 23, 42, 0.2)' },
  table: { pinShadowSize: 14 },
});
```

The shadow only appears once there is something scrolled underneath it, so a grid that fits its container stays flat. Under `dir="rtl"` the gradients mirror automatically.

---

## Density

```tsx
<SmartDataGrid density="compact" />
```

| Density | Row height | Header | Cell padding | Font |
| --- | --- | --- | --- | --- |
| `dense` | 32px | 34px | 4/8 | 12px |
| `compact` | 40px | 42px | 6/12 | 13px |
| `comfortable` | 52px | 48px | 12/16 | 14px |
| `spacious` | 64px | 58px | 18/20 | 15px |

`ui.row.height` and `ui.header.height` override the density defaults.

---

## Dark mode

```tsx
<SmartDataGrid darkMode="system" />   // 'light' | 'dark' | 'system'
```

`system` subscribes to `prefers-color-scheme` and re-renders on change. Brand colours you set explicitly (`primary`, `success`, overlays…) are preserved across the switch. Surface and text colours are preserved only when they still read on a dark background — a dark header you chose stays, but a light theme's white header or near-black text flips to the dark palette, so `theme="modern"` looks right in dark mode without extra work. Use `theme.dark` to pin exact dark-only values.

---

## RTL

```tsx
<SmartDataGrid dir="rtl" />
```

Pinned-column offsets, sort chevrons, pagination arrows, the switch checkbox, drag interactions and cell padding all mirror. Layout uses logical properties (`inset-inline-start`, `padding-inline`) so nothing needs a second stylesheet.

---

## Animations

On by default, 160ms, with `prefers-reduced-motion` respected automatically.

```tsx
<SmartDataGrid animations={false} />
```

Or per theme: `motion: { enabled: false }`.
