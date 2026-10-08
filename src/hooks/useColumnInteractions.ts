import * as React from 'react';
import type { GridApi } from '../types';

/* ------------------------------------------------------------------ *
 * Resizing
 * ------------------------------------------------------------------ */

export interface ColumnResizeState {
  columnId: string | null;
  /** Attach to the resize handle of `columnId`. */
  start: (event: React.PointerEvent, columnId: string, currentWidth: number) => void;
}

/**
 * Pointer-driven column resizing.
 *
 * Width is committed continuously (not just on release) so the layout tracks
 * the pointer. RTL is handled by inverting the delta.
 */
export function useColumnResize<T>(api: GridApi<T>, rtl: boolean): ColumnResizeState {
  const [columnId, setColumnId] = React.useState<string | null>(null);
  const session = React.useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const start = React.useCallback(
    (event: React.PointerEvent, id: string, currentWidth: number) => {
      event.preventDefault();
      event.stopPropagation();
      session.current = { id, startX: event.clientX, startWidth: currentWidth };
      setColumnId(id);

      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture?.(event.pointerId);
    },
    [],
  );

  React.useEffect(() => {
    if (!columnId) return undefined;

    const onMove = (event: PointerEvent): void => {
      const current = session.current;
      if (!current) return;
      const delta = (event.clientX - current.startX) * (rtl ? -1 : 1);
      api.resizeColumn(current.id, Math.round(current.startWidth + delta));
    };

    const onUp = (): void => {
      session.current = null;
      setColumnId(null);
    };

    // Listening on the document keeps the drag alive when the pointer leaves
    // the handle, which is the whole point of a resize gesture.
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);

    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [columnId, api, rtl]);

  return { columnId, start };
}

/* ------------------------------------------------------------------ *
 * Reordering
 * ------------------------------------------------------------------ */

export interface ColumnDragState {
  draggingId: string | null;
  overId: string | null;
  handlers: (columnId: string) => {
    draggable: boolean;
    onDragStart: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

/** HTML5 drag-and-drop column reordering. */
export function useColumnDrag<T>(api: GridApi<T>, order: string[]): ColumnDragState {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const orderRef = React.useRef(order);
  orderRef.current = order;

  const handlers = React.useCallback(
    (columnId: string) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent): void => {
        setDraggingId(columnId);
        event.dataTransfer.effectAllowed = 'move';
        // Firefox refuses to start a drag without data on the transfer.
        event.dataTransfer.setData('text/plain', columnId);
      },
      onDragOver: (event: React.DragEvent): void => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setOverId(columnId);
      },
      onDragLeave: (): void => setOverId((current) => (current === columnId ? null : current)),
      onDrop: (event: React.DragEvent): void => {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData('text/plain') || draggingId;
        setDraggingId(null);
        setOverId(null);
        if (!sourceId || sourceId === columnId) return;
        const targetIndex = orderRef.current.indexOf(columnId);
        if (targetIndex === -1) return;
        api.moveColumn(sourceId, targetIndex);
      },
      onDragEnd: (): void => {
        setDraggingId(null);
        setOverId(null);
      },
    }),
    [api, draggingId],
  );

  return { draggingId, overId, handlers };
}
