import * as React from 'react';
import type { EmptyStateSlot, ErrorStateSlot, LoadingSlot } from '../types';
import { cx } from '../utils';
import { useGridContext } from './context';
import { AlertIcon, InboxIcon, SearchIcon, WifiOffIcon } from './icons';
import { Button } from './primitives';

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

export function LoadingState({ slot, columnCount }: { slot: LoadingSlot; columnCount: number }): React.JSX.Element {
  const { labels } = useGridContext();
  const variant = slot.variant ?? 'skeleton';

  if (variant === 'skeleton' || variant === 'shimmer') {
    const rows = slot.rows ?? 8;
    return (
      <tbody className="sdg-tbody" aria-busy="true">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr className="sdg-tr" key={rowIndex}>
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <td className="sdg-td" key={columnIndex}>
                <span
                  className="sdg-skeleton"
                  style={{
                    // Ragged widths read as content rather than as a grid of bars.
                    width: `${55 + ((rowIndex * 7 + columnIndex * 13) % 40)}%`,
                    animationDelay: `${(rowIndex % 5) * 60}ms`,
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <tbody className="sdg-tbody" aria-busy="true">
      <tr>
        <td colSpan={columnCount}>
          <div className={cx('sdg-state', slot.className)} style={slot.style}>
            {variant !== 'minimal' && <span className="sdg-spinner" />}
            <span className="sdg-state-description">{slot.label ?? labels.loading}</span>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

/** Full-container overlay used by the `overlay` and `progress` loading variants. */
export function LoadingOverlay({ slot }: { slot: LoadingSlot }): React.JSX.Element | null {
  const { labels } = useGridContext();
  const variant = slot.variant ?? 'skeleton';

  if (variant === 'progress') return <div className="sdg-progress-bar" role="progressbar" />;
  if (variant !== 'overlay') return null;

  return (
    <div className="sdg-overlay" role="status" style={{ background: slot.overlayBackground }}>
      <span className="sdg-spinner" />
      <span>{slot.label ?? labels.loading}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Empty
 * ------------------------------------------------------------------ */

export function EmptyState({
  slot,
  columnCount,
  filtered,
  searched,
}: {
  slot: EmptyStateSlot;
  columnCount: number;
  filtered: boolean;
  searched: boolean;
}): React.JSX.Element {
  const { labels, api } = useGridContext();
  const variant = slot.variant ?? (searched ? 'search' : filtered ? 'filtered' : 'default');

  const icon =
    slot.icon ??
    (variant === 'search' ? <SearchIcon size={40} /> : <InboxIcon size={44} />);

  const title =
    slot.title ??
    (variant === 'search'
      ? labels.noResults
      : variant === 'filtered'
        ? labels.noResults
        : labels.noResults);

  const description =
    slot.description ?? (searched || filtered ? labels.noResultsDescription : undefined);

  return (
    <tbody className="sdg-tbody">
      <tr>
        <td colSpan={columnCount}>
          <div
            className={cx('sdg-state', variant === 'minimal' && 'sdg-state--minimal', slot.className)}
            style={{ height: slot.height, ...slot.style }}
          >
            {variant !== 'minimal' && <span className="sdg-state-icon">{icon}</span>}
            <span className="sdg-state-title">{title}</span>
            {description && <span className="sdg-state-description">{description}</span>}
            {slot.action}
            {(filtered || searched) && !slot.action && (
              <Button
                size="sm"
                onClick={() => {
                  api.clearFilters();
                  api.clearSearch();
                }}
              >
                {labels.reset}
              </Button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

/* ------------------------------------------------------------------ *
 * Error
 * ------------------------------------------------------------------ */

export function ErrorState({
  slot,
  columnCount,
  error,
}: {
  slot: ErrorStateSlot;
  columnCount: number;
  error: Error;
}): React.JSX.Element {
  const { labels, api } = useGridContext();
  const variant = slot.variant ?? 'retry';

  const icon = slot.icon ?? (variant === 'network' ? <WifiOffIcon size={40} /> : <AlertIcon size={40} />);

  return (
    <tbody className="sdg-tbody">
      <tr>
        <td colSpan={columnCount}>
          <div
            className={cx('sdg-state', 'sdg-state--error', slot.className)}
            style={{ height: slot.height, ...slot.style }}
            role="alert"
          >
            <span className="sdg-state-icon">{icon}</span>
            <span className="sdg-state-title">{slot.title ?? labels.error}</span>
            <span className="sdg-state-description">{slot.description ?? error.message}</span>
            {(slot.retry ?? variant === 'retry') && (
              <Button variant="primary" size="sm" onClick={() => (slot.onRetry ?? api.refresh)()}>
                {slot.retryLabel ?? labels.retry}
              </Button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
