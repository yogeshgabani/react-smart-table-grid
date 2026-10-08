import type {
  ColumnDef,
  GridRow,
  GridState,
  ResolvedColumn,
  ResponsiveMode,
} from '../types';
import { getByPath, clamp } from '../utils';
import { warnOnce } from './errors';

/** Ids reserved for grid-generated columns. */
export const SELECT_COLUMN_ID = '__select__';
export const EXPANDER_COLUMN_ID = '__expander__';
export const ACTIONS_COLUMN_ID = '__actions__';
export const DRAG_COLUMN_ID = '__drag__';

export const SYSTEM_COLUMN_IDS = [
  SELECT_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  ACTIONS_COLUMN_ID,
  DRAG_COLUMN_ID,
] as const;

export function isSystemColumn(id: string): boolean {
  return (SYSTEM_COLUMN_IDS as readonly string[]).includes(id);
}

/** Sort weight that keeps the grid's own leading columns ahead of user columns. */
const LEADING_RANK: Record<string, number> = {
  [DRAG_COLUMN_ID]: 0,
  [SELECT_COLUMN_ID]: 1,
  [EXPANDER_COLUMN_ID]: 2,
};

function leadingRank(id: string): number {
  return LEADING_RANK[id] ?? 3;
}

function trailingRank(id: string): number {
  return id === ACTIONS_COLUMN_ID ? 1 : 0;
}

export const DEFAULT_COLUMN_WIDTH = 160;
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

export interface HeaderCellNode<T> {
  column: ResolvedColumn<T>;
  colSpan: number;
  rowSpan: number;
  depth: number;
  isPlaceholder: boolean;
}

export interface ColumnDefaults {
  sortable: boolean;
  filterable: boolean;
  resizable: boolean;
  reorderable: boolean;
  editable: boolean;
  searchable: boolean;
  hideable: boolean;
  pinnable: boolean;
}

export interface ResolveColumnsInput<T> {
  columns: ColumnDef<T>[];
  state: GridState;
  defaults: ColumnDefaults;
  /** Width of the scroll viewport, used to grow `flex` columns. */
  containerWidth?: number;
  /** Viewport width, used by responsive column hiding. */
  viewportWidth?: number;
  responsive?: ResponsiveMode;
}

export interface ResolvedColumns<T> {
  /** Every leaf column, in user order, including hidden ones. */
  all: ResolvedColumn<T>[];
  /** Leaf columns that render, ordered left → right with pins applied. */
  visible: ResolvedColumn<T>[];
  leftPinned: ResolvedColumn<T>[];
  rightPinned: ResolvedColumn<T>[];
  center: ResolvedColumn<T>[];
  /** One entry per header level. Length > 1 means grouped headers. */
  headerRows: HeaderCellNode<T>[][];
  byId: Map<string, ResolvedColumn<T>>;
  totalWidth: number;
  maxDepth: number;
  hasGroups: boolean;
}

function columnId<T>(column: ColumnDef<T>, index: number, parentId?: string): string {
  if (column.id) return column.id;
  if (column.accessorKey) return column.accessorKey;
  if (column.columns?.length) return `${parentId ?? 'group'}-${index}`;
  warnOnce(
    'column-missing-id',
    `A column at index ${index} has neither "id" nor "accessorKey". Give it an "id" so state (sorting, sizing, visibility) can address it.`,
  );
  return `column-${index}`;
}

function makeGetValue<T>(column: ColumnDef<T>): (row: T, index: number) => unknown {
  if (column.accessorFn) return column.accessorFn;
  const key = column.accessorKey;
  if (!key) return () => undefined;
  if (!key.includes('.')) return (row: T) => (row as GridRow)[key];
  return (row: T) => getByPath(row, key);
}

/**
 * Turn user column definitions into the flat, fully-defaulted list the renderer
 * works with — applying visibility, order, sizing and pinning from grid state.
 */
