import * as React from 'react';
import type { CellContext } from '../types';
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECT_COLUMN_ID } from '../core/columns';
import { isDataRow } from '../core/rows';
import { cx, toText } from '../utils';
import { useGridContext } from './context';
import { Checkbox } from './primitives';
import { RowActions, renderCellType } from './cells';

const SYSTEM = new Set([SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID]);

/**
 * Mobile card layout: each row becomes a card of label/value pairs.
 * The first non-system column is promoted to the card title.
 */
export function CardView<T>(): React.JSX.Element {
  const ctx = useGridContext<T>();
  const { api, columns, displayRows, selection, selectionMode, theme, props } = ctx;

  const dataColumns = columns.visible.filter((column) => !SYSTEM.has(column.id));
  const [titleColumn, ...restColumns] = dataColumns;

  return (
    <div className="sdg-cards">
      {displayRows.filter(isDataRow).map((displayRow) => {
        const { row, index, id } = displayRow;
        const isSelected = selection.has(id);

        const renderValue = (column: (typeof dataColumns)[number]): React.ReactNode => {
          const value = column.getValue(row, index);
          const cellContext: CellContext<T> = {
            value,
            row,
            rowId: id,
            rowIndex: index,
            column,
            grid: api,
            isSelected,
            isExpanded: displayRow.expanded,
            isEditing: false,
            highlight: ctx.highlight,
          };
          if (column.cell) return column.cell(cellContext);
          if (column.type) return renderCellType(column.type, cellContext, column.cellOptions);
          return column.format ? column.format(value, row) : toText(value);
        };

        return (
          <article
            key={id}
            className={cx('sdg-card', isSelected && 'sdg-card--selected')}
            onClick={(event) => props.onRowClick?.(row, { rowId: id, rowIndex: index, event })}
          >
            <header className="sdg-card-header">
              {selectionMode !== 'none' && (
                <Checkbox
                  checked={isSelected}
                  variant={theme.ui.checkbox?.variant}
                  size="sm"
                  aria-label={`Select row ${index + 1}`}
                  onChange={() => api.selectRow(id)}
                  onClick={(event) => event.stopPropagation()}
                />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>{titleColumn && renderValue(titleColumn)}</span>
              {props.rowActions?.length ? (
                <RowActions
                  actions={props.rowActions}
                  row={row}
                  rowId={id}
                  rowIndex={index}
                  grid={api}
                  display="dropdown"
                />
              ) : null}
            </header>

            {restColumns.map((column) => (
              <div className="sdg-card-row" key={column.id}>
                <span className="sdg-card-label">
                  {typeof column.header === 'string' ? column.header : column.id}
                </span>
                <span className="sdg-card-value">{renderValue(column)}</span>
              </div>
            ))}

            {displayRow.expanded && props.renderExpanded && (
              <div className="sdg-detail-inner">
                {props.renderExpanded({ row, rowId: id, rowIndex: index, grid: api })}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
