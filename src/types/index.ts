/**
 * Smart Data Grid — public type surface.
 *
 * Everything a consumer can pass in or receive back is typed here. The rule for
 * this file: no `any` in anything that faces the user. Internal escape hatches
 * use `unknown` and narrow at the point of use.
 */
import type { CSSProperties, ReactNode } from 'react';

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/** Default row constraint. Rows are plain objects; values are unknown until read. */
export type GridRow = Record<string, unknown>;

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Align = 'left' | 'center' | 'right';
export type Density = 'compact' | 'comfortable' | 'spacious' | 'dense';
export type Direction = 'ltr' | 'rtl';
export type ColorMode = 'light' | 'dark' | 'system';
export type PinPosition = 'left' | 'right' | false;

/** Anything that can identify a row: an explicit key, or a resolver. */
export type RowIdGetter<T> = keyof T | ((row: T, index: number) => string);

/* ------------------------------------------------------------------ *
 * Sorting
 * ------------------------------------------------------------------ */

export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  /** Column id. */
  id: string;
  direction: SortDirection;
}

export type SortingState = SortRule[];

export type SortComparator<T> = (a: T, b: T, direction: SortDirection) => number;

/* ------------------------------------------------------------------ *
 * Filtering
 * ------------------------------------------------------------------ */

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export type FilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'dateRange'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'custom';

export type LogicOperator = 'AND' | 'OR' | 'NOT';

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  color?: string;
  icon?: ReactNode;
}

export interface FilterCondition {
  /** Stable id, generated when omitted. */
  id?: string;
  /** Column id the condition applies to. */
  field: string;
  operator: FilterOperator;
  value?: unknown;
  /** Upper bound for `between`. */
  value2?: unknown;
  type?: FilterType;
  /** Case sensitivity for string operators. Defaults to false. */
  caseSensitive?: boolean;
  disabled?: boolean;
}

export interface FilterGroup {
  id?: string;
  operator: LogicOperator;
  conditions: FilterNode[];
  disabled?: boolean;
}

export type FilterNode = FilterCondition | FilterGroup;

/** Top-level filter state: an implicit AND across the groups. */
export type FiltersState = FilterGroup[];

export type FilterPredicate<T> = (row: T, condition: FilterCondition) => boolean;

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export interface SearchState {
  /** Global search term. */
  query: string;
  /** Per-column search terms, keyed by column id. */
  columns: Record<string, string>;
}

export type SearchMode = 'contains' | 'startsWith' | 'exact' | 'fuzzy' | 'words';

/* ------------------------------------------------------------------ *
 * Pagination
 * ------------------------------------------------------------------ */

export type PaginationMode = 'offset' | 'cursor';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  /** Cursor for the current page when `mode: 'cursor'`. */
  cursor?: string | null;
}

export type PaginationPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'both';

export type PaginationVariant =
  | 'default'
  | 'minimal'
  | 'compact'
  | 'pill'
  | 'numbered'
  | 'outlined'
  | 'filled'
  | 'simple';

export interface PaginationConfig {
  pageSize?: number;
  pageIndex?: number;
  pageSizeOptions?: number[];
  mode?: PaginationMode;
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  showTotal?: boolean;
  showFirstLast?: boolean;
  /** Page buttons rendered on each side of the current page. */
  siblingCount?: number;
  position?: PaginationPosition;
  variant?: PaginationVariant;
  size?: Size;
  labels?: Partial<PaginationLabels>;
}

export interface PaginationLabels {
  first: string;
  last: string;
  previous: string;
  next: string;
  page: string;
  of: string;
  rowsPerPage: string;
  jumpTo: string;
  showing: string;
  results: string;
}

/* ------------------------------------------------------------------ *
 * Selection
 * ------------------------------------------------------------------ */

export type SelectionMode = 'none' | 'single' | 'multiple';

/** Selected row ids. */
export type SelectionState = string[];

export type SelectAllScope = 'page' | 'filtered' | 'all';

/* ------------------------------------------------------------------ *
 * Grouping & aggregation
 * ------------------------------------------------------------------ */

export type AggregateType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct' | 'first' | 'last';

export type AggregateFn<T> = (rows: T[], columnId: string) => unknown;

/** Column ids to group by, outermost first. */
export type GroupingState = string[];

export interface GroupRow<T> {
  kind: 'group';
  id: string;
  columnId: string;
  value: unknown;
  depth: number;
  count: number;
  rows: T[];
  aggregates: Record<string, unknown>;
}

/* ------------------------------------------------------------------ *
 * Editing
 * ------------------------------------------------------------------ */

export type EditorType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'textarea'
  | 'custom';

export type EditMode = 'cell' | 'row';

