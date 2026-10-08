import * as React from 'react';
import type { CSSProperties } from 'react';
import type {
  ColumnDef,
  Density,
  ExportOptions,
  GridApi,
  GridRow,
  GridState,
  GridStateChangeMeta,
  GridTheme,
  PinPosition,
  ResolvedColumn,
  SelectAllScope,
  SelectionMode,
  SmartDataGridProps,
  SortingState,
  TreeConfig,
} from '../types';
import {
  ACTIONS_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  SELECT_COLUMN_ID,
  resolveColumns,
  type ColumnDefaults,
  type ResolvedColumns,
} from '../core/columns';
import { resolveActionsDisplay } from '../core/actions';
import { createFilterGroup } from '../core/filter';
import { getPageInfo, type PageInfo } from '../core/paginate';
import { runPipeline } from '../core/pipeline';
import { isDataRow, makeRowIdGetter, type DisplayRow } from '../core/rows';
import { toggleSorting } from '../core/sort';
import { warnOnce } from '../core/errors';
import { createDataSourceProvider } from '../data/provider';
import { runExport } from '../export';
import { getPreset } from '../presets';
import { resolveTheme } from '../theme/createGridTheme';
import { themeToCssVars } from '../theme/cssVars';
import { arrayMove, clamp, uniq } from '../utils';
import { useGridState } from './useGridState';
import { useDebounced, useElementWidth, usePrefersDark, usePrefersReducedMotion, useViewportWidth } from './useMedia';
import { useServerData } from './useServerData';

/* ------------------------------------------------------------------ *
 * Edit history
 * ------------------------------------------------------------------ */

interface EditEntry<T> {
  rowId: string;
  before: T | undefined;
  after: T;
}

/* ------------------------------------------------------------------ *
 * Instance
 * ------------------------------------------------------------------ */

