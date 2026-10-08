import * as React from 'react';
import type { CheckboxVariant, Size } from '../types';
import { cx } from '../utils';
import { CheckIcon, ChevronDownIcon, MinusIcon } from './icons';
import { useIsomorphicLayoutEffect, useOutsideClick } from '../hooks/useMedia';

/* ------------------------------------------------------------------ *
 * Checkbox
 * ------------------------------------------------------------------ */

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  variant?: CheckboxVariant;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  onChange: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent) => void;
}

export function Checkbox({
  checked,
  indeterminate = false,
  disabled = false,
  variant = 'rounded',
  size = 'md',
  className,
  style,
  onChange,
  onClick,
  ...rest
}: CheckboxProps): React.JSX.Element {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <label
      className={cx(
        'sdg-checkbox',
        `sdg-checkbox--${variant}`,
        size !== 'md' && `sdg-checkbox--${size}`,
        className,
      )}
      style={style}
      onClick={onClick}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked, event)}
        aria-label={rest['aria-label']}
      />
      <span className="sdg-checkbox-box">
        {indeterminate && !checked ? (
          <MinusIcon size={11} className="sdg-checkbox-check" />
        ) : (
          <CheckIcon size={11} className="sdg-checkbox-check" />
        )}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Radio
 * ------------------------------------------------------------------ */

export interface RadioProps {
  checked: boolean;
  disabled?: boolean;
  /** Groups the radios so arrow keys move between rows, as users expect. */
  name: string;
  size?: Size;
  className?: string;
  'aria-label'?: string;
  onChange: (checked: boolean) => void;
  onClick?: (event: React.MouseEvent) => void;
}

/** Single-selection control. Same footprint as `Checkbox`, radio semantics. */
export function Radio({
  checked,
  disabled = false,
  name,
  size = 'md',
  className,
  onChange,
  onClick,
  ...rest
}: RadioProps): React.JSX.Element {
  return (
    <label
      className={cx('sdg-checkbox', 'sdg-radio', size !== 'md' && `sdg-checkbox--${size}`, className)}
      onClick={onClick}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={rest['aria-label']}
      />
      <span className="sdg-checkbox-box" />
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: Size;
  icon?: boolean;
  active?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', icon, active, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'sdg-btn',
        variant !== 'default' && `sdg-btn--${variant}`,
        size !== 'md' && `sdg-btn--${size}`,
        icon && 'sdg-btn--icon',
        active && 'sdg-btn--active',
        className,
      )}
      {...rest}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Popover
 * ------------------------------------------------------------------ */

export interface PopoverProps {
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'dialog';
  }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
  /** Rendered as a bottom sheet instead of a popover — used on small screens. */
  sheet?: boolean;
  label?: string;
}

/**
 * A minimal popover: absolutely positioned, closes on outside click and Escape,
 * and returns focus to its trigger. No portal, so it inherits the grid's
 * CSS variables and works inside fullscreen without a stacking-context fight.
 */
