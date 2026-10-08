import type { GroupingState, ResolvedColumn, TreeConfig } from '../types';
import { toText } from '../utils';
import { aggregateColumns } from './aggregate';

/* ------------------------------------------------------------------ *
 * Display row model
 *
 * The body renders a flat list regardless of whether the data is flat,
 * grouped or a tree. Everything upstream collapses into `DisplayRow`.
 * ------------------------------------------------------------------ */

export interface DataDisplayRow<T> {
  kind: 'row';
  id: string;
  row: T;
  /** Index within the pre-pagination row set — used by accessors. */
  index: number;
  depth: number;
  parentId?: string;
  hasChildren: boolean;
  expanded: boolean;
  /** Number of descendants, for tree selection cascades. */
  childCount: number;
  loading?: boolean;
}

export interface GroupDisplayRow {
  kind: 'group';
  id: string;
  depth: number;
  columnId: string;
  value: unknown;
  count: number;
  aggregates: Record<string, unknown>;
  expanded: boolean;
  /** Ids of the leaf rows inside this group. */
  rowIds: string[];
}

export interface DetailDisplayRow<T> {
  kind: 'detail';
  id: string;
  depth: number;
  row: T;
  index: number;
  parentId: string;
}

export type DisplayRow<T> = DataDisplayRow<T> | GroupDisplayRow | DetailDisplayRow<T>;

export function isDataRow<T>(row: DisplayRow<T>): row is DataDisplayRow<T> {
  return row.kind === 'row';
}

/* ------------------------------------------------------------------ *
 * Row identity
 * ------------------------------------------------------------------ */

export function makeRowIdGetter<T>(
  getRowId: keyof T | ((row: T, index: number) => string) | undefined,
): (row: T, index: number) => string {
  if (typeof getRowId === 'function') return getRowId;
  if (typeof getRowId === 'string') {
    return (row: T, index: number) => {
      const value = (row as Record<string, unknown>)[getRowId];
      return value == null ? String(index) : toText(value);
    };
  }
  // Fall back to a conventional `id` field, then the index.
  return (row: T, index: number) => {
    const value = (row as Record<string, unknown>).id ?? (row as Record<string, unknown>)._id;
    return value == null ? String(index) : toText(value);
  };
}

/* ------------------------------------------------------------------ *
 * Tree data
 * ------------------------------------------------------------------ */

export interface TreeNode<T> {
  row: T;
  id: string;
  index: number;
  children: TreeNode<T>[];
}

/**
 * Build a node tree from either nested data (`children` key) or flat data
 * that points at parents (`parentKey`).
 */
export function buildTree<T>(
  rows: T[],
  config: TreeConfig<T>,
  getRowId: (row: T, index: number) => string,
): TreeNode<T>[] {
  const childrenKey = config.childrenKey ?? 'children';
  let counter = 0;

  if (config.parentKey) {
    const parentKey = config.parentKey;
    const nodes = new Map<string, TreeNode<T>>();
    const roots: TreeNode<T>[] = [];

    rows.forEach((row, index) => {
      nodes.set(getRowId(row, index), { row, id: getRowId(row, index), index, children: [] });
    });
    rows.forEach((row, index) => {
      const node = nodes.get(getRowId(row, index))!;
      const parentId = (row as Record<string, unknown>)[parentKey];
      const parent = parentId == null ? undefined : nodes.get(toText(parentId));
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    });
    return roots;
  }

  const walk = (list: T[]): TreeNode<T>[] =>
    list.map((row) => {
      const index = counter;
      counter += 1;
      const rawChildren = (row as Record<string, unknown>)[childrenKey];
      const children = Array.isArray(rawChildren) ? walk(rawChildren as T[]) : [];
      return { row, id: getRowId(row, index), index, children };
    });

  return walk(rows);
}

function countDescendants<T>(node: TreeNode<T>): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

