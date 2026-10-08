import * as React from 'react';
import type { PaginationConfig } from '../types';
import { getPageTokens } from '../core/paginate';
import { cx } from '../utils';
import { useGridContext } from './context';
import { Select } from './primitives';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from './icons';

export interface PaginationProps {
  config: PaginationConfig;
  position: 'top' | 'bottom';
}

export function Pagination({ config, position }: PaginationProps): React.JSX.Element | null {
  const { api, pageInfo, theme, labels, rtl } = useGridContext();
  const ui = theme.ui.pagination ?? {};

  const variant = config.variant ?? ui.variant ?? 'default';
  const placement = config.position ?? ui.position ?? 'bottom-right';
  const size = config.size ?? ui.size ?? 'md';
  const paginationLabels = { ...labels.pagination, ...config.labels };

  // `position: 'both'` renders the same control top and bottom.
  const wanted = placement.startsWith(position) || placement === 'both';
  if (!wanted) return null;

  const suffix = placement === 'both' ? `${position}-right` : placement;
  const tokens = getPageTokens(pageInfo.pageIndex, pageInfo.pageCount, config.siblingCount ?? 1);

  const PrevIcon = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = rtl ? ChevronLeftIcon : ChevronRightIcon;
  const FirstIcon = rtl ? ChevronsRightIcon : ChevronsLeftIcon;
  const LastIcon = rtl ? ChevronsLeftIcon : ChevronsRightIcon;

  return (
    <nav
      className={cx(
        'sdg-pagination',
        `sdg-pagination--${suffix}`,
        variant !== 'default' && `sdg-pagination--${variant}`,
        size !== 'md' && `sdg-pagination--${size}`,
        ui.className,
      )}
      style={ui.style}
      aria-label="Pagination"
    >
      {config.showTotal !== false && (
        <span className="sdg-pagination-info">
          {pageInfo.total === 0
            ? '0 ' + paginationLabels.results
            : `${paginationLabels.showing} ${pageInfo.from}–${pageInfo.to} ${paginationLabels.of} ${pageInfo.total}`}
        </span>
      )}

      {config.showPageSizeSelector !== false && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>{paginationLabels.rowsPerPage}</span>
          <Select
            size={size}
            value={pageInfo.pageSize}
            options={config.pageSizeOptions ?? [10, 25, 50, 100]}
            onChange={(value) => api.setPageSize(value)}
            aria-label={paginationLabels.rowsPerPage}
          />
        </label>
      )}

      <div className="sdg-pagination-pages">
        {config.showFirstLast !== false && (
          <button
            type="button"
            className="sdg-page-btn sdg-page-btn--edge"
            disabled={pageInfo.isFirst}
            onClick={() => api.firstPage()}
            aria-label={paginationLabels.first}
            title={paginationLabels.first}
          >
            <FirstIcon size={15} />
          </button>
        )}

        <button
          type="button"
          className="sdg-page-btn"
          disabled={pageInfo.isFirst}
          onClick={() => api.previousPage()}
          aria-label={paginationLabels.previous}
          title={paginationLabels.previous}
        >
          <PrevIcon size={15} />
        </button>

        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <span key={`gap-${index}`} className="sdg-page-btn sdg-page-btn--ellipsis" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              className={cx(
                'sdg-page-btn',
                'sdg-page-btn--page',
                token === pageInfo.pageIndex && 'sdg-page-btn--active',
              )}
              onClick={() => api.setPage(token)}
              aria-label={`${paginationLabels.page} ${token + 1}`}
              aria-current={token === pageInfo.pageIndex ? 'page' : undefined}
            >
              {token + 1}
            </button>
          ),
        )}

        <button
          type="button"
          className="sdg-page-btn"
          disabled={pageInfo.isLast}
          onClick={() => api.nextPage()}
          aria-label={paginationLabels.next}
          title={paginationLabels.next}
        >
          <NextIcon size={15} />
        </button>

        {config.showFirstLast !== false && (
          <button
            type="button"
            className="sdg-page-btn sdg-page-btn--edge"
            disabled={pageInfo.isLast}
            onClick={() => api.lastPage()}
            aria-label={paginationLabels.last}
            title={paginationLabels.last}
          >
            <LastIcon size={15} />
          </button>
        )}
      </div>

      {config.showJumpToPage && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>{paginationLabels.jumpTo}</span>
          <input
            className="sdg-input"
            type="number"
            min={1}
            max={pageInfo.pageCount}
            style={{ width: 64 }}
            defaultValue={pageInfo.pageIndex + 1}
            key={pageInfo.pageIndex}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              const value = Number((event.target as HTMLInputElement).value);
              if (Number.isFinite(value)) api.setPage(value - 1);
            }}
            aria-label={paginationLabels.jumpTo}
          />
        </label>
      )}
    </nav>
  );
}