export function resolveColumns<T>(input: ResolveColumnsInput<T>): ResolvedColumns<T> {
  const { columns, state, defaults, containerWidth, viewportWidth, responsive } = input;

  const all: ResolvedColumn<T>[] = [];
  const byId = new Map<string, ResolvedColumn<T>>();
  let maxDepth = 0;

  const build = (defs: ColumnDef<T>[], depth: number, parentId?: string): ResolvedColumn<T>[] => {
    return defs.map((def, index) => {
      const id = columnId(def, index, parentId);
      const isGroup = Boolean(def.columns?.length);
      const resolved: ResolvedColumn<T> = {
        ...def,
        id,
        depth,
        parentId,
        isLeaf: !isGroup,
        leaves: [],
        computedWidth: 0,
        sortable: def.sortable ?? (isGroup ? false : defaults.sortable),
        filterable: def.filterable ?? (isGroup ? false : defaults.filterable),
        resizable: def.resizable ?? (isGroup ? false : defaults.resizable),
        reorderable: def.reorderable ?? (isGroup ? false : defaults.reorderable),
        searchable: def.searchable ?? defaults.searchable,
        hideable: def.hideable ?? defaults.hideable,
        pinnable: def.pinnable ?? defaults.pinnable,
        editable: def.editable ?? (isGroup ? false : defaults.editable),
        minWidth: def.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
        getValue: makeGetValue(def),
      };

      if (depth > maxDepth) maxDepth = depth;
      byId.set(id, resolved);

      if (isGroup) {
        const children = build(def.columns as ColumnDef<T>[], depth + 1, id);
        resolved.leaves = children.flatMap((child) => (child.isLeaf ? [child] : child.leaves));
      } else {
        resolved.leaves = [resolved];
        all.push(resolved);
      }
      return resolved;
    });
  };

  const tree = build(columns, 0);

  /* ---- visibility ------------------------------------------------- */
  const isVisible = (column: ResolvedColumn<T>): boolean => {
    const explicit = state.columnVisibility[column.id];
    if (explicit !== undefined) return explicit;
    if (column.hidden) return false;
    if (
      responsive === 'priority' &&
      viewportWidth != null &&
      column.minViewport != null &&
      viewportWidth < column.minViewport
    ) {
      return false;
    }
    return true;
  };

  /* ---- order ------------------------------------------------------ */
  const orderIndex = new Map<string, number>();
  state.columnOrder.forEach((id, index) => orderIndex.set(id, index));
  const ordered =
    state.columnOrder.length > 0
      ? all.slice().sort((a, b) => {
          const ai = orderIndex.get(a.id);
          const bi = orderIndex.get(b.id);
          if (ai == null && bi == null) return 0;
          if (ai == null) return 1;
          if (bi == null) return -1;
          return ai - bi;
        })
      : all;

  const visibleLeaves = ordered.filter(isVisible);

  /* ---- sizing ----------------------------------------------------- */
  for (const column of visibleLeaves) {
    const stateWidth = state.columnSizing[column.id];
    const base = stateWidth ?? column.width ?? DEFAULT_COLUMN_WIDTH;
    column.computedWidth = clamp(
      base,
      column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
      column.maxWidth ?? Number.MAX_SAFE_INTEGER,
    );
  }

  // Grow flexible columns into the leftover horizontal space.
  const naturalWidth = visibleLeaves.reduce((sum, c) => sum + c.computedWidth, 0);
  if (containerWidth && containerWidth > naturalWidth) {
    const flexColumns = visibleLeaves.filter((c) => (c.flex ?? 0) > 0 && !state.columnSizing[c.id]);
    const totalFlex = flexColumns.reduce((sum, c) => sum + (c.flex ?? 0), 0);
    if (totalFlex > 0) {
      const extra = containerWidth - naturalWidth;
      for (const column of flexColumns) {
        const share = (extra * (column.flex ?? 0)) / totalFlex;
        column.computedWidth = clamp(
          column.computedWidth + share,
          column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
          column.maxWidth ?? Number.MAX_SAFE_INTEGER,
        );
      }
    }
  }

  /* ---- pinning ---------------------------------------------------- */
  const pinOf = (column: ResolvedColumn<T>): 'left' | 'right' | false => {
    if (state.columnPinning.left.includes(column.id)) return 'left';
    if (state.columnPinning.right.includes(column.id)) return 'right';
    return column.pinned === 'left' || column.pinned === 'right' ? column.pinned : false;
  };

  const leftPinned: ResolvedColumn<T>[] = [];
  const rightPinned: ResolvedColumn<T>[] = [];
  const center: ResolvedColumn<T>[] = [];

  for (const column of visibleLeaves) {
    const pin = pinOf(column);
    column.pinned = pin;
    column.pinnedEdge = false;
    if (pin === 'left') leftPinned.push(column);
    else if (pin === 'right') rightPinned.push(column);
    else center.push(column);
  }

  // Grid-generated columns always bookend the row: drag → select → expander at
  // the very start, actions at the very end. Sort is stable, so user columns
  // keep their relative order.
  leftPinned.sort((a, b) => leadingRank(a.id) - leadingRank(b.id));
  center.sort((a, b) => leadingRank(a.id) - leadingRank(b.id));
  rightPinned.sort((a, b) => trailingRank(a.id) - trailingRank(b.id));

  let leftOffset = 0;
  for (const column of leftPinned) {
    column.pinnedOffset = leftOffset;
    leftOffset += column.computedWidth;
  }
  if (leftPinned.length) leftPinned[leftPinned.length - 1].pinnedEdge = true;

  let rightOffset = 0;
  for (let i = rightPinned.length - 1; i >= 0; i -= 1) {
    rightPinned[i].pinnedOffset = rightOffset;
    rightOffset += rightPinned[i].computedWidth;
  }
  if (rightPinned.length) rightPinned[0].pinnedEdge = true;

  const visible = [...leftPinned, ...center, ...rightPinned];

  /* ---- header rows ------------------------------------------------ */
  // Built from `visible`, never from the definition tree. Pinning reorders the
  // body, so deriving the header from anything else shifts every heading out of
  // alignment with its column.
  const ancestorChains = visible.map((leaf) => {
    const chain: ResolvedColumn<T>[] = [];
    let current: ResolvedColumn<T> | undefined = leaf;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return chain;
  });

  const visibleMaxDepth = visible.reduce((deepest, leaf) => Math.max(deepest, leaf.depth), 0);
  const headerRows: HeaderCellNode<T>[][] = [];

  for (let level = 0; level <= visibleMaxDepth; level += 1) {
    const row: HeaderCellNode<T>[] = [];
    let index = 0;

    while (index < visible.length) {
      const node = ancestorChains[index][level];

      // This leaf is shallower than the current level — its own cell already
      // spans down to here via rowSpan.
      if (!node) {
        index += 1;
        continue;
      }

      if (node.isLeaf) {
        row.push({
          column: node,
          colSpan: 1,
          rowSpan: visibleMaxDepth - level + 1,
          depth: level,
          isPlaceholder: false,
        });
        index += 1;
        continue;
      }

      // Consume the run of adjacent leaves sharing this ancestor. If pinning
      // splits a group, each contiguous run gets its own header cell, which is
      // exactly what the split should look like.
      let span = 1;
      while (index + span < visible.length && ancestorChains[index + span][level]?.id === node.id) {
        span += 1;
      }
      row.push({ column: node, colSpan: span, rowSpan: 1, depth: level, isPlaceholder: false });
      index += span;
    }

    if (row.length > 0) headerRows.push(row);
  }

  return {
    all: ordered,
    visible,
    leftPinned,
    rightPinned,
    center,
    headerRows: headerRows.filter((row) => row.length > 0),
    byId,
    totalWidth: visible.reduce((sum, c) => sum + c.computedWidth, 0),
    maxDepth,
    hasGroups: maxDepth > 0,
  };
}
