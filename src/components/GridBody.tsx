import * as React from 'react';
import type { CellContext, ResolvedColumn } from '../types';
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECT_COLUMN_ID } from '../core/columns';
import {
  collapsedGroupKey,
  isDataRow,
  type DataDisplayRow,
  type DisplayRow,
  type GroupDisplayRow,
} from '../core/rows';
import { cx, toText } from '../utils';
import { useGridContext } from './context';
import { pinnedClass, pinnedStyle } from './GridHeader';
import { Checkbox, Radio } from './primitives';
import { ChevronRightIcon } from './icons';
import { resolveActionsDisplay } from '../core/actions';
import { Highlight, RowActions, formatAggregate, renderCellType } from './cells';
import { CellEditor } from './CellEditor';

/* ------------------------------------------------------------------ *
 * Cell
 * ------------------------------------------------------------------ */

interface GridCellProps<T> {
  column: ResolvedColumn<T>;
  displayRow: DataDisplayRow<T>;
  columnIndex: number;
  isSelected: boolean;
  disabled: boolean;
}

function GridCellInner<T>({
  column,
  displayRow,
  columnIndex,
  isSelected,
  disabled,
}: GridCellProps<T>): React.JSX.Element {
  const ctx = useGridContext<T>();
  const {
    api,
    state,
    theme,
    rtl,
    props,
    highlight,
    tree,
    focusedCell,
    setFocusedCell,
    selectionMode,
    instanceId: gridId,
  } = ctx;
  const { row, index, id: rowId } = displayRow;

  const isEditing =
    state.editing?.rowId === rowId && state.editing.columnId === column.id;

  const align = column.align ?? theme.ui.cell?.align ?? 'left';

  /* ---- selection cell ---------------------------------------------- */
  if (column.id === SELECT_COLUMN_ID) {
    const selectable = props.isRowSelectable ? props.isRowSelectable(row, index) : true;
    return (
      <td
        className={cx('sdg-td', 'sdg-td--align-center', pinnedClass(column))}
        style={pinnedStyle(column, rtl)}
        onClick={(event) => event.stopPropagation()}
      >
        {selectable &&
          (selectionMode === 'single' ? (
            <Radio
              checked={isSelected}
              disabled={disabled}
              name={`${gridId}-selection`}
              size={theme.ui.checkbox?.size}
              aria-label={`Select row ${index + 1}`}
              onChange={() => api.selectRow(rowId, true)}
            />
          ) : (
            <Checkbox
              checked={isSelected}
              disabled={disabled}
              variant={theme.ui.checkbox?.variant}
              size={theme.ui.checkbox?.size}
              aria-label={`Select row ${index + 1}`}
              onChange={() => api.selectRow(rowId)}
            />
          ))}
      </td>
    );
  }

  /* ---- expander cell ------------------------------------------------ */
  if (column.id === EXPANDER_COLUMN_ID) {
    return (
      <td
        className={cx('sdg-td', 'sdg-td--align-center', pinnedClass(column))}
        style={pinnedStyle(column, rtl)}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={cx('sdg-expander', displayRow.expanded && 'sdg-expander--open')}
          aria-expanded={displayRow.expanded}
          aria-label={displayRow.expanded ? 'Collapse row' : 'Expand row'}
          onClick={() => api.toggleExpanded(rowId)}
        >
          <ChevronRightIcon size={14} />
        </button>
      </td>
    );
  }

  /* ---- actions cell -------------------------------------------------- */
  if (column.id === ACTIONS_COLUMN_ID) {
    return (
      <td
        className={cx('sdg-td', 'sdg-td--align-right', pinnedClass(column))}
        style={pinnedStyle(column, rtl)}
        onClick={(event) => event.stopPropagation()}
      >
        <RowActions
          actions={props.rowActions ?? []}
          row={row}
          rowId={rowId}
          rowIndex={index}
          grid={api}
          display={resolveActionsDisplay(props.rowActions ?? [], theme.ui.actions?.display)}
          showOnHover={theme.ui.actions?.showOnHover}
        />
      </td>
    );
  }

  /* ---- data cell ----------------------------------------------------- */
  const value = column.getValue(row, index);

  const cellContext: CellContext<T> = {
    value,
    row,
    rowId,
    rowIndex: index,
    column,
    grid: api,
    isSelected,
    isExpanded: displayRow.expanded,
    isEditing,
    highlight,
  };

  let content: React.ReactNode;

  if (isEditing) {
    content = <CellEditor column={column} row={row} rowId={rowId} rowIndex={index} />;
  } else if (column.cell) {
    content = column.cell(cellContext);
  } else if (column.type) {
    const formatted = column.format ? column.format(value, row) : undefined;
    content =
      renderCellType(
        column.type,
        formatted === undefined ? cellContext : { ...cellContext, value: formatted },
        column.cellOptions,
      ) ?? null;
  } else {
    const text = column.format ? column.format(value, row) : toText(value);
    content = highlight ? <Highlight text={text} query={highlight} /> : text;
  }

  /* ---- tree indentation + expander ----------------------------------- */
  const expanderColumnId = tree?.expanderColumn;
  const isTreeColumn =
    Boolean(tree) &&
    (expanderColumnId ? column.id === expanderColumnId : columnIndex === firstDataColumnIndex(ctx));

  if (isTreeColumn) {
    const indent = (tree?.indent ?? 18) * displayRow.depth;
    content = (
      <span className="sdg-tree-cell" style={{ paddingInlineStart: indent }}>
        {displayRow.hasChildren ? (
          <button
            type="button"
            className={cx('sdg-expander', displayRow.expanded && 'sdg-expander--open')}
            aria-expanded={displayRow.expanded}
            aria-label={displayRow.expanded ? 'Collapse' : 'Expand'}
            onClick={(event) => {
              event.stopPropagation();
              api.toggleExpanded(rowId);
            }}
          >
            <ChevronRightIcon size={14} />
          </button>
        ) : (
          <span style={{ width: 22, flex: '0 0 auto' }} />
        )}
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</span>
      </span>
    );
  }

  const editable =
    props.editable &&
    (typeof column.editable === 'function' ? column.editable(row) : column.editable !== false);

  const dynamicClass =
    typeof column.className === 'function' ? column.className(cellContext) : column.className;
  const dynamicStyle =
    typeof column.style === 'function' ? column.style(cellContext) : column.style;

  const title =
    typeof column.tooltip === 'function'
      ? column.tooltip(cellContext)
      : column.tooltip || column.truncate
        ? toText(value)
        : undefined;

  const focused =
    focusedCell?.rowIndex === displayRow.index && focusedCell.columnIndex === columnIndex;

  return (
    <td
      className={cx(
        'sdg-td',
        align !== 'left' && `sdg-td--align-${align}`,
        column.truncate && 'sdg-td--truncate',
        isEditing && 'sdg-td--editing',
        focused && 'sdg-td--focused',
        pinnedClass(column),
        dynamicClass,
      )}
      style={{ ...pinnedStyle(column, rtl), ...dynamicStyle }}
      data-label={typeof column.header === 'string' ? column.header : column.id}
      title={title}
      tabIndex={-1}
      onClick={(event) => {
        setFocusedCell({ rowIndex: displayRow.index, columnIndex });
        props.onCellClick?.({ ...cellContext, event });
      }}
      onDoubleClick={() => {
        if (editable && !isEditing) api.startEditing(rowId, column.id);
      }}
    >
      <span className="sdg-cell-content">{content}</span>
    </td>
  );
}