export interface EditorContext<T> {
  value: unknown;
  row: T;
  rowId: string;
  rowIndex: number;
  column: ResolvedColumn<T>;
  /** Stage a new value. Committed on save. */
  setValue: (next: unknown) => void;
  save: () => void;
  cancel: () => void;
  error?: string | null;
}

export type EditorRenderer<T> = (ctx: EditorContext<T>) => ReactNode;

export interface CellEditState {
  rowId: string;
  columnId: string;
}

export interface RowUpdatePayload<T> {
  rowId: string;
  row: T;
  previousRow: T;
  changes: Partial<T>;
  columnId: string;
}

/* ------------------------------------------------------------------ *
 * Built-in cell types
 * ------------------------------------------------------------------ */

export type CellType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'relativeTime'
  | 'avatar'
  | 'avatarGroup'
  | 'badge'
  | 'status'
  | 'progress'
  | 'rating'
  | 'boolean'
  | 'checkbox'
  | 'switch'
  | 'link'
  | 'email'
  | 'phone'
  | 'image'
  | 'icon'
  | 'action'
  | 'button'
  | 'dropdown'
  | 'tags'
  | 'code'
  | 'json'
  | 'trend';

export interface CellTypeOptions {
  /** currency / number / percentage */
  currency?: string;
  locale?: string;
  decimals?: number;
  notation?: 'standard' | 'compact';
  prefix?: string;
  suffix?: string;
  /** date / datetime / relativeTime */
  dateFormat?: string;
  timeZone?: string;
  /** badge / status */
  colorMap?: Record<string, string>;
  /** progress */
  max?: number;
  showValue?: boolean;
  /** avatar */
  srcKey?: string;
  nameKey?: string;
  maxAvatars?: number;
  /** link / email / phone */
  hrefKey?: string;
  target?: '_blank' | '_self';
  /** tags */
  maxTags?: number;
  /** rating */
  outOf?: number;
  /** image */
  imageWidth?: number;
  imageHeight?: number;
  /** action / button / dropdown */
  actions?: RowAction<GridRow>[];
  /** boolean / checkbox / switch */
  trueLabel?: string;
  falseLabel?: string;
  /** trend */
  trendDirectionKey?: string;
}

/* ------------------------------------------------------------------ *
 * Row actions
 * ------------------------------------------------------------------ */

export type RowActionDisplay = 'buttons' | 'iconButtons' | 'dropdown' | 'contextMenu';

export interface RowAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Renders the action in a danger colour. */
  danger?: boolean;
  divider?: boolean;
  hidden?: boolean | ((row: T) => boolean);
  disabled?: boolean | ((row: T) => boolean);
  onClick: (row: T, ctx: RowActionContext<T>) => void;
}

export interface RowActionContext<T> {
  rowId: string;
  rowIndex: number;
  grid: GridApi<T>;
}

export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean | ((rows: T[]) => boolean);
  onClick: (rows: T[], ctx: { grid: GridApi<T> }) => void;
}

/* ------------------------------------------------------------------ *
 * Columns
 * ------------------------------------------------------------------ */

export interface HeaderContext<T> {
  column: ResolvedColumn<T>;
  grid: GridApi<T>;
  sortDirection: SortDirection | null;
  sortIndex: number;
}

export interface FooterContext<T> {
  column: ResolvedColumn<T>;
  grid: GridApi<T>;
  rows: T[];
  aggregate: unknown;
}

export interface CellContext<T> {
  value: unknown;
  row: T;
  rowId: string;
  rowIndex: number;
  column: ResolvedColumn<T>;
  grid: GridApi<T>;
  isSelected: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  /** Terms currently highlighted by search, if any. */
  highlight?: string;
}

export type CellRenderer<T> = (ctx: CellContext<T>) => ReactNode;

export interface ColumnDef<T = GridRow> {
  /** Defaults to `accessorKey`. Required when using `accessorFn`. */
  id?: string;
  /** Supports dot paths: `"profile.address.city"`. */
  accessorKey?: string;
  accessorFn?: (row: T, index: number) => unknown;

  header?: ReactNode | ((ctx: HeaderContext<T>) => ReactNode);
  footer?: ReactNode | ((ctx: FooterContext<T>) => ReactNode);
  cell?: CellRenderer<T>;

  /** Built-in renderer. Ignored when `cell` is provided. */
  type?: CellType;
  cellOptions?: CellTypeOptions;
  /** Value → display string, applied before the built-in renderer. */
  format?: (value: unknown, row: T) => string;

  /** Nested columns produce multi-level (grouped) headers. */
  columns?: ColumnDef<T>[];

  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Share of the leftover horizontal space. */
  flex?: number;
  align?: Align;
  headerAlign?: Align;

