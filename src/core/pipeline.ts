import type { GridState, ResolvedColumn, SearchMode, TreeConfig } from '../types';
import { aggregateColumns } from './aggregate';
import { filterRows } from './filter';
import { clampPage, paginateRows } from './paginate';
import {
  buildGroupedRows,
  buildTree,
  flattenTree,
  toDisplayRows,
  type DisplayRow,
} from './rows';
import { searchRows } from './search';
import { sortRows } from './sort';

export interface ManualFlags {
  sorting: boolean;
  filtering: boolean;
  pagination: boolean;
  search: boolean;
}

export interface PipelineInput<T> {
  data: T[];
  state: GridState;
  /** All leaf columns, including hidden ones — filters can target hidden columns. */
  allColumns: ResolvedColumn<T>[];
  visibleColumns: ResolvedColumn<T>[];
  columnMap: Map<string, ResolvedColumn<T>>;
  manual: ManualFlags;
  searchMode: SearchMode;
  getRowId: (row: T, index: number) => string;
  expandable: boolean;
  tree?: TreeConfig<T> | null;
  /** Server-reported total. Overrides the client-side count when provided. */
  serverRowCount?: number;
  paginationEnabled: boolean;
}

export interface PipelineResult<T> {
  /** After search + filters, before sorting and pagination. */
  filteredRows: T[];
  /** After sorting. */
  sortedRows: T[];
  /** The slice belonging to the current page. */
  pageRows: T[];
  /** Flat list the body renders. */
  displayRows: DisplayRow<T>[];
  /** Total the pagination UI reports. */
  totalRows: number;
  /** Footer aggregates, computed over the filtered set. */
  aggregates: Record<string, unknown>;
  /** Pagination after bounds-clamping. */
  pagination: GridState['pagination'];
}

/**
 * The single place data flows through: search → filter → sort → shape → page.
 * Every stage can be delegated to the server via `manual` flags, in which case
 * the stage is skipped and the incoming data is used as-is.
 */
export function runPipeline<T>(input: PipelineInput<T>): PipelineResult<T> {
  const {
    data,
    state,
    allColumns,
    visibleColumns,
    columnMap,
    manual,
    searchMode,
    getRowId,
    expandable,
    tree,
    serverRowCount,
    paginationEnabled,
  } = input;

  /* 1. search ------------------------------------------------------- */
  let rows = manual.search
    ? data
    : searchRows({ rows: data, search: state.search, columns: allColumns, mode: searchMode });

  /* 2. filter ------------------------------------------------------- */
  if (!manual.filtering) {
    rows = filterRows(rows, state.filters, columnMap);
  }

  const filteredRows = rows;

  /* 3. sort --------------------------------------------------------- */
  const sortedRows = manual.sorting ? filteredRows : sortRows(filteredRows, state.sorting, columnMap);

  /* 4. totals + page bounds ----------------------------------------- */
  const totalRows = serverRowCount ?? sortedRows.length;
  const pagination = paginationEnabled
    ? clampPage(state.pagination, totalRows)
    : state.pagination;

  /* 5. paginate ----------------------------------------------------- */
  const pageRows =
    !paginationEnabled || manual.pagination ? sortedRows : paginateRows(sortedRows, pagination);

  /* 6. shape into display rows -------------------------------------- */
  const expandedSet = new Set(state.expanded);
  const aggregateColumnList = visibleColumns.filter((column) => column.aggregate);

  let displayRows: DisplayRow<T>[];

  if (tree) {
    const nodes = buildTree(pageRows, tree, getRowId);
    displayRows = flattenTree(nodes, expandedSet);
  } else if (state.grouping.length > 0) {
    displayRows = buildGroupedRows({
      rows: pageRows,
      grouping: state.grouping,
      columns: columnMap,
      aggregateColumnList,
      expanded: expandedSet,
      getRowId,
    });
  } else {
    const offset =
      paginationEnabled && !manual.pagination ? pagination.pageIndex * pagination.pageSize : 0;
    displayRows = toDisplayRows(pageRows, getRowId, expandedSet, expandable, offset);
  }

  return {
    filteredRows,
    sortedRows,
    pageRows,
    displayRows,
    totalRows,
    aggregates: aggregateColumns(filteredRows, aggregateColumnList),
    pagination,
  };
}