// The tree expander lands in the first column that actually holds data.
function firstDataColumnIndex<T>(ctx: { columns: { visible: ResolvedColumn<T>[] } }): number {
  const system = new Set([SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID]);
  return ctx.columns.visible.findIndex((column) => !system.has(column.id));
}

const GridCell = React.memo(GridCellInner) as typeof GridCellInner;

/* ------------------------------------------------------------------ *
 * Data row
 * ------------------------------------------------------------------ */

function GridDataRow<T>({ displayRow }: { displayRow: DataDisplayRow<T> }): React.JSX.Element {
  const ctx = useGridContext<T>();
  const { api, columns, props, selection, theme } = ctx;
  const { row, index, id } = displayRow;

  const isSelected = selection.has(id);
  const disabled = props.isRowDisabled ? props.isRowDisabled(row, index) : false;

  const rowClassName =
    typeof props.rowClassName === 'function' ? props.rowClassName(row, index) : props.rowClassName;
  const rowStyle = typeof props.rowStyle === 'function' ? props.rowStyle(row, index) : props.rowStyle;

  const cells = columns.visible.map((column, columnIndex) => (
    <GridCell
      key={column.id}
      column={column}
      displayRow={displayRow}
      columnIndex={columnIndex}
      isSelected={isSelected}
      disabled={disabled}
    />
  ));

  const tr = (
    <tr
      className={cx(
        'sdg-tr',
        theme.ui.row?.striped && 'sdg-tr--striped',
        isSelected && 'sdg-tr--selected',
        disabled && 'sdg-tr--disabled',
        props.onRowClick && 'sdg-tr--clickable',
        rowClassName,
      )}
      style={rowStyle}
      data-row-id={id}
      aria-selected={isSelected || undefined}
      aria-disabled={disabled || undefined}
      onClick={(event) => props.onRowClick?.(row, { rowId: id, rowIndex: index, event })}
      onDoubleClick={(event) => props.onRowDoubleClick?.(row, { rowId: id, rowIndex: index, event })}
    >
      {cells}
    </tr>
  );

  if (props.renderRow) {
    return <>{props.renderRow({ row, rowIndex: index, children: cells })}</>;
  }

  return tr;
}

