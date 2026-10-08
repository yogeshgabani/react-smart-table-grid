/**
 * Smart Data Grid
 *
 * One Smart Data Grid. Any Data. Any UI.
 *
 * ```tsx
 * import { SmartDataGrid } from 'react-smart-table-grid';
 *
 * <SmartDataGrid data={users} columns={columns} />
 * ```
 */

/* ---- component --------------------------------------------------- */
export { SmartDataGrid } from './components/SmartDataGrid';
export type { SmartDataGridExtraProps } from './components/SmartDataGrid';

/* ---- hooks ------------------------------------------------------- */
export { useGrid } from './hooks/useGrid';
export type { GridInstance } from './hooks/useGrid';
export { useGridState } from './hooks/useGridState';
export { useGridStyles, gridCss } from './hooks/useStyles';
export { useServerData } from './hooks/useServerData';
export { useVirtualizer, useInfiniteScroll } from './hooks/useVirtualizer';
export { useGridContext } from './components/context';
export type { GridContextValue } from './components/context';

/* ---- theme ------------------------------------------------------- */
export { createGridTheme, resolveTheme, applyThemeInput, applyDensity, isResolvedTheme } from './theme/createGridTheme';
export { themeToCssVars, documentedCssVars } from './theme/cssVars';
export { themePresets, themePresetNames, isThemePreset } from './theme/presets';
export {
  defaultTheme,
  lightColors,
  darkColors,
  densityTokens,
  defaultTypography,
  defaultSpacing,
  defaultBorders,
  defaultRadius,
  defaultShadows,
  darkShadows,
  defaultSizing,
  defaultMotion,
} from './theme/tokens';

/* ---- presets ----------------------------------------------------- */
export { gridPresets, gridPresetNames, getPreset } from './presets';
export type { PresetProps } from './presets';

/* ---- data -------------------------------------------------------- */
export { createDataProvider, createDataSourceProvider, defaultSerialize, defaultTransform } from './data/provider';

/* ---- export ------------------------------------------------------ */
export {
  runExport,
  toCsv,
  toJson,
  toExcelXml,
  toHtmlTable,
  toMatrix,
  printHtml,
  copyToClipboard,
  downloadBlob,
  EXPORT_LABELS,
} from './export';

/* ---- cell renderers ---------------------------------------------- */
export {
  Badge,
  Avatar,
  ProgressBar,
  Rating,
  Highlight,
  RowActions,
  renderCellType,
  builtInCellTypes,
  formatAggregate,
} from './components/cells';

/* ---- primitives (for custom slots) ------------------------------- */
export { Button, Checkbox, Radio, Popover, MenuItem, MenuDivider, LiveRegion } from './components/primitives';
export * as icons from './components/icons';

/* ---- sub-components (for headless composition) ------------------- */
export { GridHeader } from './components/GridHeader';
export { GridBody } from './components/GridBody';
export { GridFooter } from './components/GridFooter';
export { Toolbar, SelectionBar } from './components/Toolbar';
export { Pagination } from './components/Pagination';
export { SearchInput } from './components/SearchInput';
export { ColumnsPanel } from './components/ColumnsPanel';
export { FilterPanel } from './components/FilterPanel';
export { CardView } from './components/CardView';
export { EmptyState, ErrorState, LoadingState, LoadingOverlay } from './components/States';

/* ---- core (headless building blocks) ----------------------------- */
export { runPipeline } from './core/pipeline';
export { sortRows, compareValues, toggleSorting, serializeSorting, parseSorting, getSortRule } from './core/sort';
export { searchRows, fuzzyScore, matchesTerm, highlightChunks } from './core/search';
export {
  filterRows,
  evaluateOperator,
  evaluateNode,
  isFilterGroup,
  countConditions,
  createFilterGroup,
  inferFilterType,
  collectOptions,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
} from './core/filter';
export { paginateRows, getPageCount, getPageInfo, getPageTokens, clampPage } from './core/paginate';
export { aggregateColumn, aggregateColumns, runAggregate } from './core/aggregate';
export { resolveColumns, SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID, isSystemColumn } from './core/columns';
export { buildTree, flattenTree, buildGroupedRows, toDisplayRows, makeRowIdGetter, isDataRow } from './core/rows';
export { createInitialState } from './core/state';
export { resolveActionsDisplay } from './core/actions';
export type { RowActionsDisplay } from './core/actions';
export { defaultLabels } from './core/labels';
export { SmartDataGridError } from './core/errors';

/* ---- formatting utilities ---------------------------------------- */
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatRelativeTime,
  initials,
  statusColors,
} from './utils/format';
export { getByPath, setByPath, toText, toNumber, toDate, parseDateOnly, safeHref, deepMerge, mergeAll } from './utils';

/* ---- types ------------------------------------------------------- */
export type * from './types';
export type { DisplayRow, DataDisplayRow, GroupDisplayRow, DetailDisplayRow, TreeNode } from './core/rows';
export type { ResolvedColumns, HeaderCellNode, ColumnDefaults } from './core/columns';
export type { PageInfo, PageToken } from './core/paginate';
export type { PipelineInput, PipelineResult, ManualFlags } from './core/pipeline';
export type { ExportInput } from './export';
export type { SearchInput as SearchPipelineInput, HighlightChunk } from './core/search';
