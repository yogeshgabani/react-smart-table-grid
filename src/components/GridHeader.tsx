import * as React from 'react';
import type { CSSProperties } from 'react';
import type { HeaderContext, ResolvedColumn } from '../types';
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECT_COLUMN_ID } from '../core/columns';
import { getSortRule } from '../core/sort';
import { cx } from '../utils';
import { useGridContext } from './context';
import { Checkbox, MenuDivider, MenuItem, Popover, Button } from './primitives';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  GroupIcon,
  MoreIcon,
  PinIcon,
  SortIcon,
} from './icons';

/** Sticky offsets for a pinned column, mirrored under RTL. */
export function pinnedStyle<T>(column: ResolvedColumn<T>, rtl: boolean): CSSProperties {
  if (!column.pinned) return {};
  const offset = column.pinnedOffset ?? 0;
  if (column.pinned === 'left') return rtl ? { right: offset } : { left: offset };
  return rtl ? { left: offset } : { right: offset };
}

export function pinnedClass<T>(column: ResolvedColumn<T>): string | false {
  if (!column.pinned) return false;
  return cx(
    'sdg-cell--pinned',
    column.pinnedEdge && column.pinned === 'left' && 'sdg-cell--pinned-left-edge',
    column.pinnedEdge && column.pinned === 'right' && 'sdg-cell--pinned-right-edge',
  );
}

/* ------------------------------------------------------------------ *
 * Column menu
 * ------------------------------------------------------------------ */