/** Flatten a tree into display rows, honouring the expanded set. */
export function flattenTree<T>(
  nodes: TreeNode<T>[],
  expanded: Set<string>,
  depth = 0,
  parentId?: string,
  out: DisplayRow<T>[] = [],
): DisplayRow<T>[] {
  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    out.push({
      kind: 'row',
      id: node.id,
      row: node.row,
      index: node.index,
      depth,
      parentId,
      hasChildren,
      expanded: isExpanded,
      childCount: countDescendants(node),
    });
    if (hasChildren && isExpanded) {
      flattenTree(node.children, expanded, depth + 1, node.id, out);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Grouping
 * ------------------------------------------------------------------ */

/**
 * Groups start expanded, so the `expanded` state records the exception: a
 * collapsed group is stored under this key rather than its own id.
 */
export function collapsedGroupKey(groupId: string): string {
  return `!${groupId}`;
}

export interface BuildGroupsInput<T> {
  rows: T[];
  grouping: GroupingState;
  columns: Map<string, ResolvedColumn<T>>;
  aggregateColumnList: ResolvedColumn<T>[];
  expanded: Set<string>;
  getRowId: (row: T, index: number) => string;
  /** Groups start expanded unless the user has collapsed them. */
  defaultExpanded?: boolean;
}

/**
 * Group rows by one or more columns, emitting a flat list of group headers
 * interleaved with their (visible) rows.
 */
export function buildGroupedRows<T>(input: BuildGroupsInput<T>): DisplayRow<T>[] {
  const {
    rows,
    grouping,
    columns,
    aggregateColumnList,
    expanded,
    getRowId,
    defaultExpanded = true,
  } = input;

  const out: DisplayRow<T>[] = [];

  const walk = (subset: Array<{ row: T; index: number }>, level: number, path: string): void => {
    if (level >= grouping.length) {
      for (const entry of subset) {
        out.push({
          kind: 'row',
          id: getRowId(entry.row, entry.index),
          row: entry.row,
          index: entry.index,
          depth: grouping.length,
          hasChildren: false,
          expanded: false,
          childCount: 0,
        });
      }
      return;
    }

    const columnId = grouping[level];
    const column = columns.get(columnId);
    const buckets = new Map<string, { value: unknown; items: Array<{ row: T; index: number }> }>();

    for (const entry of subset) {
      const value = column ? column.getValue(entry.row, entry.index) : undefined;
      const key = toText(value);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { value, items: [] };
        buckets.set(key, bucket);
      }
      bucket.items.push(entry);
    }

    for (const [key, bucket] of buckets) {
      const groupId = `${path}${columnId}:${key}`;
      const isExpanded = defaultExpanded
        ? !expanded.has(collapsedGroupKey(groupId))
        : expanded.has(groupId);
      const bucketRows = bucket.items.map((item) => item.row);

      out.push({
        kind: 'group',
        id: groupId,
        depth: level,
        columnId,
        value: bucket.value,
        count: bucket.items.length,
        aggregates: aggregateColumns(bucketRows, aggregateColumnList),
        expanded: isExpanded,
        rowIds: bucket.items.map((item) => getRowId(item.row, item.index)),
      });

      if (isExpanded) walk(bucket.items, level + 1, `${groupId}/`);
    }
  };

  walk(
    rows.map((row, index) => ({ row, index })),
    0,
    '',
  );

  return out;
}

/** Flat rows → display rows, with optional expanded detail panels. */
export function toDisplayRows<T>(
  rows: T[],
  getRowId: (row: T, index: number) => string,
  expanded: Set<string>,
  expandable: boolean,
  offset = 0,
): DisplayRow<T>[] {
  const out: DisplayRow<T>[] = [];
  rows.forEach((row, i) => {
    const index = offset + i;
    const id = getRowId(row, index);
    const isExpanded = expandable && expanded.has(id);
    out.push({
      kind: 'row',
      id,
      row,
      index,
      depth: 0,
      hasChildren: expandable,
      expanded: isExpanded,
      childCount: 0,
    });
    if (isExpanded) {
      out.push({ kind: 'detail', id: `${id}__detail`, depth: 1, row, index, parentId: id });
    }
  });
  return out;
}
