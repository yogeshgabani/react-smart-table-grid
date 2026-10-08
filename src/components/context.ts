import * as React from 'react';
import type { GridLabels, GridRow } from '../types';
import type { GridInstance } from '../hooks/useGrid';
import type { ColumnDragState, ColumnResizeState } from '../hooks/useColumnInteractions';
import { SmartDataGridError } from '../core/errors';

export interface GridContextValue<T = GridRow> extends GridInstance<T> {
  labels: GridLabels;
  resize: ColumnResizeState;
  drag: ColumnDragState;
  rtl: boolean;
  /** Search term currently highlighted in cells, or undefined. */
  highlight?: string;
  focusedCell: { rowIndex: number; columnIndex: number } | null;
  setFocusedCell: (cell: { rowIndex: number; columnIndex: number } | null) => void;
  announce: (message: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridContext = React.createContext<GridContextValue<any> | null>(null);

export const GridProvider = GridContext.Provider;

export function useGridContext<T = GridRow>(): GridContextValue<T> {
  const value = React.useContext(GridContext);
  if (!value) {
    throw new SmartDataGridError(
      'missing-grid-context',
      'This component must be rendered inside <SmartDataGrid>.',
    );
  }
  return value as GridContextValue<T>;
}