export function Popover({
  trigger,
  children,
  align = 'end',
  className,
  sheet = false,
  label,
}: PopoverProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  // Viewport-relative coordinates, recomputed every time the panel opens (and
  // while it stays open, on scroll/resize). Positioning it with `position:
  // fixed` against the viewport — instead of `absolute` against whatever
  // ancestor happens to be positioned — means an ancestor's `overflow:
  // hidden` (e.g. a card clipping the grid's rounded corners) can no longer
  // crop the panel; only an ancestor with its own transform/filter could.
  const [coords, setCoords] = React.useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(
    null,
  );
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useOutsideClick([triggerRef, panelRef], () => setOpen(false), open);

  const reposition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Flip only when there's genuinely more room the other way — otherwise a
    // panel taller than the viewport would flip back and forth pointlessly.
    const placement: 'top' | 'bottom' =
      spaceBelow < panelRect.height && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'top' ? triggerRect.top - panelRect.height - 6 : triggerRect.bottom + 6;

    // `align` is logical (start/end); resolve it against the trigger's actual
    // rendered direction rather than assuming LTR.
    const isRtl = window.getComputedStyle(trigger).direction === 'rtl';
    const matchRightEdge = isRtl ? align === 'start' : align === 'end';
    let left = matchRightEdge ? triggerRect.right - panelRect.width : triggerRect.left;
    left = Math.max(4, Math.min(left, window.innerWidth - panelRect.width - 4));

    setCoords({ top, left, placement });
  }, [align]);

  useIsomorphicLayoutEffect(() => {
    if (!open || sheet) return;
    reposition();
  }, [open, sheet, reposition]);

  React.useEffect(() => {
    if (!open || sheet) return undefined;
    window.addEventListener('resize', reposition);
    // `capture: true` so this also fires for scrolling inside a nested
    // scroll container (like the grid's own horizontal scroller), not just
    // the window.
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, sheet, reposition]);

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
      })}

      {open && sheet && <div className="sdg-sheet-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className={cx(
            sheet ? 'sdg-sheet' : 'sdg-popover',
            !sheet && coords && `sdg-popover--${coords.placement}`,
            className,
          )}
          style={
            sheet
              ? undefined
              : coords
                ? { position: 'fixed', top: coords.top, left: coords.left }
                // First paint, before we've measured the panel to place it —
                // render off-screen instead of flashing at the top-left.
                : { position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' }
          }
        >
          {children(close)}
        </div>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Select
 * ------------------------------------------------------------------ */

export interface SelectOption<V extends string | number> {
  label: string;
  value: V;
}

export interface SelectProps<V extends string | number> {
  value: V;
  options: Array<V | SelectOption<V>>;
  onChange: (value: V) => void;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * The open option list. A real component (not an inline closure) because it
 * needs its own `useRef`/`useEffect` for keyboard navigation — it remounts
 * fresh every time the popover opens, so "focus on mount" doubles as "focus
 * when opened".
 */
function SelectOptionList<V extends string | number>({
  options,
  value,
  ariaLabel,
  onSelect,
}: {
  options: Array<SelectOption<V>>;
  value: V;
  ariaLabel?: string;
  onSelect: (value: V) => void;
}): React.JSX.Element {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Land keyboard focus on the current value (or the first option) so Arrow
  // keys work immediately, the way a native <select> highlights the current
  // value as soon as it opens.
  React.useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    if (!items?.length) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    items[selectedIndex >= 0 ? selectedIndex : 0]?.focus();
    // Intentionally once — this component instance exists only while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowDown') next = current < items.length - 1 ? current + 1 : 0;
    else next = current > 0 ? current - 1 : items.length - 1;
    items[next]?.focus();
  };

  return (
    <div ref={listRef} role="listbox" aria-label={ariaLabel} className="sdg-select-list" onKeyDown={onKeyDown}>
      {options.map((option) => (
        <MenuItem
          key={option.value}
          role="option"
          aria-selected={option.value === value}
          active={option.value === value}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </MenuItem>
      ))}
    </div>
  );
}

/**
 * A themed stand-in for a native `<select>`. Built on `Popover`, so it picks
 * up the same viewport-aware flip and inherits the grid's own CSS variables
 * instead of the browser's unthemeable native dropdown chrome.
 */
export function Select<V extends string | number>({
  value,
  options,
  onChange,
  size = 'md',
  className,
  style,
  disabled,
  ...rest
}: SelectProps<V>): React.JSX.Element {
  const normalized = options.map((option) =>
    typeof option === 'object' ? option : { label: String(option), value: option },
  );
  const current = normalized.find((option) => option.value === value);
  const ariaLabel = rest['aria-label'];

  return (
    <Popover
      align="start"
      label={ariaLabel}
      className="sdg-select-popover"
      trigger={(triggerProps) => (
        <button
          {...triggerProps}
          type="button"
          disabled={disabled}
          className={cx('sdg-select-trigger', size !== 'md' && `sdg-select-trigger--${size}`, className)}
          style={style}
          aria-label={ariaLabel}
        >
          <span className="sdg-select-value">{current?.label ?? String(value)}</span>
          <ChevronDownIcon size={14} className="sdg-select-caret" />
        </button>
      )}
    >
      {(close) => (
        <SelectOptionList
          options={normalized}
          value={value}
          ariaLabel={ariaLabel}
          onSelect={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ *
 * Menu item
 * ------------------------------------------------------------------ */

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
}

export function MenuItem({
  icon,
  danger,
  active,
  children,
  className,
  ...rest
}: MenuItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(
        'sdg-menu-item',
        danger && 'sdg-menu-item--danger',
        active && 'sdg-menu-item--active',
        className,
      )}
      {...rest}
    >
      {icon}
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </button>
  );
}

export function MenuDivider(): React.JSX.Element {
  return <div className="sdg-menu-divider" role="separator" />;
}

/* ------------------------------------------------------------------ *
 * Screen-reader live region
 * ------------------------------------------------------------------ */

export function LiveRegion({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="sdg-sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
