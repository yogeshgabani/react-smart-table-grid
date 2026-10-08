/**
 * Headless entry — the data engine with no UI.
 *
 * Everything here is pure: give it rows, columns and state, get rows back.
 * Nothing in this module imports React DOM or the stylesheet.
 */
export { useGrid } from '../hooks/useGrid';
export type { GridInstance } from '../hooks/useGrid';
export { useGridState } from '../hooks/useGridState';
export { useServerData } from '../hooks/useServerData';
export { useVirtualizer, useInfiniteScroll, useScrollState } from '../hooks/useVirtualizer';

export { runPipeline } from '../core/pipeline';
export { sortRows, compareValues, toggleSorting, serializeSorting, parseSorting, getSortRule } from '../core/sort';
export { searchRows, fuzzyScore, matchesTerm, highlightChunks } from '../core/search';
export {
  filterRows,
  evaluateOperator,
  evaluateNode,
  isFilterGroup,
  countConditions,
  createFilterGroup,
  defaultOperator,
  inferFilterType,
  collectOptions,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  UNARY_OPERATORS,
} from '../core/filter';
export { paginateRows, getPageCount, getPageInfo, getPageTokens, clampPage } from '../core/paginate';
export { aggregateColumn, aggregateColumns, runAggregate } from '../core/aggregate';
export { resolveColumns, SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID, isSystemColumn } from '../core/columns';
export { buildTree, flattenTree, buildGroupedRows, toDisplayRows, makeRowIdGetter, isDataRow } from '../core/rows';
export { createInitialState, mergeControlled } from '../core/state';
export { SmartDataGridError } from '../core/errors';
export { getByPath, setByPath, toText, toNumber, toDate, deepMerge, mergeAll } from '../utils';
export type * from '../types';
