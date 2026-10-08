import * as React from 'react';
import type {
  GridRow,
  LoadingSlot,
  PaginationConfig,
  SmartDataGridProps,
  ToolbarConfig,
  VirtualizationConfig,
} from '../types';
import { isDataRow } from '../core/rows';
import { defaultLabels } from '../core/labels';
import { countConditions } from '../core/filter';
import { cx, mergeAll, px } from '../utils';
import { useGrid } from '../hooks/useGrid';
import { useGridStyles } from '../hooks/useStyles';
import { useColumnDrag, useColumnResize } from '../hooks/useColumnInteractions';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useInfiniteScroll, useScrollState, useVirtualizer } from '../hooks/useVirtualizer';
import { useMediaQuery } from '../hooks/useMedia';
import { GridProvider, type GridContextValue } from './context';
import { GridHeader } from './GridHeader';
import { GridBody } from './GridBody';
import { GridFooter } from './GridFooter';
import { Pagination } from './Pagination';
import { SelectionBar, Toolbar } from './Toolbar';
import { EmptyState, ErrorState, LoadingOverlay, LoadingState } from './States';
import { CardView } from './CardView';
import { LiveRegion, Button } from './primitives';

export interface SmartDataGridExtraProps {
  /** Set to false when the app imports `react-smart-table-grid/styles.css` itself. */
  injectStyles?: boolean;
}