function ColumnMenu<T>({ column }: { column: ResolvedColumn<T> }): React.JSX.Element {
  const { api, state, labels, props } = useGridContext<T>();
  const sort = getSortRule(state.sorting, column.id);

  return (
    <Popover
      align="start"
      label={labels.settings}
      trigger={(triggerProps) => (
        <Button
          {...triggerProps}
          icon
          size="xs"
          variant="ghost"
          aria-label={`${labels.settings}: ${column.id}`}
          onClick={(event) => {
            event.stopPropagation();
            triggerProps.onClick();
          }}
        >
          <MoreIcon size={14} />
        </Button>
      )}
    >
      {(close) => (
        <div role="menu">
          {column.sortable !== false && (
            <>
              <MenuItem
                icon={<ChevronUpIcon size={14} />}
                active={sort.direction === 'asc'}
                onClick={() => {
                  api.setSorting([{ id: column.id, direction: 'asc' }]);
                  close();
                }}
              >
                {labels.sortAsc}
              </MenuItem>
              <MenuItem
                icon={<ChevronDownIcon size={14} />}
                active={sort.direction === 'desc'}
                onClick={() => {
                  api.setSorting([{ id: column.id, direction: 'desc' }]);
                  close();
                }}
              >
                {labels.sortDesc}
              </MenuItem>
              {sort.direction && (
                <MenuItem
                  onClick={() => {
                    api.setSorting(state.sorting.filter((rule) => rule.id !== column.id));
                    close();
                  }}
                >
                  {labels.clearSort}
                </MenuItem>
              )}
              <MenuDivider />
            </>
          )}

          {column.pinnable !== false && (
            <>
              <MenuItem
                icon={<PinIcon size={14} />}
                active={column.pinned === 'left'}
                onClick={() => {
                  api.pinColumn(column.id, column.pinned === 'left' ? false : 'left');
                  close();
                }}
              >
                {column.pinned === 'left' ? labels.unpin : labels.pinLeft}
              </MenuItem>
              <MenuItem
                icon={<PinIcon size={14} style={{ transform: 'scaleX(-1)' }} />}
                active={column.pinned === 'right'}
                onClick={() => {
                  api.pinColumn(column.id, column.pinned === 'right' ? false : 'right');
                  close();
                }}
              >
                {column.pinned === 'right' ? labels.unpin : labels.pinRight}
              </MenuItem>
              <MenuDivider />
            </>
          )}

          {props.groupable && column.groupable !== false && (
            <MenuItem
              icon={<GroupIcon size={14} />}
              active={state.grouping.includes(column.id)}
              onClick={() => {
                api.setGrouping(
                  state.grouping.includes(column.id)
                    ? state.grouping.filter((id) => id !== column.id)
                    : [...state.grouping, column.id],
                );
                close();
              }}
            >
              {labels.groupBy}
            </MenuItem>
          )}

          {column.hideable !== false && (
            <MenuItem
              icon={<EyeIcon size={14} />}
              onClick={() => {
                api.toggleColumnVisibility(column.id, false);
                close();
              }}
            >
              Hide column
            </MenuItem>
          )}
        </div>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ *
 * Header cell
 * ------------------------------------------------------------------ */

interface HeaderCellProps<T> {
  column: ResolvedColumn<T>;
  colSpan: number;
  rowSpan: number;
  isGroup: boolean;
}

function HeaderCell<T>({ column, colSpan, rowSpan, isGroup }: HeaderCellProps<T>): React.JSX.Element {
  const ctx = useGridContext<T>();
  const { api, state, theme, labels, resize, drag, rtl, selection, pageSelectableIds, selectionMode } = ctx;

  const sort = getSortRule(state.sorting, column.id);
  const sortable = !isGroup && column.sortable !== false;
  const align = column.headerAlign ?? column.align ?? 'left';

  /* ---- selection header ------------------------------------------- */
  if (column.id === SELECT_COLUMN_ID) {
    const allSelected =
      pageSelectableIds.length > 0 && pageSelectableIds.every((id) => selection.has(id));
    const someSelected = pageSelectableIds.some((id) => selection.has(id));

    return (
      <th
        className={cx('sdg-th', 'sdg-th--align-center', pinnedClass(column))}
        style={pinnedStyle(column, rtl)}
        scope="col"
        aria-label="Select"
      >
        {selectionMode === 'multiple' && (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            variant={theme.ui.checkbox?.variant}
            size={theme.ui.checkbox?.size}
            aria-label="Select all rows on this page"
            onChange={() => api.selectAll('page')}
          />
        )}
      </th>
    );
  }

  if (column.id === EXPANDER_COLUMN_ID || column.id === ACTIONS_COLUMN_ID) {
    return (
      <th
        className={cx('sdg-th', pinnedClass(column))}
        style={pinnedStyle(column, rtl)}
        scope="col"
      >
        <span className="sdg-sr-only">{column.id === ACTIONS_COLUMN_ID ? 'Actions' : 'Expand'}</span>
      </th>
    );
  }

  /* ---- content ----------------------------------------------------- */
  const headerContext: HeaderContext<T> = {
    column,
    grid: api,
    sortDirection: sort.direction,
    sortIndex: sort.index,
  };

  const content =
    typeof column.header === 'function'
      ? (column.header as (ctx: HeaderContext<T>) => React.ReactNode)(headerContext)
      : (column.header ?? column.id);

  const dragHandlers = column.reorderable && !isGroup ? drag.handlers(column.id) : null;

  const ariaSort = sort.direction === 'asc' ? 'ascending' : sort.direction === 'desc' ? 'descending' : 'none';

  return (
    <th
      className={cx(
        'sdg-th',
        isGroup && 'sdg-th--group',
        align !== 'left' && `sdg-th--align-${align}`,
        sortable && 'sdg-th--sortable',
        sort.direction && 'sdg-th--sorted',
        drag.draggingId === column.id && 'sdg-th--dragging',
        drag.overId === column.id && drag.draggingId !== column.id && 'sdg-th--drag-over',
        pinnedClass(column),
        column.headerClassName,
      )}
      style={{ ...pinnedStyle(column, rtl), ...column.headerStyle }}
      colSpan={colSpan > 1 ? colSpan : undefined}
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
      scope="col"
      aria-sort={sortable ? ariaSort : undefined}
      onClick={
        sortable
          ? (event) => api.toggleSort(column.id, event.shiftKey || Boolean(ctx.props.multiSort))
          : undefined
      }
      onKeyDown={
        sortable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                api.toggleSort(column.id, event.shiftKey);
              }
            }
          : undefined
      }
      tabIndex={sortable ? 0 : undefined}
      {...dragHandlers}
    >
      <span className="sdg-th-inner">
        <span className="sdg-th-label" title={typeof content === 'string' ? content : undefined}>
          {content}
        </span>

        {sortable && (
          <span className="sdg-sort-icon">
            {sort.direction === 'asc' ? (
              <ChevronUpIcon size={14} />
            ) : sort.direction === 'desc' ? (
              <ChevronDownIcon size={14} />
            ) : (
              <SortIcon size={13} />
            )}
          </span>
        )}

        {sort.index > 0 && <span className="sdg-sort-index">{sort.index + 1}</span>}

        {!isGroup && ctx.props.filterable !== false && column.filterable && <ColumnMenu column={column} />}
      </span>

      {column.resizable && !isGroup && (
        <button
          type="button"
          className={cx('sdg-resizer', resize.columnId === column.id && 'sdg-resizer--active')}
          aria-label={`Resize ${column.id}`}
          onPointerDown={(event) => resize.start(event, column.id, column.computedWidth)}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => {
            event.stopPropagation();
            api.autoSizeColumn(column.id);
          }}
        />
      )}
    </th>
  );
}

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

export function GridHeader<T>(): React.JSX.Element {
  const { columns, theme, props } = useGridContext<T>();
  const ui = theme.ui.header ?? {};
  const sticky = props.stickyHeader ?? ui.sticky ?? true;

  return (
    <thead
      className={cx(
        'sdg-thead',
        sticky && 'sdg-thead--sticky',
        ui.border !== false && 'sdg-thead--bordered',
        ui.divider && 'sdg-thead--divided',
        ui.variant && ui.variant !== 'default' && `sdg-thead--${ui.variant}`,
        ui.className,
      )}
      style={ui.style}
    >
      {columns.headerRows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((node) => (
            <HeaderCell
              key={node.column.id}
              column={node.column}
              colSpan={node.colSpan}
              rowSpan={node.rowSpan}
              isGroup={!node.column.isLeaf}
            />
          ))}
        </tr>
      ))}
    </thead>
  );
}