export interface GridInstance<T = GridRow> {
  api: GridApi<T>;
  state: GridState;
  theme: GridTheme;
  cssVars: CSSProperties;
  columns: ResolvedColumns<T>;
  displayRows: DisplayRow<T>[];
  pageRows: T[];
  filteredRows: T[];
  allRows: T[];
  totalRows: number;
  aggregates: Record<string, unknown>;
  pageInfo: PageInfo;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  selection: Set<string>;
  selectionMode: SelectionMode;
  density: Density;
  isDark: boolean;
  reducedMotion: boolean;
  animations: boolean;
  getRowId: (row: T, index: number) => string;
  /** Stable per-instance id, for grouping form controls across rows. */
  instanceId: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  rootRef: React.RefObject<HTMLDivElement>;
  containerWidth: number;
  /** Props after the preset has been layered underneath. */
  props: SmartDataGridProps<T>;
  tree: TreeConfig<T> | null;
  /** Row ids selectable on the current page — for the header checkbox. */
  pageSelectableIds: string[];
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

export function useGrid<T = GridRow>(userProps: SmartDataGridProps<T>): GridInstance<T> {
  /* ---- preset merge ------------------------------------------------ */
  const props = React.useMemo(() => {
    const preset = getPreset<T>(userProps.preset);
    if (!userProps.preset) return userProps;
    const merged: Record<string, unknown> = { ...preset };
    for (const [key, value] of Object.entries(userProps)) {
      if (value !== undefined) merged[key] = value;
    }
    return merged as unknown as SmartDataGridProps<T>;
  }, [userProps]);

  const {
    data,
    columns: userColumns,
    getRowId: getRowIdProp,
    dataProvider,
    dataSource,
    manual,
    selectable = false,
    sortable = true,
    multiSort = false,
    searchable = false,
    searchDebounce = 300,
    searchMode = 'contains',
    filterable = false,
    resizable = false,
    reorderable = false,
    editable = false,
    expandable = false,
    tree: treeProp = false,
    pagination: paginationProp = false,
    rowActions,
    animations = true,
    darkMode = 'light',
    responsive = 'horizontal-scroll',
    infiniteScroll,
    isRowSelectable,
  } = props;

  /* ---- environment ------------------------------------------------- */
  const reactId = React.useId();
  const instanceId = props.id ?? reactId;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(scrollRef);
  const viewportWidth = useViewportWidth();
  const systemDark = usePrefersDark();
  const reducedMotion = usePrefersReducedMotion();

  /* ---- state ------------------------------------------------------- */
  const paginationConfig = React.useMemo(
    () => (typeof paginationProp === 'object' ? paginationProp : {}),
    [paginationProp],
  );
  const paginationEnabled = paginationProp !== false && paginationProp !== undefined;

  const defaultState = React.useMemo(() => {
    const base = { ...props.defaultState };
    if (paginationEnabled) {
      base.pagination = {
        pageIndex: paginationConfig.pageIndex ?? base.pagination?.pageIndex ?? 0,
        pageSize: paginationConfig.pageSize ?? base.pagination?.pageSize ?? 10,
        cursor: null,
      };
    }
    if (props.density) base.density = props.density;
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.defaultState, props.density, paginationEnabled, paginationConfig.pageSize, paginationConfig.pageIndex]);

  const plugins = props.plugins;

  const initState = React.useMemo(() => {
    const hooks = plugins?.filter((plugin) => plugin.initState);
    if (!hooks?.length) return undefined;
    return (initial: GridState) => hooks.reduce((next, plugin) => plugin.initState!(next), initial);
  }, [plugins]);

  const userOnStateChange = props.onStateChange;
  const onStateChange = React.useMemo(() => {
    const listeners = plugins?.filter((plugin) => plugin.onStateChange);
    if (!listeners?.length) return userOnStateChange;
    return (next: GridState, meta: GridStateChangeMeta) => {
      userOnStateChange?.(next, meta);
      for (const plugin of listeners) plugin.onStateChange!(next, meta);
    };
  }, [plugins, userOnStateChange]);

  const { state, setState, patch, reset } = useGridState({
    defaultState,
    state: props.state,
    onStateChange,
    urlState: props.urlState,
    persist: props.persist,
    initState,
  });

  const density = props.density ?? state.density;

  /* ---- row identity ------------------------------------------------ */
  const getRowId = React.useMemo(() => makeRowIdGetter<T>(getRowIdProp), [getRowIdProp]);

  /* ---- local edits ------------------------------------------------- */
  const [overrides, setOverrides] = React.useState<Map<string, T>>(() => new Map());
  const undoStack = React.useRef<EditEntry<T>[]>([]);
  const redoStack = React.useRef<EditEntry<T>[]>([]);
  const [historyVersion, setHistoryVersion] = React.useState(0);

  /* ---- server data ------------------------------------------------- */
  const provider = React.useMemo(() => {
    if (dataProvider) return dataProvider;
    if (dataSource) return createDataSourceProvider<T>(dataSource);
    return null;
  }, [dataProvider, dataSource]);

  const infinite = React.useMemo(
    () => (typeof infiniteScroll === 'object' ? infiniteScroll : infiniteScroll ? {} : null),
    [infiniteScroll],
  );
  const infiniteEnabled = Boolean(infinite && infinite.enabled !== false);

  const server = useServerData<T>({
    provider,
    state,
    append: infiniteEnabled,
    enabled: Boolean(provider),
  });

  const manualFlags = React.useMemo(() => {
    const serverDriven = Boolean(provider);
    if (typeof manual === 'object') {
      return {
        sorting: manual.sorting ?? serverDriven,
        filtering: manual.filtering ?? serverDriven,
        pagination: manual.pagination ?? serverDriven,
        search: manual.search ?? serverDriven,
      };
    }
    const flag = manual ?? serverDriven;
    return { sorting: flag, filtering: flag, pagination: flag, search: flag };
  }, [manual, provider]);

  /* ---- source rows ------------------------------------------------- */
  const rawRows = React.useMemo<T[]>(() => {
    const source = provider ? server.rows : (data ?? []);
    if (overrides.size === 0) return source;
    return source.map((row, index) => overrides.get(getRowId(row, index)) ?? row);
  }, [provider, server.rows, data, overrides, getRowId]);

  const allRows = React.useMemo(() => {
    if (!plugins?.length) return rawRows;
    return plugins.reduce(
      (rows, plugin) => (plugin.transform ? plugin.transform(rows, { state }) : rows),
      rawRows,
    );
  }, [rawRows, plugins, state]);

  /* ---- theme ------------------------------------------------------- */
  const theme = React.useMemo(
    () =>
      resolveTheme({
        theme: props.theme,
        ui: props.ui,
        density,
        colorMode: darkMode,
        systemDark,
      }),
    [props.theme, props.ui, density, darkMode, systemDark],
  );

  const cssVars = React.useMemo(() => themeToCssVars(theme), [theme]);

  /* ---- columns ----------------------------------------------------- */
  const selectionMode: SelectionMode =
    selectable === true ? 'multiple' : selectable === false ? 'none' : selectable;

  const columnDefs = React.useMemo(() => {
    let list: ColumnDef<T>[] = userColumns;

    if (plugins?.length) {
      list = plugins.reduce((cols, plugin) => (plugin.columns ? plugin.columns(cols) : cols), list);
    }

    // Leading columns are pinned left so the checkbox and expander stay put
    // while the grid scrolls horizontally. `resolveColumns` guarantees they
    // sort ahead of any column the user pinned.
    const prefix: ColumnDef<T>[] = [];
    if (selectionMode !== 'none') {
      prefix.push({
        id: SELECT_COLUMN_ID,
        header: '',
        width: 48,
        minWidth: 48,
        maxWidth: 48,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        resizable: false,
        reorderable: false,
        hideable: false,
        searchable: false,
        pinned: 'left',
        pinnable: false,
      });
    }
    if (expandable && !treeProp) {
      prefix.push({
        id: EXPANDER_COLUMN_ID,
        header: '',
        width: 44,
        minWidth: 44,
        maxWidth: 44,
        align: 'center',
        sortable: false,
        filterable: false,
        resizable: false,
        reorderable: false,
        hideable: false,
        searchable: false,
        pinned: 'left',
        pinnable: false,
      });
    }

    const suffix: ColumnDef<T>[] = [];
    if (rowActions?.length) {
      const display = resolveActionsDisplay(rowActions, theme.ui.actions?.display);
      suffix.push({
        id: ACTIONS_COLUMN_ID,
        header: '',
        width: theme.ui.actions?.width ?? (display === 'dropdown' || display === 'contextMenu' ? 56 : 110),
        minWidth: 48,
        align: 'right',
        sortable: false,
        filterable: false,
        resizable: false,
        reorderable: false,
        hideable: false,
        searchable: false,
        pinned: 'right',
      });
    }

    return [...prefix, ...list, ...suffix];
  }, [userColumns, plugins, selectionMode, expandable, treeProp, rowActions, theme.ui.actions]);

  const columnDefaults = React.useMemo<ColumnDefaults>(
    () => ({
      sortable,
      filterable,
      resizable,
      reorderable,
      editable,
      searchable: true,
      hideable: true,
      pinnable: true,
    }),
    [sortable, filterable, resizable, reorderable, editable],
  );

  const columns = React.useMemo(
    () =>
      resolveColumns<T>({
        columns: columnDefs,
        state,
        defaults: columnDefaults,
        containerWidth,
        viewportWidth,
        responsive,
      }),
    [columnDefs, state, columnDefaults, containerWidth, viewportWidth, responsive],
  );

  /* ---- pipeline ---------------------------------------------------- */
  const tree = React.useMemo<TreeConfig<T> | null>(() => {
    if (!treeProp) return null;
    return typeof treeProp === 'object' ? treeProp : {};
  }, [treeProp]);

  // Debounce only the *processing* of the query, never the input value itself,
  // so typing stays responsive on large datasets.
  const debouncedQuery = useDebounced(state.search.query, manualFlags.search ? 0 : searchDebounce);
  const pipelineState = React.useMemo<GridState>(
    () =>
      debouncedQuery === state.search.query
        ? state
        : { ...state, search: { ...state.search, query: debouncedQuery } },
    [state, debouncedQuery],
  );

  const pipeline = React.useMemo(
    () =>
      runPipeline<T>({
        data: allRows,
        state: pipelineState,
        allColumns: columns.all,
        visibleColumns: columns.visible,
        columnMap: columns.byId,
        manual: manualFlags,
        searchMode,
        getRowId,
        expandable: Boolean(expandable) && !tree,
        tree,
        serverRowCount: provider ? (server.total ?? props.rowCount) : props.rowCount,
        paginationEnabled: paginationEnabled && !infiniteEnabled,
      }),
    [
      allRows,
      pipelineState,
      columns,
      manualFlags,
      searchMode,
      getRowId,
      expandable,
      tree,
      provider,
      server.total,
      props.rowCount,
      paginationEnabled,
      infiniteEnabled,
    ],
  );

  const pageInfo = React.useMemo(
    () => getPageInfo(pipeline.pagination, pipeline.totalRows),
    [pipeline.pagination, pipeline.totalRows],
  );

  /* ---- selection --------------------------------------------------- */
  const selection = React.useMemo(() => new Set(state.selection), [state.selection]);

  // A disabled row's checkbox can't be ticked, so "select all" mustn't tick it either.
  const isRowDisabled = props.isRowDisabled;
  const canSelectRow = React.useCallback(
    (row: T, index: number) =>
      !(isRowSelectable && !isRowSelectable(row, index)) && !(isRowDisabled && isRowDisabled(row, index)),
    [isRowSelectable, isRowDisabled],
  );

  const pageSelectableIds = React.useMemo(() => {
    const ids: string[] = [];
    pipeline.displayRows.forEach((displayRow) => {
      if (!isDataRow(displayRow)) return;
      if (!canSelectRow(displayRow.row, displayRow.index)) return;
      ids.push(displayRow.id);
    });
    return ids;
  }, [pipeline.displayRows, canSelectRow]);

  const selectionRef = React.useRef(state.selection);
  selectionRef.current = state.selection;

  const onSelectionChangeRef = React.useRef(props.onSelectionChange);
  onSelectionChangeRef.current = props.onSelectionChange;

  const rowsByIdRef = React.useRef(new Map<string, T>());
  React.useMemo(() => {
    const map = new Map<string, T>();
    allRows.forEach((row, index) => map.set(getRowId(row, index), row));
    rowsByIdRef.current = map;
  }, [allRows, getRowId]);

  const emitSelection = React.useCallback((ids: string[]) => {
    const handler = onSelectionChangeRef.current;
    if (!handler) return;
    const rows = ids.map((id) => rowsByIdRef.current.get(id)).filter((row): row is T => row !== undefined);
    handler(rows, ids);
  }, []);

  const setSelection = React.useCallback(
    (ids: string[]) => {
      patch('selection', ids);
      emitSelection(ids);
    },
    [patch, emitSelection],
  );

  /* ---- stable refs for the API ------------------------------------- */
  const latest = React.useRef({
    state,
    pipeline,
    columns,
    theme,
    allRows,
    getRowId,
    props,
    pageSelectableIds,
    selectionMode,
    canSelectRow,
  });
  latest.current = {
    state,
    pipeline,
    columns,
    theme,
    allRows,
    getRowId,
    props,
    pageSelectableIds,
    selectionMode,
    canSelectRow,
  };

  /* ---- imperative API ---------------------------------------------- */
  const api = React.useMemo<GridApi<T>>(() => {
    const setSorting = (sorting: SortingState): void => {
      patch('sorting', sorting);
      latest.current.props.onSortChange?.(sorting);
    };

    const goToPage = (pageIndex: number): void => {
      const info = getPageInfo(latest.current.state.pagination, latest.current.pipeline.totalRows);
      const next = {
        ...latest.current.state.pagination,
        pageIndex: clamp(pageIndex, 0, info.pageCount - 1),
      };
      patch('pagination', next);
      latest.current.props.onPageChange?.(next);
    };

    return {
      getAllRows: () => latest.current.allRows,
      getFilteredRows: () => latest.current.pipeline.filteredRows,
      getPageRows: () => latest.current.pipeline.pageRows,
      getSelectedRows: () =>
        latest.current.state.selection
          .map((id) => rowsByIdRef.current.get(id))
          .filter((row): row is T => row !== undefined),
      getRowId: (row, index) => latest.current.getRowId(row, index),
      getColumns: () => latest.current.columns.all,
      getVisibleColumns: () => latest.current.columns.visible,
      getState: () => latest.current.state,
      setState: (updater) =>
        setState(typeof updater === 'function' ? updater : (prev) => ({ ...prev, ...updater })),
      resetState: reset,

      setSorting,
      toggleSort: (columnId, multi) => {
        setSorting(
          toggleSorting(latest.current.state.sorting, columnId, multi ?? Boolean(latest.current.props.multiSort)),
        );
      },
      clearSorting: () => setSorting([]),

      setFilters: (filters) => {
        patch('filters', filters);
        patch('pagination', { ...latest.current.state.pagination, pageIndex: 0 });
        latest.current.props.onFilterChange?.(filters);
      },
      addFilter: (condition, groupIndex = 0) => {
        const filters = latest.current.state.filters.slice();
        while (filters.length <= groupIndex) filters.push(createFilterGroup('AND'));
        filters[groupIndex] = {
          ...filters[groupIndex],
          conditions: [...filters[groupIndex].conditions, condition],
        };
        api.setFilters(filters);
      },
      removeFilter: (conditionId) => {
        const strip = (nodes: typeof latest.current.state.filters): typeof latest.current.state.filters =>
          nodes.map((group) => ({
            ...group,
            conditions: group.conditions
              .filter((node) => node.id !== conditionId)
              .map((node) =>
                'conditions' in node ? strip([node])[0] : node,
              ),
          }));
        api.setFilters(strip(latest.current.state.filters));
      },
      clearFilters: () => api.setFilters([]),

      setSearch: (query) => {
        patch('search', { ...latest.current.state.search, query });
        patch('pagination', { ...latest.current.state.pagination, pageIndex: 0 });
        latest.current.props.onSearchChange?.(query);
      },
      setColumnSearch: (columnId, query) => {
        patch('search', {
          ...latest.current.state.search,
          columns: { ...latest.current.state.search.columns, [columnId]: query },
        });
        patch('pagination', { ...latest.current.state.pagination, pageIndex: 0 });
      },
      clearSearch: () => patch('search', { query: '', columns: {} }),

      setPage: goToPage,
      nextPage: () => goToPage(latest.current.state.pagination.pageIndex + 1),
      previousPage: () => goToPage(latest.current.state.pagination.pageIndex - 1),
      firstPage: () => goToPage(0),
      lastPage: () => goToPage(Number.MAX_SAFE_INTEGER),
      setPageSize: (size) => {
        const next = { ...latest.current.state.pagination, pageSize: size, pageIndex: 0 };
        patch('pagination', next);
        latest.current.props.onPageChange?.(next);
      },
      getPageCount: () =>
        getPageInfo(latest.current.state.pagination, latest.current.pipeline.totalRows).pageCount,
      getRowCount: () => latest.current.pipeline.totalRows,

      selectRow: (rowId, selected) => {
        const current = selectionRef.current;
        const isSelected = current.includes(rowId);
        const shouldSelect = selected ?? !isSelected;
        if (shouldSelect === isSelected) return;
        if (latest.current.selectionMode === 'single') {
          setSelection(shouldSelect ? [rowId] : []);
          return;
        }
        setSelection(shouldSelect ? [...current, rowId] : current.filter((id) => id !== rowId));
      },
      toggleRow: (rowId) => api.selectRow(rowId),
      selectAll: (scope: SelectAllScope = 'page') => {
        const { selectionMode: mode, pageSelectableIds: pageIds, canSelectRow: canSelect } = latest.current;
        if (mode !== 'multiple') return;

        let source = pageIds;
        if (scope !== 'page') {
          const rows = scope === 'filtered' ? latest.current.pipeline.filteredRows : latest.current.allRows;
          source = [];
          rows.forEach((row, index) => {
            if (canSelect(row, index)) source.push(latest.current.getRowId(row, index));
          });
        }

        // Sets, not `includes()` — "select all filtered" over 100K rows would
        // otherwise be quadratic and freeze the tab.
        const current = selectionRef.current;
        const selected = new Set(current);
        const allSelected = source.length > 0 && source.every((id) => selected.has(id));
        if (allSelected) {
          const remove = new Set(source);
          setSelection(current.filter((id) => !remove.has(id)));
        } else {
          setSelection(uniq([...current, ...source]));
        }
      },
      clearSelection: () => setSelection([]),
      isRowSelected: (rowId) => selectionRef.current.includes(rowId),

      toggleColumnVisibility: (columnId, visible) => {
        const current = latest.current.state.columnVisibility;
        const isVisible = current[columnId] ?? !latest.current.columns.byId.get(columnId)?.hidden;
        const next = { ...current, [columnId]: visible ?? !isVisible };
        patch('columnVisibility', next);
        latest.current.props.onColumnVisibilityChange?.(next);
      },
      setColumnOrder: (order) => {
        patch('columnOrder', order);
        latest.current.props.onColumnOrderChange?.(order);
      },
      moveColumn: (columnId, toIndex) => {
        const order =
          latest.current.state.columnOrder.length > 0
            ? latest.current.state.columnOrder
            : latest.current.columns.all.map((column) => column.id);
        const from = order.indexOf(columnId);
        if (from === -1) return;
        api.setColumnOrder(arrayMove(order, from, toIndex));
      },
      resizeColumn: (columnId, width) => {
        const column = latest.current.columns.byId.get(columnId);
        const next = {
          ...latest.current.state.columnSizing,
          [columnId]: clamp(width, column?.minWidth ?? 60, column?.maxWidth ?? Number.MAX_SAFE_INTEGER),
        };
        patch('columnSizing', next);
        latest.current.props.onColumnResize?.(columnId, next[columnId]);
      },
      autoSizeColumn: (columnId) => {
        const next = { ...latest.current.state.columnSizing };
        delete next[columnId];
        patch('columnSizing', next);
      },
      pinColumn: (columnId, position: PinPosition) => {
        const pinning = latest.current.state.columnPinning;
        const next = {
          left: pinning.left.filter((id) => id !== columnId),
          right: pinning.right.filter((id) => id !== columnId),
        };
        if (position === 'left') next.left = [...next.left, columnId];
        if (position === 'right') next.right = [columnId, ...next.right];
        patch('columnPinning', next);
      },
      resetColumns: () => {
        setState(
          (prev) => ({
            ...prev,
            columnVisibility: {},
            columnOrder: [],
            columnSizing: {},
            columnPinning: { left: [], right: [] },
          }),
          { key: 'columnOrder' },
        );
      },

      toggleExpanded: (rowId, expanded) => {
        const current = latest.current.state.expanded;
        const isExpanded = current.includes(rowId);
        const shouldExpand = expanded ?? !isExpanded;
        if (shouldExpand === isExpanded) return;
        const next = shouldExpand ? [...current, rowId] : current.filter((id) => id !== rowId);
        patch('expanded', next);
        latest.current.props.onExpandedChange?.(next);
      },
      expandAll: () => {
        const ids = latest.current.pipeline.filteredRows.map((row, index) =>
          latest.current.getRowId(row, index),
        );
        patch('expanded', ids);
        latest.current.props.onExpandedChange?.(ids);
      },
      collapseAll: () => {
        patch('expanded', []);
        latest.current.props.onExpandedChange?.([]);
      },
      isExpanded: (rowId) => latest.current.state.expanded.includes(rowId),

      setGrouping: (grouping) => patch('grouping', grouping),

      startEditing: (rowId, columnId) => patch('editing', { rowId, columnId }),
      stopEditing: () => patch('editing', null),

      updateRow: (rowId, changes) => {
        const existing = rowsByIdRef.current.get(rowId);
        if (!existing) {
          warnOnce('update-unknown-row', `updateRow() called with an unknown row id "${rowId}".`);
          return;
        }
        const next = { ...existing, ...changes } as T;
        undoStack.current.push({ rowId, before: existing, after: next });
        redoStack.current = [];
        setOverrides((prev) => new Map(prev).set(rowId, next));
        setHistoryVersion((version) => version + 1);
      },
      undo: () => {
        const entry = undoStack.current.pop();
        if (!entry) return;
        redoStack.current.push(entry);
        setOverrides((prev) => {
          const next = new Map(prev);
          if (entry.before === undefined) next.delete(entry.rowId);
          else next.set(entry.rowId, entry.before);
          return next;
        });
        setHistoryVersion((version) => version + 1);
      },
      redo: () => {
        const entry = redoStack.current.pop();
        if (!entry) return;
        undoStack.current.push(entry);
        setOverrides((prev) => new Map(prev).set(entry.rowId, entry.after));
        setHistoryVersion((version) => version + 1);
      },
      canUndo: () => undoStack.current.length > 0,
      canRedo: () => redoStack.current.length > 0,

      setDensity: (value) => patch('density', value),
      toggleFullscreen: (on) => patch('fullscreen', on ?? !latest.current.state.fullscreen),

      exportData: async (options: ExportOptions<T> = {}) => {
        const scope = options.scope ?? 'filtered';
        const rows =
          scope === 'page'
            ? latest.current.pipeline.pageRows
            : scope === 'selected'
              ? api.getSelectedRows()
              : scope === 'all'
                ? latest.current.allRows
                : latest.current.pipeline.filteredRows;

        latest.current.props.onExport?.(options);
        await runExport<T>({
          rows,
          columns: latest.current.columns.visible,
          options,
          title: options.title ?? (typeof latest.current.props.toolbar === 'object'
            ? String(latest.current.props.toolbar.title ?? 'Export')
            : 'Export'),
        });
      },

      refresh: () => {
        latest.current.props.onRefresh?.();
        server.refetch();
      },
      scrollToRow: (index) => {
        const node = scrollRef.current;
        if (!node) return;
        const rowHeight = latest.current.theme.sizing.rowHeight;
        node.scrollTo({ top: index * rowHeight, behavior: 'smooth' });
      },
      scrollToTop: () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),

      getTheme: () => latest.current.theme,
    };
    // `latest` keeps every closure fresh, so the API object stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch, setState, reset, setSelection, server.refetch]);

  /* ---- plugin lifecycle -------------------------------------------- */
  React.useEffect(() => {
    if (!plugins?.length) return undefined;
    const cleanups = plugins.map((plugin) => plugin.onMount?.({ grid: api })).filter(Boolean);
    return () => {
      for (const cleanup of cleanups) (cleanup as () => void)();
    };
  }, [plugins, api]);

  React.useEffect(() => {
    props.onReady?.(api);
    // Fire once per api identity — the api is stable for the grid's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  /* ---- derived ----------------------------------------------------- */
  // An object here only styles the loading state (`{ variant: 'overlay' }`);
  // it must not pin the grid in a permanent loading state.
  const loading = props.loading === true || server.loading;
  const error = React.useMemo(() => {
    if (props.error) return props.error instanceof Error ? props.error : new Error(String(props.error));
    return server.error;
  }, [props.error, server.error]);

  void historyVersion; // re-render trigger for canUndo/canRedo consumers

  return {
    api,
    state,
    theme,
    cssVars,
    columns,
    displayRows: pipeline.displayRows,
    pageRows: pipeline.pageRows,
    filteredRows: pipeline.filteredRows,
    allRows,
    totalRows: pipeline.totalRows,
    aggregates: server.aggregates ?? pipeline.aggregates,
    pageInfo,
    loading,
    error,
    hasMore: infinite?.hasMore ?? server.hasMore,
    loadMore: infinite?.loadMore ?? server.loadMore,
    selection,
    selectionMode,
    density,
    isDark: theme.mode === 'dark',
    reducedMotion,
    animations: animations && !reducedMotion,
    getRowId,
    instanceId,
    scrollRef,
    rootRef,
    containerWidth,
    props,
    tree,
    pageSelectableIds,
  };
}
