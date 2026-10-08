import * as React from 'react';
import type { GridApi, KeyboardShortcuts } from '../types';
import { clamp } from '../utils';

export interface FocusedCell {
  rowIndex: number;
  columnIndex: number;
}

export interface UseKeyboardNavOptions<T> {
  enabled: boolean;
  api: GridApi<T>;
  rootRef: React.RefObject<HTMLElement | null>;
  /** Row ids in render order — index-aligned with `rowCount`. */
  rowIds: string[];
  columnIds: string[];
  editable: boolean;
  shortcuts?: KeyboardShortcuts;
  onFocusSearch?: () => void;
  rtl: boolean;
}

const DEFAULT_SHORTCUTS: Required<KeyboardShortcuts> = {
  selectAll: 'mod+a',
  search: 'mod+f',
  commandPalette: 'mod+k',
  export: 'mod+e',
  refresh: 'mod+r',
  edit: 'Enter',
  cancel: 'Escape',
  toggleSelect: ' ',
  nextPage: 'mod+ArrowRight',
  prevPage: 'mod+ArrowLeft',
};

function matches(event: KeyboardEvent, binding: string | false | undefined): boolean {
  if (!binding) return false;
  const parts = binding.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const wantsMod = parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd');
  const wantsShift = parts.includes('shift');
  const wantsAlt = parts.includes('alt');

  const hasMod = event.ctrlKey || event.metaKey;
  if (wantsMod !== hasMod) return false;
  if (wantsShift !== event.shiftKey) return false;
  if (wantsAlt !== event.altKey) return false;

  return event.key.toLowerCase() === key;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

/**
 * Keyboard navigation and shortcuts.
 *
 * Focus is tracked as a cell coordinate rather than by moving DOM focus, so
 * virtualized rows that unmount don't strand the focus ring.
 */
export function useKeyboardNav<T>(options: UseKeyboardNavOptions<T>): {
  focusedCell: FocusedCell | null;
  setFocusedCell: (cell: FocusedCell | null) => void;
} {
  const {
    enabled,
    api,
    rootRef,
    rowIds,
    columnIds,
    editable,
    shortcuts,
    onFocusSearch,
    rtl,
  } = options;

  const [focusedCell, setFocusedCell] = React.useState<FocusedCell | null>(null);

  const bindings = React.useMemo(
    () => ({ ...DEFAULT_SHORTCUTS, ...shortcuts }),
    [shortcuts],
  );

  const latest = React.useRef({ rowIds, columnIds, focusedCell, api, editable });
  latest.current = { rowIds, columnIds, focusedCell, api, editable };

  React.useEffect(() => {
    const node = rootRef.current;
    if (!node || !enabled) return undefined;

    const onKeyDown = (event: KeyboardEvent): void => {
      const { rowIds: rows, columnIds: cols, focusedCell: focus, api: grid } = latest.current;
      const typing = isTypingTarget(event.target);

      /* ---- global shortcuts ---------------------------------------- */
      if (matches(event, bindings.search) || matches(event, bindings.commandPalette)) {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }
      if (matches(event, bindings.export)) {
        event.preventDefault();
        void grid.exportData({ format: 'csv' });
        return;
      }
      if (!typing && matches(event, bindings.selectAll)) {
        event.preventDefault();
        grid.selectAll('page');
        return;
      }
      if (matches(event, bindings.nextPage)) {
        event.preventDefault();
        grid.nextPage();
        return;
      }
      if (matches(event, bindings.prevPage)) {
        event.preventDefault();
        grid.previousPage();
        return;
      }

      if (typing) return;

      /* ---- cell navigation ------------------------------------------ */
      const move = (rowDelta: number, columnDelta: number): void => {
        event.preventDefault();
        const current = focus ?? { rowIndex: 0, columnIndex: 0 };
        setFocusedCell({
          rowIndex: clamp(current.rowIndex + rowDelta, 0, Math.max(0, rows.length - 1)),
          columnIndex: clamp(current.columnIndex + columnDelta, 0, Math.max(0, cols.length - 1)),
        });
      };

      switch (event.key) {
        case 'ArrowDown':
          move(1, 0);
          return;
        case 'ArrowUp':
          move(-1, 0);
          return;
        case 'ArrowRight':
          move(0, rtl ? -1 : 1);
          return;
        case 'ArrowLeft':
          move(0, rtl ? 1 : -1);
          return;
        case 'Home':
          event.preventDefault();
          setFocusedCell({ rowIndex: 0, columnIndex: focus?.columnIndex ?? 0 });
          return;
        case 'End':
          event.preventDefault();
          setFocusedCell({ rowIndex: rows.length - 1, columnIndex: focus?.columnIndex ?? 0 });
          return;
        case 'PageDown':
          event.preventDefault();
          grid.nextPage();
          return;
        case 'PageUp':
          event.preventDefault();
          grid.previousPage();
          return;
        default:
          break;
      }

      if (!focus) return;
      const rowId = rows[focus.rowIndex];
      const columnId = cols[focus.columnIndex];

      if (matches(event, bindings.toggleSelect) && rowId) {
        event.preventDefault();
        grid.toggleRow(rowId);
        return;
      }
      if (matches(event, bindings.edit) && rowId && columnId) {
        event.preventDefault();
        if (latest.current.editable) grid.startEditing(rowId, columnId);
        return;
      }
      if (matches(event, bindings.cancel)) {
        grid.stopEditing(false);
        setFocusedCell(null);
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [enabled, rootRef, bindings, onFocusSearch, rtl]);

  return { focusedCell, setFocusedCell };
}