const MemoRow = React.memo(GridDataRow) as typeof GridDataRow;

/* ------------------------------------------------------------------ *
 * Group row
 * ------------------------------------------------------------------ */

function GroupRow<T>({ displayRow }: { displayRow: GroupDisplayRow }): React.JSX.Element {
  const { api, columns, rtl } = useGridContext<T>();
  const column = columns.byId.get(displayRow.columnId);
  const label =
    typeof column?.header === 'string' ? column.header : (column?.id ?? displayRow.columnId);

  // The label spans the columns before the first aggregate; every column after
  // that gets its own cell, so each aggregate sits under its own header.
  const visible = columns.visible;
  const firstAggregate = visible.findIndex((entry) => entry.aggregate);
  const labelSpan = firstAggregate === -1 ? visible.length : Math.max(1, firstAggregate);

  return (
    <tr
      className="sdg-tr sdg-group-row"
      onClick={() => api.toggleExpanded(collapsedGroupKey(displayRow.id))}
    >
      <td colSpan={labelSpan}>
        <span className="sdg-group-label" style={{ paddingInlineStart: displayRow.depth * 18 }}>
          <button
            type="button"
            className={cx('sdg-expander', displayRow.expanded && 'sdg-expander--open')}
            aria-expanded={displayRow.expanded}
            aria-label={displayRow.expanded ? 'Collapse group' : 'Expand group'}
          >
            <ChevronRightIcon size={14} />
          </button>
          <strong>{label}:</strong> {toText(displayRow.value) || '—'}
          <span className="sdg-group-count">({displayRow.count})</span>
        </span>
      </td>
      {visible.slice(labelSpan).map((entry) => (
        <td
          key={entry.id}
          className={cx(
            'sdg-td',
            entry.align && entry.align !== 'left' && `sdg-td--align-${entry.align}`,
            pinnedClass(entry),
          )}
          style={pinnedStyle(entry, rtl)}
        >
          {entry.aggregate ? formatAggregate(entry, displayRow.aggregates[entry.id]) : null}
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------------------------------------------ *
 * Body
 * ------------------------------------------------------------------ */

export interface GridBodyProps<T> {
  rows: DisplayRow<T>[];
  paddingTop?: number;
  paddingBottom?: number;
}

export function GridBody<T>({ rows, paddingTop = 0, paddingBottom = 0 }: GridBodyProps<T>): React.JSX.Element {
  const { api, columns, props, theme } = useGridContext<T>();

  return (
    <tbody
      className={cx(
        'sdg-tbody',
        theme.ui.row?.border !== false && 'sdg-tbody--bordered',
        'sdg-tbody--hoverable',
      )}
    >
      {paddingTop > 0 && (
        <tr aria-hidden style={{ height: paddingTop }}>
          <td colSpan={columns.visible.length} style={{ padding: 0, border: 0, height: paddingTop }} />
        </tr>
      )}

      {rows.map((displayRow) => {
        if (displayRow.kind === 'group') {
          return <GroupRow<T> key={displayRow.id} displayRow={displayRow} />;
        }

        if (displayRow.kind === 'detail') {
          return (
            <tr key={displayRow.id} className="sdg-tr sdg-detail-row">
              <td colSpan={columns.visible.length}>
                <div className="sdg-detail-inner">
                  {props.renderExpanded?.({
                    row: displayRow.row,
                    rowId: displayRow.parentId,
                    rowIndex: displayRow.index,
                    grid: api,
                  })}
                </div>
              </td>
            </tr>
          );
        }

        return <MemoRow<T> key={displayRow.id} displayRow={displayRow} />;
      })}

      {paddingBottom > 0 && (
        <tr aria-hidden style={{ height: paddingBottom }}>
          <td colSpan={columns.visible.length} style={{ padding: 0, border: 0, height: paddingBottom }} />
        </tr>
      )}
    </tbody>
  );
}

export { isDataRow };