function SmartDataGridInner<T = GridRow>(
  props: SmartDataGridProps<T> & SmartDataGridExtraProps,
): React.JSX.Element {
  const { injectStyles = true } = props;
  useGridStyles(injectStyles);

  const instance = useGrid<T>(props);
  const {
    api,
    state,
    theme,
    cssVars,
    columns,
    displayRows,
    loading,
    error,
    totalRows,
    scrollRef,
    rootRef,
    animations,
    hasMore,
    loadMore,
    props: resolved,
  } = instance;

  const rtl = (resolved.dir ?? 'ltr') === 'rtl';
  const isSmallScreen = useMediaQuery('(max-width: 640px)');

  const labels = React.useMemo(
    () => mergeAll(defaultLabels, resolved.labels),
    [resolved.labels],
  );

  /* ---- column interactions ----------------------------------------- */
  const columnOrder = React.useMemo(() => columns.all.map((column) => column.id), [columns.all]);
  const resize = useColumnResize<T>(api, rtl);
  const drag = useColumnDrag<T>(api, columnOrder);

  /* ---- keyboard ----------------------------------------------------- */
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const rowIds = React.useMemo(
    () => displayRows.filter(isDataRow).map((row) => row.id),
    [displayRows],
  );
  const columnIds = React.useMemo(() => columns.visible.map((column) => column.id), [columns.visible]);

  const { focusedCell, setFocusedCell } = useKeyboardNav<T>({
    enabled: resolved.keyboard !== false,
    api,
    rootRef,
    rowIds,
    columnIds,
    editable: Boolean(resolved.editable),
    shortcuts: resolved.shortcuts,
    onFocusSearch: () => searchRef.current?.focus(),
    rtl,
  });

  /* ---- announcements ------------------------------------------------ */
  const [announcement, setAnnouncement] = React.useState('');
  const announce = React.useCallback((message: string) => setAnnouncement(message), []);

  React.useEffect(() => {
    if (loading) return;
    announce(`${totalRows} ${labels.pagination.results}`);
  }, [totalRows, loading, announce, labels.pagination.results]);

  /* ---- virtualization ----------------------------------------------- */
  const virtualConfig = React.useMemo<VirtualizationConfig>(
    () => (typeof resolved.virtualized === 'object' ? resolved.virtualized : {}),
    [resolved.virtualized],
  );
  // Virtualization is opt-in, and even then only kicks in past the threshold —
  // windowing 20 rows costs more than it saves.
  const virtualEnabled = React.useMemo(() => {
    if (!resolved.virtualized) return false;
    if (typeof resolved.virtualized === 'object' && resolved.virtualized.enabled === false) return false;
    return displayRows.length > (virtualConfig.threshold ?? 0);
  }, [resolved.virtualized, virtualConfig.threshold, displayRows.length]);

  const virtual = useVirtualizer({
    count: displayRows.length,
    scrollRef,
    rowHeight: virtualConfig.rowHeight ?? theme.sizing.rowHeight,
    overscan: virtualConfig.overscan ?? 8,
    enabled: virtualEnabled,
  });

  const visibleRows = virtualEnabled ? displayRows.slice(virtual.start, virtual.end) : displayRows;

  /* ---- infinite scroll ---------------------------------------------- */
  const infiniteConfig =
    typeof resolved.infiniteScroll === 'object' ? resolved.infiniteScroll : null;
  const infiniteEnabled = Boolean(resolved.infiniteScroll) && infiniteConfig?.enabled !== false;

  useInfiniteScroll({
    scrollRef,
    enabled: infiniteEnabled,
    hasMore,
    loading,
    threshold: infiniteConfig?.threshold ?? 240,
    onLoadMore: loadMore,
  });

  const scrollState = useScrollState(scrollRef);

  /* ---- context ------------------------------------------------------ */
  const contextValue = React.useMemo<GridContextValue<T>>(
    () => ({
      ...instance,
      labels,
      resize,
      drag,
      rtl,
      highlight: resolved.highlightSearch ? state.search.query.trim() || undefined : undefined,
      focusedCell,
      setFocusedCell,
      announce,
    }),
    [instance, labels, resize, drag, rtl, resolved.highlightSearch, state.search.query, focusedCell, setFocusedCell, announce],
  );

  /* ---- slots -------------------------------------------------------- */
  const toolbarConfig = React.useMemo<ToolbarConfig<T> | null>(() => {
    if (resolved.toolbar === false) return null;
    const explicit = typeof resolved.toolbar === 'object' ? resolved.toolbar : {};
    // `toolbar` alone turns every standard button on. Otherwise the buttons
    // follow the feature flags, and an object only adds to or overrides them —
    // `toolbar={{ refresh: true }}` must not also conjure Filter and Export.
    const inferred: ToolbarConfig<T> =
      resolved.toolbar === true
        ? { search: true, filter: true, columns: true, export: true }
        : {
            search: Boolean(resolved.searchable),
            filter: Boolean(resolved.filterable),
            columns: Boolean(resolved.resizable || resolved.reorderable),
            export: Boolean(resolved.exportable),
          };
    const config = { ...inferred, ...explicit };
    const hasAnything =
      config.search ||
      config.filter ||
      config.columns ||
      config.export ||
      config.refresh ||
      config.density ||
      config.fullscreen ||
      config.settings ||
      config.addRow ||
      config.title ||
      config.start ||
      config.end ||
      config.render ||
      resolved.plugins?.some((plugin) => plugin.toolbar) ||
      resolved.editable;
    return hasAnything ? config : null;
  }, [resolved]);

  const paginationConfig = React.useMemo<PaginationConfig | null>(() => {
    if (!resolved.pagination) return null;
    return typeof resolved.pagination === 'object' ? resolved.pagination : {};
  }, [resolved.pagination]);

  const loadingSlot = React.useMemo<LoadingSlot>(
    () =>
      mergeAll(
        theme.ui.loading ?? {},
        typeof resolved.loading === 'object' ? resolved.loading : {},
      ),
    [theme.ui.loading, resolved.loading],
  );

  /* ---- derived flags ------------------------------------------------ */
  const responsive = resolved.responsive ?? 'horizontal-scroll';
  const useCards = (responsive === 'card' && isSmallScreen) || responsive === 'card';
  const isEmpty = displayRows.length === 0;
  const hasFilters = countConditions(state.filters) > 0;
  const hasSearch = state.search.query.trim().length > 0;
  const showSkeleton = loading && isEmpty;
  const overlayLoading = loading && !isEmpty;

  const tableUi = theme.ui.table ?? {};
  const rootStyle: React.CSSProperties = {
    ...cssVars,
    ...(resolved.height ? { height: px(resolved.height) } : null),
    ...(resolved.maxHeight ? { maxHeight: px(resolved.maxHeight) } : null),
    ...tableUi.style,
    ...resolved.style,
  };

  const body = (
    <>
      {toolbarConfig && (
        <Toolbar<T> config={toolbarConfig} searchRef={searchRef} isSmallScreen={isSmallScreen} />
      )}

      <SelectionBar<T> />

      {paginationConfig && <Pagination config={paginationConfig} position="top" />}

      <div
        ref={scrollRef}
        className={cx(
          'sdg-scroll',
          theme.ui.scrollbar?.autoHide && 'sdg-scroll--autohide',
          scrollState.scrolledX && 'sdg-scroll--scrolled-x',
          scrollState.scrollableX && 'sdg-scroll--scrollable-x',
        )}
        style={{
          maxHeight: px(tableUi.maxHeight),
          height: resolved.height ? undefined : px(tableUi.height),
          overflowX: responsive === 'horizontal-scroll' ? 'auto' : undefined,
        }}
      >
        {overlayLoading && <LoadingOverlay slot={loadingSlot} />}

        {useCards ? (
          isEmpty && !loading ? (
            <div className="sdg-state">
              <span className="sdg-state-title">{labels.noResults}</span>
            </div>
          ) : (
            <CardView<T> />
          )
        ) : (
          <table
            className={cx(
              'sdg-table',
              tableUi.layout === 'auto' && 'sdg-table--auto',
              theme.borders.columnBorder && 'sdg-table--column-borders',
              tableUi.className,
            )}
            style={{ minWidth: px(tableUi.minWidth) ?? columns.totalWidth }}
            role="grid"
            aria-rowcount={totalRows}
            aria-colcount={columns.visible.length}
            aria-busy={loading || undefined}
            aria-label={resolved['aria-label'] ?? 'Data grid'}
          >
            <colgroup>
              {columns.visible.map((column) => (
                <col key={column.id} style={{ width: column.computedWidth }} />
              ))}
            </colgroup>

            <GridHeader<T> />

            {error ? (
              <ErrorState
                slot={mergeAll(theme.ui.errorState ?? {}, resolved.errorState)}
                columnCount={columns.visible.length}
                error={error}
              />
            ) : showSkeleton ? (
              <LoadingState slot={loadingSlot} columnCount={columns.visible.length} />
            ) : isEmpty ? (
              <EmptyState
                slot={mergeAll(theme.ui.emptyState ?? {}, resolved.emptyState)}
                columnCount={columns.visible.length}
                filtered={hasFilters}
                searched={hasSearch}
              />
            ) : (
              <GridBody<T>
                rows={visibleRows}
                paddingTop={virtualEnabled ? virtual.paddingTop : 0}
                paddingBottom={virtualEnabled ? virtual.paddingBottom : 0}
              />
            )}

            {resolved.showFooter !== false && <GridFooter<T> />}
          </table>
        )}

        {infiniteEnabled && (
          <div className="sdg-infinite-sentinel">
            {infiniteConfig?.error ? (
              <>
                <span>{infiniteConfig.error.message}</span>
                <Button size="sm" onClick={() => loadMore()}>
                  {infiniteConfig.retryLabel ?? labels.retry}
                </Button>
              </>
            ) : loading ? (
              (infiniteConfig?.loader ?? (
                <>
                  <span className="sdg-spinner" />
                  <span>{labels.loading}</span>
                </>
              ))
            ) : hasMore ? (
              <Button size="sm" onClick={() => loadMore()}>
                Load more
              </Button>
            ) : (
              (infiniteConfig?.endMessage ?? <span>No more results</span>)
            )}
          </div>
        )}
      </div>

      {paginationConfig && <Pagination config={paginationConfig} position="bottom" />}

      <LiveRegion message={announcement} />
    </>
  );

  return (
    <GridProvider value={contextValue as GridContextValue<GridRow>}>
      <div
        ref={rootRef}
        id={resolved.id}
        dir={resolved.dir}
        data-theme={theme.mode}
        data-density={instance.density}
        className={cx(
          'sdg-root',
          theme.borders.outerBorder && 'sdg-root--bordered',
          state.fullscreen && 'sdg-root--fullscreen',
          tableUi.variant && tableUi.variant !== 'default' && `sdg-root--${tableUi.variant}`,
          responsive === 'stacked' && 'sdg-root--responsive-stacked',
          !animations && 'sdg-root--no-animation',
          resolved.className,
        )}
        style={rootStyle}
        tabIndex={-1}
      >
        {/* Headless mode renders only `children`; otherwise children append
            below the grid so consumers can drop in extra chrome. */}
        {!resolved.headless && body}
        {typeof resolved.children === 'function' ? resolved.children({ grid: api }) : resolved.children}
      </div>
    </GridProvider>
  );
}

/**
 * One Smart Data Grid. Any Data. Any UI.
 *
 * ```tsx
 * <SmartDataGrid data={users} columns={columns} />
 * ```
 */
export const SmartDataGrid = React.memo(SmartDataGridInner) as typeof SmartDataGridInner;