  sortable?: boolean;
  sortComparator?: SortComparator<T>;
  sortAccessor?: (row: T) => unknown;
  /** Where empty values land when sorting. Defaults to `'last'`. */
  emptySort?: 'first' | 'last';

  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  filterFn?: FilterPredicate<T>;
  /** Operators offered in the filter UI for this column. */
  filterOperators?: FilterOperator[];

  searchable?: boolean;

  hidden?: boolean;
  hideable?: boolean;
  pinned?: PinPosition;
  pinnable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;

  editable?: boolean | ((row: T) => boolean);
  editor?: EditorType | EditorRenderer<T>;
  editorOptions?: FilterOption[];
  /** Return a string to reject the value, or `null`/`true` to accept it. */
  validate?: (value: unknown, row: T) => string | null | true | undefined;
  /** Parse the raw editor input before it hits the row. */
  parse?: (input: string) => unknown;

  groupable?: boolean;
  aggregate?: AggregateType | AggregateFn<T>;

  /** Higher stays visible longer in `responsive="priority"` mode. */
  priority?: number;
  /** Hidden below this viewport width (px). */
  minViewport?: number;

  colSpan?: number | ((ctx: CellContext<T>) => number);
  rowSpan?: number | ((ctx: CellContext<T>) => number);

  className?: string | ((ctx: CellContext<T>) => string | undefined);
  style?: CSSProperties | ((ctx: CellContext<T>) => CSSProperties | undefined);
  headerClassName?: string;
  headerStyle?: CSSProperties;

  /** Clip overflow with an ellipsis and expose the full value as a title. */
  truncate?: boolean;
  tooltip?: boolean | ((ctx: CellContext<T>) => string);

  /** Arbitrary payload, passed through to renderers untouched. */
  meta?: Record<string, unknown>;
}

/** A `ColumnDef` after defaults, theme and runtime state have been applied. */
export interface ResolvedColumn<T = GridRow> extends ColumnDef<T> {
  id: string;
  /** Depth in the header group tree. Leaf columns are what render cells. */
  depth: number;
  /** Leaf columns underneath a header group. */
  leaves: ResolvedColumn<T>[];
  isLeaf: boolean;
  parentId?: string;
  /** Resolved pixel width used for layout. */
  computedWidth: number;
  /** Sticky offset in px when pinned. */
  pinnedOffset?: number;
  /** True when this is the last column of the left pin block (or first of right). */
  pinnedEdge?: boolean;
  getValue: (row: T, index: number) => unknown;
}

/* ------------------------------------------------------------------ *
 * Theme tokens
 * ------------------------------------------------------------------ */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  overlay: string;
  focusRing: string;
  headerBackground: string;
  headerText: string;
  rowBackground: string;
  rowAltBackground: string;
  rowHover: string;
  rowSelected: string;
  rowSelectedHover: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  /** Gradient colour cast by frozen columns over the scrolling content. */
  pinShadow: string;
  /** Tint layered on hovered controls. Defaults to a currentColor mix. */
  hoverOverlay: string;
  /** Tint layered on pressed / open controls. */
  activeOverlay: string;
}

export interface ThemeTypography {
  fontFamily: string;
  monoFamily: string;
  fontSize: string;
  headerFontSize: string;
  fontWeight: number | string;
  headerFontWeight: number | string;
  lineHeight: string | number;
  letterSpacing: string;
}

export interface ThemeSpacing {
  unit: number;
  cellPaddingX: string;
  cellPaddingY: string;
  headerPaddingX: string;
  headerPaddingY: string;
  gap: string;
}

export interface ThemeBorders {
  width: string;
  style: string;
  headerBorder: boolean;
  rowBorder: boolean;
  columnBorder: boolean;
  outerBorder: boolean;
}

export interface ThemeRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
  container: string;
}

export interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  container: string;
  /** Applied to pinned columns to separate them from scrolled content. */
  pinned: string;
  sticky: string;
}

export interface ThemeSizing {
  headerHeight: number;
  rowHeight: number;
  toolbarHeight: number;
  footerHeight: number;
  paginationHeight: number;
}

export interface ThemeMotion {
  enabled: boolean;
  duration: string;
  easing: string;
}

/* ------------------------------------------------------------------ *
 * UI slots — the one-stop customization surface
 * ------------------------------------------------------------------ */

export interface SlotBase<V extends string = string> {
  className?: string;
  style?: CSSProperties;
  variant?: V;
  size?: Size;
}

export type TableVariant =
  | 'default'
  | 'minimal'
  | 'bordered'
  | 'borderless'
  | 'striped'
  | 'compact'
  | 'comfortable'
  | 'dense'
  | 'card';

