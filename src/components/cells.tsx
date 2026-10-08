import * as React from 'react';
import type { CellContext, CellType, CellTypeOptions, GridRow, ResolvedColumn, RowAction } from '../types';
import { highlightChunks } from '../core/search';
import type { RowActionsDisplay } from '../core/actions';
import { cx, isEmptyValue, safeHref, toNumber, toText } from '../utils';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  initials,
  statusColors,
} from '../utils/format';
import { CheckIcon, CloseIcon, MoreIcon, StarIcon, TrendDownIcon, TrendUpIcon } from './icons';
import { Button, MenuItem, Popover } from './primitives';

/* ------------------------------------------------------------------ *
 * Small building blocks — exported so consumers can reuse them in
 * custom `cell` renderers.
 * ------------------------------------------------------------------ */

export function Highlight({ text, query }: { text: string; query?: string }): React.JSX.Element {
  if (!query) return <>{text}</>;
  const chunks = highlightChunks(text, query);
  return (
    <>
      {chunks.map((chunk, index) =>
        chunk.match ? (
          <mark key={index} className="sdg-mark">
            {chunk.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{chunk.text}</React.Fragment>
        ),
      )}
    </>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  background?: string;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, color, background, dot, className }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cx('sdg-badge', dot && 'sdg-badge--dot', className)}
      style={
        {
          '--sdg-badge-bg': background,
          '--sdg-badge-fg': color,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = 28,
}: {
  src?: string;
  name?: string;
  size?: number;
}): React.JSX.Element {
  const [failed, setFailed] = React.useState(false);
  const label = name ? initials(name) : '';

  return (
    <span className="sdg-avatar" style={{ width: size, height: size }} title={name}>
      {src && !failed ? (
        <img src={src} alt={name ?? ''} onError={() => setFailed(true)} loading="lazy" />
      ) : (
        label
      )}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  showValue = true,
  color,
}: {
  value: number;
  max?: number;
  showValue?: boolean;
  color?: string;
}): React.JSX.Element {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="sdg-progress">
      <span className="sdg-progress-track">
        <span
          className="sdg-progress-fill"
          style={{ width: `${percent}%`, background: color }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </span>
      {showValue && <span className="sdg-progress-value">{Math.round(percent)}%</span>}
    </span>
  );
}

export function Rating({ value, outOf = 5 }: { value: number; outOf?: number }): React.JSX.Element {
  return (
    <span className="sdg-rating" aria-label={`${value} out of ${outOf}`}>
      {Array.from({ length: outOf }, (_, index) => (
        <StarIcon
          key={index}
          size={14}
          filled={index < Math.round(value)}
          className={index < Math.round(value) ? undefined : 'sdg-rating-star--empty'}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Row actions
 * ------------------------------------------------------------------ */

export interface RowActionsProps<T> {
  actions: RowAction<T>[];
  row: T;
  rowId: string;
  rowIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  grid: any;
  display?: RowActionsDisplay;
  showOnHover?: boolean;
}

export function RowActions<T>({
  actions,
  row,
  rowId,
  rowIndex,
  grid,
  display = 'iconButtons',
  showOnHover,
}: RowActionsProps<T>): React.JSX.Element | null {
  const resolve = <V,>(value: V | ((row: T) => V) | undefined, fallback: V): V =>
    typeof value === 'function' ? (value as (row: T) => V)(row) : (value ?? fallback);

  const visible = actions.filter((action) => !resolve(action.hidden, false));
  if (visible.length === 0) return null;

  const ctx = { rowId, rowIndex, grid };

  if (display === 'dropdown' || display === 'contextMenu') {
    return (
      <span className={cx('sdg-row-actions', showOnHover && 'sdg-row-actions--hover')}>
        <Popover
          align="end"
          label="Row actions"
          trigger={(triggerProps) => (
            <Button
              {...triggerProps}
              icon
              size="sm"
              variant="ghost"
              aria-label="Row actions"
              onClick={(event) => {
                event.stopPropagation();
                triggerProps.onClick();
              }}
            >
              <MoreIcon size={15} />
            </Button>
          )}
        >
          {(close) => (
            <div role="menu">
              {visible.map((action) => (
                <React.Fragment key={action.id}>
                  {action.divider && <div className="sdg-menu-divider" />}
                  <MenuItem
                    icon={action.icon}
                    danger={action.danger}
                    disabled={resolve(action.disabled, false)}
                    onClick={(event) => {
                      event.stopPropagation();
                      action.onClick(row, ctx);
                      close();
                    }}
                  >
                    {action.label}
                  </MenuItem>
                </React.Fragment>
              ))}
            </div>
          )}
        </Popover>
      </span>
    );
  }

  return (
    <span className={cx('sdg-row-actions', showOnHover && 'sdg-row-actions--hover')}>
      {visible.map((action) => (
        <Button
          key={action.id}
          size="sm"
          icon={display === 'iconButtons'}
          variant={action.danger ? 'danger' : 'ghost'}
          title={action.label}
          aria-label={action.label}
          disabled={resolve(action.disabled, false)}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick(row, ctx);
          }}
        >
          {display === 'iconButtons' ? (action.icon ?? action.label.slice(0, 1)) : action.label}
        </Button>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The built-in type registry
 * ------------------------------------------------------------------ */

type Renderer = (ctx: CellContext<GridRow>, options: CellTypeOptions) => React.ReactNode;

function readSibling(row: GridRow, key: string | undefined): string | undefined {
  if (!key) return undefined;
  const value = row[key];
  return value == null ? undefined : toText(value);
}

const renderers: Record<CellType, Renderer> = {
  text: (ctx) => <Highlight text={toText(ctx.value)} query={ctx.highlight} />,

  number: (ctx, options) => (
    <span className="sdg-numeric">{formatNumber(ctx.value, options)}</span>
  ),

  currency: (ctx, options) => (
    <span className="sdg-numeric">{formatCurrency(ctx.value, options)}</span>
  ),

  percentage: (ctx, options) => (
    <span className="sdg-numeric">{formatPercent(ctx.value, options)}</span>
  ),

  date: (ctx, options) => (
    <span>{formatDate(ctx.value, { locale: options.locale, timeZone: options.timeZone, dateFormat: options.dateFormat })}</span>
  ),

  datetime: (ctx, options) => (
    <span>
      {formatDate(ctx.value, {
        locale: options.locale,
        timeZone: options.timeZone,
        dateFormat: options.dateFormat,
        withTime: true,
      })}
    </span>
  ),

  relativeTime: (ctx, options) => (
    <span title={formatDate(ctx.value, { dateFormat: 'datetime' })}>
      {formatRelativeTime(ctx.value, options.locale)}
    </span>
  ),

  avatar: (ctx, options) => {
    const name = readSibling(ctx.row, options.nameKey) ?? toText(ctx.value);
    const src = readSibling(ctx.row, options.srcKey) ?? (options.nameKey ? toText(ctx.value) : undefined);
    return (
      <span className="sdg-avatar-cell">
        <Avatar src={src} name={name} />
        {options.nameKey || options.srcKey ? (
          <span className="sdg-avatar-name">
            <Highlight text={name} query={ctx.highlight} />
          </span>
        ) : null}
      </span>
    );
  },

  avatarGroup: (ctx, options) => {
    const list = Array.isArray(ctx.value) ? ctx.value : [];
    const max = options.maxAvatars ?? 4;
    const shown = list.slice(0, max);
    const rest = list.length - shown.length;
    return (
      <span className="sdg-avatar-group">
        {shown.map((entry, index) => {
          const record = (entry ?? {}) as GridRow;
          const name = toText(record[options.nameKey ?? 'name'] ?? entry);
          const src = options.srcKey ? toText(record[options.srcKey]) : undefined;
          return <Avatar key={index} src={src} name={name} size={26} />;
        })}
        {rest > 0 && <span className="sdg-avatar" style={{ width: 26, height: 26 }}>{`+${rest}`}</span>}
      </span>
    );
  },

  badge: (ctx, options) => {
    const text = toText(ctx.value);
    if (!text) return null;
    const custom = options.colorMap?.[text];
    const colors = statusColors(text);
    return (
      <Badge background={custom ? `${custom}22` : colors.bg} color={custom ?? colors.fg}>
        {text}
      </Badge>
    );
  },

  status: (ctx, options) => {
    const text = toText(ctx.value);
    if (!text) return null;
    const custom = options.colorMap?.[text];
    const colors = statusColors(text);
    return (
      <Badge dot background={custom ? `${custom}22` : colors.bg} color={custom ?? colors.fg}>
        {text}
      </Badge>
    );
  },

  progress: (ctx, options) => {
    const value = toNumber(ctx.value) ?? 0;
    return <ProgressBar value={value} max={options.max ?? 100} showValue={options.showValue !== false} />;
  },

  rating: (ctx, options) => <Rating value={toNumber(ctx.value) ?? 0} outOf={options.outOf ?? 5} />,

  boolean: (ctx, options) => {
    const truthy = Boolean(ctx.value);
    if (options.trueLabel || options.falseLabel) {
      return <span>{truthy ? options.trueLabel : options.falseLabel}</span>;
    }
    return truthy ? (
      <CheckIcon size={15} style={{ color: 'var(--grid-success)' }} />
    ) : (
      <CloseIcon size={15} style={{ color: 'var(--grid-muted)' }} />
    );
  },

  checkbox: (ctx) => (
    <input type="checkbox" checked={Boolean(ctx.value)} readOnly aria-readonly tabIndex={-1} />
  ),

  switch: (ctx) => (
    <span
      className="sdg-checkbox sdg-checkbox--switch"
      aria-checked={Boolean(ctx.value)}
      role="switch"
    >
      <input type="checkbox" checked={Boolean(ctx.value)} readOnly tabIndex={-1} />
      <span className="sdg-checkbox-box" />
    </span>
  ),

  link: (ctx, options) => {
    const text = toText(ctx.value);
    if (!text) return null;
    // Row data often comes straight from an API, so a `javascript:` URL must
    // never reach the DOM — React 18 renders it as-is.
    const href = safeHref(readSibling(ctx.row, options.hrefKey) ?? text);
    if (!href) return <Highlight text={text} query={ctx.highlight} />;
    return (
      <a
        className="sdg-link"
        href={href}
        target={options.target ?? '_blank'}
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        <Highlight text={text} query={ctx.highlight} />
      </a>
    );
  },

  email: (ctx) => {
    const text = toText(ctx.value);
    if (!text) return null;
    return (
      <a className="sdg-link" href={`mailto:${text}`} onClick={(event) => event.stopPropagation()}>
        <Highlight text={text} query={ctx.highlight} />
      </a>
    );
  },

  phone: (ctx) => {
    const text = toText(ctx.value);
    if (!text) return null;
    return (
      <a
        className="sdg-link"
        href={`tel:${text.replace(/[^\d+]/g, '')}`}
        onClick={(event) => event.stopPropagation()}
      >
        <Highlight text={text} query={ctx.highlight} />
      </a>
    );
  },

  image: (ctx, options) => {
    const src = toText(ctx.value);
    if (!src) return null;
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        width={options.imageWidth ?? 40}
        height={options.imageHeight ?? 40}
        style={{ borderRadius: 'var(--grid-radius-sm)', objectFit: 'cover' }}
      />
    );
  },

  icon: (ctx) => <span aria-hidden>{ctx.value as React.ReactNode}</span>,

  tags: (ctx, options) => {
    const list = Array.isArray(ctx.value) ? ctx.value : toText(ctx.value).split(',').filter(Boolean);
    const max = options.maxTags ?? 3;
    const shown = list.slice(0, max);
    const rest = list.length - shown.length;
    return (
      <span className="sdg-tags">
        {shown.map((entry, index) => {
          const text = toText(entry).trim();
          const colors = statusColors(text);
          return (
            <Badge key={index} background={colors.bg} color={colors.fg}>
              {text}
            </Badge>
          );
        })}
        {rest > 0 && <Badge>{`+${rest}`}</Badge>}
      </span>
    );
  },

  code: (ctx) => <code className="sdg-code">{toText(ctx.value)}</code>,

  json: (ctx) => {
    let text: string;
    try {
      text = JSON.stringify(ctx.value, null, 2) ?? '';
    } catch {
      text = String(ctx.value);
    }
    return <pre className="sdg-json">{text}</pre>;
  },

  trend: (ctx, options) => {
    const value = toNumber(ctx.value) ?? 0;
    const explicit = readSibling(ctx.row, options.trendDirectionKey);
    const direction = explicit ?? (value > 0 ? 'up' : value < 0 ? 'down' : 'flat');
    return (
      <span className={`sdg-trend sdg-trend--${direction}`}>
        {direction === 'up' && <TrendUpIcon />}
        {direction === 'down' && <TrendDownIcon />}
        {formatPercent(Math.abs(value), options)}
      </span>
    );
  },

  action: (ctx, options) => renderActionList(ctx, options),
  button: (ctx, options) => renderActionList(ctx, options, 'buttons'),
  dropdown: (ctx, options) => renderActionList(ctx, options, 'dropdown'),
};

function renderActionList(
  ctx: CellContext<GridRow>,
  options: CellTypeOptions,
  display: 'buttons' | 'iconButtons' | 'dropdown' = 'iconButtons',
): React.ReactNode {
  if (!options.actions?.length) return null;
  return (
    <RowActions
      actions={options.actions}
      row={ctx.row}
      rowId={ctx.rowId}
      rowIndex={ctx.rowIndex}
      grid={ctx.grid}
      display={display}
    />
  );
}

/**
 * Render a cell using a built-in type. Returns `null` for an unknown type so
 * the caller can fall back to plain text.
 */
export function renderCellType<T>(
  type: CellType,
  ctx: CellContext<T>,
  options: CellTypeOptions = {},
): React.ReactNode {
  const renderer = renderers[type];
  if (!renderer) return null;
  if (isEmptyValue(ctx.value) && type !== 'action' && type !== 'button' && type !== 'dropdown') {
    if (type === 'boolean' || type === 'checkbox' || type === 'switch' || type === 'progress') {
      // These are meaningful even when the value is falsy.
    } else {
      return null;
    }
  }
  return renderer(ctx as unknown as CellContext<GridRow>, options);
}

export const builtInCellTypes = Object.keys(renderers) as CellType[];

/**
 * Format an aggregate in its column's own style, so a currency column's sum
 * reads `$1,240,000.00` rather than `1240000`. Counts stay plain numbers.
 */
export function formatAggregate<T>(column: ResolvedColumn<T>, value: unknown): string {
  if (value === undefined || value === null) return '';
  const options = column.cellOptions ?? {};

  if ((column.type === 'date' || column.type === 'datetime') && typeof value !== 'number') {
    return formatDate(value, {
      locale: options.locale,
      timeZone: options.timeZone,
      dateFormat: options.dateFormat,
      withTime: column.type === 'datetime',
    });
  }

  const counting = column.aggregate === 'count' || column.aggregate === 'countDistinct';
  if (typeof value !== 'number' || counting) return toText(value);

  switch (column.type) {
    case 'currency':
      return formatCurrency(value, options);
    case 'number':
      return formatNumber(value, options);
    case 'percentage':
    case 'trend':
      return formatPercent(value, options);
    default:
      // Averages rarely land on whole numbers; keep them readable.
      return Number.isInteger(value) ? toText(value) : formatNumber(value, { locale: options.locale, decimals: 2 });
  }
}
