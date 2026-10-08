import * as React from 'react';
import type { FooterContext } from '../types';
import { cx } from '../utils';
import { useGridContext } from './context';
import { pinnedClass, pinnedStyle } from './GridHeader';
import { formatAggregate } from './cells';

/** Footer row with per-column aggregates or custom footer renderers. */
export function GridFooter<T>(): React.JSX.Element | null {
  const { columns, aggregates, theme, rtl, api, filteredRows, props } = useGridContext<T>();

  const hasFooter = columns.visible.some((column) => column.footer !== undefined || column.aggregate);
  if (!hasFooter) return null;

  const ui = theme.ui.footer ?? {};
  const sticky = props.stickyFooter ?? ui.sticky;

  return (
    <tfoot className={cx('sdg-tfoot', sticky && 'sdg-tfoot--sticky', ui.className)} style={ui.style}>
      <tr>
        {columns.visible.map((column) => {
          const aggregate = aggregates[column.id];
          const ctx: FooterContext<T> = { column, grid: api, rows: filteredRows, aggregate };

          const content =
            typeof column.footer === 'function'
              ? (column.footer as (ctx: FooterContext<T>) => React.ReactNode)(ctx)
              : (column.footer ?? (aggregate === undefined ? null : formatAggregate(column, aggregate)));

          return (
            <td
              key={column.id}
              className={cx(
                'sdg-td',
                column.align && column.align !== 'left' && `sdg-td--align-${column.align}`,
                pinnedClass(column),
              )}
              style={pinnedStyle(column, rtl)}
            >
              {content}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}