export type HeaderVariant = 'default' | 'filled' | 'gradient' | 'transparent' | 'floating';
export type SearchVariant = 'default' | 'filled' | 'outlined' | 'rounded' | 'pill' | 'minimal';
export type CheckboxVariant = 'square' | 'rounded' | 'circle' | 'switch';
export type LoadingVariant = 'skeleton' | 'spinner' | 'progress' | 'shimmer' | 'overlay' | 'minimal';
export type EmptyStateVariant = 'default' | 'minimal' | 'illustration' | 'search' | 'filtered' | 'custom';
export type ErrorStateVariant = 'default' | 'retry' | 'network' | 'server' | 'custom';
export type ToolbarVariant = 'default' | 'filled' | 'minimal' | 'floating' | 'bordered';

export interface TableSlot extends SlotBase<TableVariant> {
  background?: string;
  border?: boolean;
  borderColor?: string;
  radius?: string | number;
  shadow?: string;
  /** Fixed height for the scroll container. */
  height?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  layout?: 'auto' | 'fixed';
  /** Width in px of the shadow frozen columns cast. */
  pinShadowSize?: number;
}

export interface HeaderSlot extends SlotBase<HeaderVariant> {
  height?: number;
  background?: string;
  color?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  letterSpacing?: string;
  textTransform?: CSSProperties['textTransform'];
  border?: boolean;
  borderColor?: string;
  sticky?: boolean;
  divider?: boolean;
  hoverBackground?: string;
}

export interface HeaderCellSlot extends SlotBase {
  padding?: string;
  align?: Align;
  gap?: string;
}

export interface BodySlot extends SlotBase {
  background?: string;
}

export interface RowSlot extends SlotBase {
  height?: number;
  background?: string;
  altBackground?: string;
  hoverBackground?: string;
  selectedBackground?: string;
  selectedHoverBackground?: string;
  striped?: boolean;
  border?: boolean;
  borderColor?: string;
  /** Left accent bar on the selected row. */
  selectedAccent?: string | boolean;
  cursor?: CSSProperties['cursor'];
}

export interface CellSlot extends SlotBase {
  padding?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  border?: boolean;
  borderColor?: string;
  align?: Align;
}

export interface FooterSlot extends SlotBase {
  height?: number;
  background?: string;
  color?: string;
  fontWeight?: number | string;
  border?: boolean;
  sticky?: boolean;
}

export interface ToolbarSlot extends SlotBase<ToolbarVariant> {
  height?: number;
  background?: string;
  border?: boolean;
  padding?: string;
  gap?: string;
  /** Where built-in toolbar actions sit. */
  align?: 'start' | 'end' | 'between';
  position?: 'top' | 'bottom';
}

export interface SearchSlot extends SlotBase<SearchVariant> {
  width?: number | string;
  placeholder?: string;
  background?: string;
  color?: string;
  borderColor?: string;
  radius?: string | number;
  icon?: ReactNode;
  clearable?: boolean;
}

export interface FilterSlot extends SlotBase {
  background?: string;
  border?: boolean;
  radius?: string | number;
  /** Where the filter UI appears. */
  placement?: 'panel' | 'popover' | 'inline' | 'drawer' | 'bottomSheet';
  width?: number | string;
}

export interface PaginationSlot extends SlotBase<PaginationVariant> {
  position?: PaginationPosition;
  background?: string;
  color?: string;
  activeBackground?: string;
  activeColor?: string;
  border?: boolean;
  radius?: string | number;
  gap?: string;
  height?: number;
}

export interface CheckboxSlot extends SlotBase<CheckboxVariant> {
  color?: string;
  borderColor?: string;
  radius?: string | number;
}

export interface LoadingSlot extends SlotBase<LoadingVariant> {
  rows?: number;
  color?: string;
  overlayBackground?: string;
  label?: ReactNode;
}

export interface EmptyStateSlot extends SlotBase<EmptyStateVariant> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  height?: number | string;
}

export interface ErrorStateSlot extends SlotBase<ErrorStateVariant> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  retry?: boolean;
  retryLabel?: string;
  onRetry?: () => void;
  height?: number | string;
}

export interface ScrollbarSlot extends SlotBase {
  width?: number;
  thumbColor?: string;
  trackColor?: string;
  /** Hide until the container is hovered. */
  autoHide?: boolean;
}

export interface IconSlot extends SlotBase {
  color?: string;
  sortAsc?: ReactNode;
  sortDesc?: ReactNode;
  sortNone?: ReactNode;
  expand?: ReactNode;
  collapse?: ReactNode;
  filter?: ReactNode;
  search?: ReactNode;
  columns?: ReactNode;
  export?: ReactNode;
  refresh?: ReactNode;
  density?: ReactNode;
  fullscreen?: ReactNode;
  settings?: ReactNode;
  more?: ReactNode;
  close?: ReactNode;
}

export interface ActionsSlot extends SlotBase {
  display?: RowActionDisplay;
  /** Reveal the action column only while the row is hovered. */
  showOnHover?: boolean;
  width?: number;
}

