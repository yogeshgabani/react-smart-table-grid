import type { GridState, GridStateInput } from '../types';

export function createInitialState(overrides?: GridStateInput): GridState {
  return {
    sorting: [],
    filters: [],
    search: { query: '', columns: {} },
    pagination: { pageIndex: 0, pageSize: 10, cursor: null },
    selection: [],
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    columnPinning: { left: [], right: [] },
    expanded: [],
    grouping: [],
    density: 'comfortable',
    editing: null,
    fullscreen: false,
    ...overrides,
  };
}

/** Merge a controlled `state` prop over the internal state, slice by slice. */
export function mergeControlled(internal: GridState, controlled?: GridStateInput): GridState {
  if (!controlled) return internal;
  let changed = false;
  const next: GridState = { ...internal };

  for (const key of Object.keys(controlled) as Array<keyof GridState>) {
    const value = controlled[key];
    if (value === undefined) continue;
    if (next[key] !== value) changed = true;
    (next as unknown as Record<string, unknown>)[key] = value;
  }
  return changed ? next : internal;
}

/** Slices that should reset the page back to the first one when they change. */
export const PAGE_RESETTING_KEYS: Array<keyof GridState> = ['filters', 'search', 'grouping'];