export interface ButtonSlot extends SlotBase<'default' | 'filled' | 'outlined' | 'ghost' | 'soft'> {
  radius?: string | number;
  background?: string;
  color?: string;
  borderColor?: string;
}

/** The single object that drives every visual decision in the grid. */
export interface GridUIConfig {
  table?: TableSlot;
  header?: HeaderSlot;
  headerCell?: HeaderCellSlot;
  body?: BodySlot;
  row?: RowSlot;
  cell?: CellSlot;
  footer?: FooterSlot;
  toolbar?: ToolbarSlot;
  search?: SearchSlot;
  filter?: FilterSlot;
  pagination?: PaginationSlot;
  checkbox?: CheckboxSlot;
  loading?: LoadingSlot;
  emptyState?: EmptyStateSlot;
  errorState?: ErrorStateSlot;
  scrollbar?: ScrollbarSlot;
  icon?: IconSlot;
  actions?: ActionsSlot;
  button?: ButtonSlot;
}

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */

export type ThemePreset =
  | 'default'
  | 'modern'
  | 'minimal'
  | 'compact'
  | 'comfortable'
  | 'enterprise'
  | 'material'
  | 'glass'
  | 'soft'
  | 'dark'
  | 'high-contrast'
  | 'rounded'
  | 'sharp'
  | 'borderless'
  | 'dense'
  | 'luxury'
  | 'dashboard'
  | 'crm'
  | 'hrms'
  | 'erp'
  | 'saas'
  | 'analytics'
  | 'system';

/** What `createGridTheme()` accepts. Slot keys mirror `GridUIConfig`. */
export interface GridThemeInput extends GridUIConfig {
  name?: string;
  /** Base preset this theme extends. */
  extends?: ThemePreset;
  mode?: 'light' | 'dark';
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  borders?: Partial<ThemeBorders>;
  radius?: Partial<ThemeRadius>;
  shadows?: Partial<ThemeShadows>;
  sizing?: Partial<ThemeSizing>;
  motion?: Partial<ThemeMotion>;
  density?: Density;
  /** Token overrides applied only when the grid resolves to dark mode. */
  dark?: Omit<GridThemeInput, 'dark' | 'extends'>;
  /** Raw CSS variable overrides, applied last. */
  cssVars?: Record<string, string | number>;
}

/** A fully-resolved theme. Every token has a value. */
export interface GridTheme {
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  sizing: ThemeSizing;
  motion: ThemeMotion;
  density: Density;
  ui: GridUIConfig;
  dark?: Omit<GridThemeInput, 'dark' | 'extends'>;
  cssVars?: Record<string, string | number>;
  /** Marker used to tell a resolved theme from a raw input object. */
  readonly __smartGridTheme: true;
}

/* ------------------------------------------------------------------ *
 * Data providers / server side
 * ------------------------------------------------------------------ */

export interface DataProviderParams {
  page: number;
  pageIndex: number;
  pageSize: number;
  cursor?: string | null;
  filters: FiltersState;
  sorting: SortingState;
  search: string;
  columnSearch: Record<string, string>;
  grouping: GroupingState;
  signal?: AbortSignal;
}

export interface DataProviderResult<T> {
  rows: T[];
  total?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
  /** Server-computed footer aggregates, keyed by column id. */
  aggregates?: Record<string, unknown>;
}

export interface DataProvider<T> {
  fetch: (params: DataProviderParams) => Promise<DataProviderResult<T>>;
  /** Optional write-back hooks used by inline editing. */
  update?: (payload: RowUpdatePayload<T>) => Promise<T | void>;
  create?: (row: Partial<T>) => Promise<T | void>;
  delete?: (rowId: string, row: T) => Promise<void>;
  /** Provider-level cache key contributors. */
  key?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface DataSourceConfig<T> {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string> | (() => Record<string, string>);
  /** Rename the query params sent to the server. */
  paramMap?: Partial<Record<keyof DataProviderParams, string>>;
  /** Build the request body/query yourself. */
  serialize?: (params: DataProviderParams) => Record<string, unknown>;
  /** Map an arbitrary API response into rows + total. */
  transform?: (response: unknown) => DataProviderResult<T>;
  /** Swap in axios, ky, or anything else. Defaults to global `fetch`. */
  fetcher?: (url: string, init: RequestInit) => Promise<unknown>;
  credentials?: RequestCredentials;
}

/* ------------------------------------------------------------------ *
 * Export
 * ------------------------------------------------------------------ */

export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf' | 'print' | 'clipboard';
export type ExportScope = 'all' | 'page' | 'selected' | 'filtered';

export interface ExportOptions<T = GridRow> {
  format?: ExportFormat;
  scope?: ExportScope;
  filename?: string;
  /** Column ids to include. Defaults to all visible columns. */
  columns?: string[];
  includeHeaders?: boolean;
  delimiter?: string;
  /** Use raw values instead of the rendered/formatted string. */
  raw?: boolean;
  /** Final say over the exported cell text. */
  formatCell?: (value: unknown, row: T, columnId: string) => string;
  title?: string;
  onComplete?: (result: { format: ExportFormat; rows: number }) => void;
}

/* ------------------------------------------------------------------ *
 * Responsive & toolbar
 * ------------------------------------------------------------------ */

export type ResponsiveMode =
  | 'horizontal-scroll'
  | 'stacked'
  | 'card'
  | 'priority'
  | 'responsive-columns'
  | false;

export interface ToolbarConfig<T = GridRow> {
  search?: boolean;
  filter?: boolean;
  columns?: boolean;
  export?: boolean | ExportFormat[];
  refresh?: boolean;
  density?: boolean;
  fullscreen?: boolean;
  settings?: boolean;
  addRow?: boolean;
  bulkActions?: BulkAction<T>[] | boolean;
  title?: ReactNode;
  /** Rendered on the left of the built-in actions. */
  start?: ReactNode;
  /** Rendered on the right of the built-in actions. */
  end?: ReactNode;
  /** Replaces the entire toolbar. */
  render?: (ctx: { grid: GridApi<T> }) => ReactNode;
}

/* ------------------------------------------------------------------ *
 * Keyboard
 * ------------------------------------------------------------------ */

export interface KeyboardShortcuts {
  selectAll?: string | false;
  search?: string | false;
  commandPalette?: string | false;
  export?: string | false;
  refresh?: string | false;
  edit?: string | false;
  cancel?: string | false;
  toggleSelect?: string | false;
  nextPage?: string | false;
  prevPage?: string | false;
}

/* ------------------------------------------------------------------ *
 * Grid state
 * ------------------------------------------------------------------ */

export interface GridState {
  sorting: SortingState;
  filters: FiltersState;
  search: SearchState;
  pagination: PaginationState;
  selection: SelectionState;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  columnPinning: { left: string[]; right: string[] };
  expanded: string[];
  grouping: GroupingState;
  density: Density;
  editing: CellEditState | null;
  fullscreen: boolean;
}

export type GridStateInput = Partial<GridState>;

export interface GridStateChangeMeta {
  /** Which slice changed. Useful for narrow server refetches. */
  key: keyof GridState | 'reset';
}

/* ------------------------------------------------------------------ *
 * Plugins
 * ------------------------------------------------------------------ */

export interface GridPluginContext<T> {
  grid: GridApi<T>;
}

export interface GridPlugin<T = GridRow> {
  name: string;
  /** Mutate the initial state before first render. */
  initState?: (state: GridState) => GridState;
  /** Transform columns before they are resolved. */
  columns?: (columns: ColumnDef<T>[]) => ColumnDef<T>[];
  /** Transform rows after the built-in pipeline runs. */
  transform?: (rows: T[], ctx: { state: GridState }) => T[];
  /** Slot renderers contributed by the plugin. */
  toolbar?: (ctx: GridPluginContext<T>) => ReactNode;
  onStateChange?: (state: GridState, meta: GridStateChangeMeta) => void;
  onMount?: (ctx: GridPluginContext<T>) => void | (() => void);
}

/* ------------------------------------------------------------------ *
 * Imperative API
 * ------------------------------------------------------------------ */

export interface GridApi<T = GridRow> {
  /** Every row handed to the grid, pre-pipeline. */
  getAllRows: () => T[];
  /** Rows after search + filters, before pagination. */
  getFilteredRows: () => T[];
  /** Rows currently rendered. */
  getPageRows: () => T[];
  getSelectedRows: () => T[];
  getRowId: (row: T, index: number) => string;
  getColumns: () => ResolvedColumn<T>[];
  getVisibleColumns: () => ResolvedColumn<T>[];
  getState: () => GridState;
  setState: (updater: GridStateInput | ((prev: GridState) => GridState)) => void;
  resetState: () => void;

  setSorting: (sorting: SortingState) => void;
  toggleSort: (columnId: string, multi?: boolean) => void;
  clearSorting: () => void;

  setFilters: (filters: FiltersState) => void;
  addFilter: (condition: FilterCondition, groupIndex?: number) => void;
  removeFilter: (conditionId: string) => void;
  clearFilters: () => void;

  setSearch: (query: string) => void;
  setColumnSearch: (columnId: string, query: string) => void;
  clearSearch: () => void;

  setPage: (pageIndex: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  getPageCount: () => number;
  getRowCount: () => number;

  selectRow: (rowId: string, selected?: boolean) => void;
  toggleRow: (rowId: string) => void;
  selectAll: (scope?: SelectAllScope) => void;
  clearSelection: () => void;
  isRowSelected: (rowId: string) => boolean;

  toggleColumnVisibility: (columnId: string, visible?: boolean) => void;
  setColumnOrder: (order: string[]) => void;
  moveColumn: (columnId: string, toIndex: number) => void;
  resizeColumn: (columnId: string, width: number) => void;
  autoSizeColumn: (columnId: string) => void;
  pinColumn: (columnId: string, position: PinPosition) => void;
  resetColumns: () => void;

  toggleExpanded: (rowId: string, expanded?: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isExpanded: (rowId: string) => boolean;

  setGrouping: (grouping: GroupingState) => void;

  startEditing: (rowId: string, columnId: string) => void;
  stopEditing: (commit?: boolean) => void;
  updateRow: (rowId: string, changes: Partial<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setDensity: (density: Density) => void;
  toggleFullscreen: (on?: boolean) => void;

  exportData: (options?: ExportOptions<T>) => Promise<void> | void;
  refresh: () => void;
  scrollToRow: (index: number) => void;
  scrollToTop: () => void;

  getTheme: () => GridTheme;
}

/* ------------------------------------------------------------------ *
 * Component props
 * ------------------------------------------------------------------ */

export type GridPresetName =
  | 'admin'
  | 'crm'
  | 'hrms'
  | 'erp'
  | 'analytics'
  | 'saas'
  | 'enterprise'
  | 'minimal'
  | 'dashboard'
  | 'ecommerce';

export interface TreeConfig<T> {
  /** Key holding the child rows. Defaults to `"children"`. */
  childrenKey?: string;
  /** Parent-id key, for flat data that describes a tree. */
  parentKey?: string;
  defaultExpanded?: boolean | string[];
  /** Column the expander is rendered in. Defaults to the first visible column. */
  expanderColumn?: string;
  indent?: number;
  /**
   * Resolve children on demand.
   * @experimental Not implemented yet — accepted but ignored in 0.1.x.
   */
  loadChildren?: (row: T) => Promise<T[]>;
  /**
   * Selecting a parent selects its subtree.
   * @experimental Not implemented yet — accepted but ignored in 0.1.x.
   */
  cascadeSelection?: boolean;
}

export interface VirtualizationConfig {
  enabled?: boolean;
  rowHeight?: number | ((index: number) => number);
  overscan?: number;
  /** Rows above which virtualization turns itself on automatically. */
  threshold?: number;
  estimatedRowHeight?: number;
  /** Also virtualize columns horizontally. */
  columns?: boolean;
  columnOverscan?: number;
}

export interface InfiniteScrollConfig {
  enabled?: boolean;
  /** Distance from the bottom (px) that triggers the next fetch. */
  threshold?: number;
  loadMore?: () => void | Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  error?: Error | null;
  loader?: ReactNode;
  endMessage?: ReactNode;
  retryLabel?: string;
}

export interface UrlStateConfig {
  enabled?: boolean;
  /** Prefix for every query param this grid owns. */
  prefix?: string;
  /** Which slices to sync. */
  keys?: Array<'page' | 'pageSize' | 'search' | 'sort' | 'filters' | 'density'>;
  /** `replace` avoids polluting browser history. Defaults to `replace`. */
  history?: 'push' | 'replace';
}

export interface PersistConfig {
  enabled?: boolean;
  key: string;
  storage?: 'local' | 'session';
  keys?: Array<keyof GridState>;
}

export interface SmartDataGridProps<T = GridRow> {
  /* data ------------------------------------------------------------ */
  data?: T[];
  columns: ColumnDef<T>[];
  /** Stable row identity. Falls back to `"id"`, then the row index. */
  getRowId?: RowIdGetter<T>;
  rowCount?: number;
  /** `true` shows the loading state; an object only styles it (e.g. `{ variant: 'overlay' }`). */
  loading?: boolean | LoadingSlot;
  error?: Error | string | null;

  /* server ---------------------------------------------------------- */
  dataSource?: DataSourceConfig<T>;
  dataProvider?: DataProvider<T>;
  /** Force server-side processing of these concerns. */
  manual?: boolean | { sorting?: boolean; filtering?: boolean; pagination?: boolean; search?: boolean };

  /* feature flags --------------------------------------------------- */
  sortable?: boolean;
  multiSort?: boolean;
  searchable?: boolean;
  searchDebounce?: number;
  searchMode?: SearchMode;
  highlightSearch?: boolean;
  filterable?: boolean;
  pagination?: boolean | PaginationConfig;
  selectable?: boolean | SelectionMode;
  resizable?: boolean;
  reorderable?: boolean;
  virtualized?: boolean | VirtualizationConfig;
  editable?: boolean;
  /** @experimental Not implemented yet — editing is always per cell in 0.1.x. */
  editMode?: EditMode;
  exportable?: boolean | ExportFormat[];
  expandable?: boolean;
  groupable?: boolean;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  showFooter?: boolean;
  infiniteScroll?: boolean | InfiniteScrollConfig;
  tree?: boolean | TreeConfig<T>;
  keyboard?: boolean;
  shortcuts?: KeyboardShortcuts;

  /* look and feel --------------------------------------------------- */
  preset?: GridPresetName;
  theme?: ThemePreset | GridTheme | GridThemeInput;
  ui?: GridUIConfig;
  density?: Density;
  darkMode?: ColorMode;
  dir?: Direction;
  responsive?: ResponsiveMode;
  animations?: boolean;
  className?: string;
  style?: CSSProperties;
  height?: number | string;
  maxHeight?: number | string;
  /** Renders nothing visual — bring your own markup via `children`. */
  headless?: boolean;

  /* slots ----------------------------------------------------------- */
  toolbar?: boolean | ToolbarConfig<T>;
  emptyState?: EmptyStateSlot;
  errorState?: ErrorStateSlot;
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  renderExpanded?: (ctx: { row: T; rowId: string; rowIndex: number; grid: GridApi<T> }) => ReactNode;
  /** @experimental Not implemented yet — use `renderExpanded` in 0.1.x. */
  renderSubRow?: (ctx: { row: T; rowIndex: number }) => ReactNode;
  renderRow?: (ctx: { row: T; rowIndex: number; children: ReactNode }) => ReactNode;
  children?: ReactNode | ((ctx: { grid: GridApi<T> }) => ReactNode);

  /* row behaviour --------------------------------------------------- */
  rowClassName?: string | ((row: T, index: number) => string | undefined);
  rowStyle?: CSSProperties | ((row: T, index: number) => CSSProperties | undefined);
  isRowDisabled?: (row: T, index: number) => boolean;
  isRowSelectable?: (row: T, index: number) => boolean;

  /* state ----------------------------------------------------------- */
  state?: GridStateInput;
  defaultState?: GridStateInput;
  onStateChange?: (state: GridState, meta: GridStateChangeMeta) => void;
  urlState?: boolean | UrlStateConfig;
  persist?: PersistConfig;

  /* plugins --------------------------------------------------------- */
  plugins?: GridPlugin<T>[];

  /* events ---------------------------------------------------------- */
  onRowClick?: (row: T, ctx: { rowId: string; rowIndex: number; event: React.MouseEvent }) => void;
  onRowDoubleClick?: (row: T, ctx: { rowId: string; rowIndex: number; event: React.MouseEvent }) => void;
  onCellClick?: (ctx: CellContext<T> & { event: React.MouseEvent }) => void;
  onSelectionChange?: (rows: T[], ids: SelectionState) => void;
  onSortChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: FiltersState) => void;
  onSearchChange?: (query: string) => void;
  onPageChange?: (pagination: PaginationState) => void;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  onColumnOrderChange?: (order: string[]) => void;
  onColumnResize?: (columnId: string, width: number) => void;
  /**
   * Fired only when the user clicks "Save" in the columns panel (not on every
   * drag/pin/toggle) — for grids that persist layout through their own API
   * instead of `persist`/localStorage. Restore it by feeding the same shape
   * back through `defaultState`.
   */
  onSaveColumns?: (snapshot: {
    columnOrder: string[];
    columnVisibility: Record<string, boolean>;
    columnPinning: GridState['columnPinning'];
  }) => void;
  onRowUpdate?: (payload: RowUpdatePayload<T>) => void | Promise<void>;
  onExpandedChange?: (expanded: string[]) => void;
  onRefresh?: () => void;
  /** Fired by the toolbar's "Add row" button (`toolbar={{ addRow: true }}`). */
  onAddRow?: (ctx: { grid: GridApi<T> }) => void;
  onExport?: (options: ExportOptions<T>) => void;
  onReady?: (grid: GridApi<T>) => void;

  /* misc ------------------------------------------------------------ */
  id?: string;
  'aria-label'?: string;
  locale?: string;
  labels?: Partial<GridLabels>;
}

export interface GridLabels {
  search: string;
  searchPlaceholder: string;
  filter: string;
  filters: string;
  columns: string;
  export: string;
  refresh: string;
  density: string;
  fullscreen: string;
  exitFullscreen: string;
  settings: string;
  addRow: string;
  selected: string;
  clearSelection: string;
  noResults: string;
  noResultsDescription: string;
  loading: string;
  error: string;
  retry: string;
  save: string;
  cancel: string;
  undo: string;
  redo: string;
  apply: string;
  reset: string;
  addCondition: string;
  addGroup: string;
  where: string;
  showAll: string;
  hideAll: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  sortAsc: string;
  sortDesc: string;
  clearSort: string;
  groupBy: string;
  pagination: PaginationLabels;
}
