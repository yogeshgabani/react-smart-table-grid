import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FiltersState,
  FilterType,
  ResolvedColumn,
} from '../types';
import { isEmptyValue, parseDateOnly, toDate, toNumber, toText } from '../utils';
import { compareValues } from './sort';

export function isFilterGroup(node: FilterNode): node is FilterGroup {
  return (node as FilterGroup).conditions !== undefined;
}

/** Operators that don't read `condition.value`. */
export const UNARY_OPERATORS: FilterOperator[] = ['isEmpty', 'isNotEmpty'];

/** Which operators make sense for each filter type — drives the filter UI. */
export const OPERATORS_BY_TYPE: Record<FilterType, FilterOperator[]> = {
  text: [
    'contains',
    'notContains',
    'equals',
    'notEquals',
    'startsWith',
    'endsWith',
    'isEmpty',
    'isNotEmpty',
  ],
  number: [
    'equals',
    'notEquals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'between',
    'isEmpty',
    'isNotEmpty',
  ],
  date: [
    'equals',
    'notEquals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'isEmpty',
    'isNotEmpty',
  ],
  dateRange: ['between', 'isEmpty', 'isNotEmpty'],
  select: ['equals', 'notEquals', 'in', 'notIn', 'isEmpty', 'isNotEmpty'],
  multiSelect: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  boolean: ['equals', 'notEquals'],
  checkbox: ['in', 'notIn'],
  radio: ['equals', 'notEquals'],
  slider: ['between', 'greaterThanOrEqual', 'lessThanOrEqual'],
  custom: ['equals'],
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'is',
  notEquals: 'is not',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  endsWith: 'ends with',
  greaterThan: 'is greater than',
  greaterThanOrEqual: 'is greater than or equal to',
  lessThan: 'is less than',
  lessThanOrEqual: 'is less than or equal to',
  between: 'is between',
  in: 'is any of',
  notIn: 'is none of',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
};

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'string') return value.split(',').map((part) => part.trim());
  return [value];
}

/**
 * A `YYYY-MM-DD` target (what a date input yields) stands for the whole local
 * day, so "is 2024-01-05" matches any time on that day rather than only its
 * first millisecond. Returns -1 / 0 / 1 for before / during / after the day,
 * or `null` when either side isn't a date.
 */
function compareToDay(value: unknown, target: unknown): number | null {
  const day = parseDateOnly(target);
  if (!day) return null;
  const date = toDate(value);
  if (!date) return null;
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
  const time = date.getTime();
  if (time < day.getTime()) return -1;
  return time >= end ? 1 : 0;
}

/** Compare two values the same way the operator family expects. */
function relational(value: unknown, target: unknown): number {
  const byDay = compareToDay(value, target);
  if (byDay !== null) return byDay;

  const vn = toNumber(value);
  const tn = toNumber(target);
  if (vn !== null && tn !== null) return vn - tn;

  const vd = toDate(value);
  const td = toDate(target);
  if (vd && td) return vd.getTime() - td.getTime();

  return compareValues(value, target);
}

function looseEquals(value: unknown, target: unknown, caseSensitive: boolean): boolean {
  if (value === target) return true;
  if (isEmptyValue(value) && isEmptyValue(target)) return true;

  const byDay = compareToDay(value, target);
  if (byDay !== null) return byDay === 0;

  if (typeof target === 'boolean' || typeof value === 'boolean') {
    return Boolean(value) === Boolean(target);
  }

  const vn = toNumber(value);
  const tn = toNumber(target);
  if (vn !== null && tn !== null) return vn === tn;

  const vd = toDate(value);
  const td = toDate(target);
  if (vd && td) return vd.getTime() === td.getTime();

  const a = toText(value);
  const b = toText(target);
  return caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
}

/** Evaluate one condition against one already-extracted cell value. */
export function evaluateOperator(value: unknown, condition: FilterCondition): boolean {
  const { operator, value: target, value2, caseSensitive = false } = condition;

  switch (operator) {
    case 'isEmpty':
      return isEmptyValue(value);
    case 'isNotEmpty':
      return !isEmptyValue(value);
    default:
      break;
  }

  // A condition with no value is treated as inactive rather than as
  // "match nothing" — half-built filter rows shouldn't blank the grid.
  if (target === undefined || target === null || target === '') {
    if (operator !== 'between') return true;
    if (value2 === undefined || value2 === null || value2 === '') return true;
  }

  switch (operator) {
    case 'equals':
      return looseEquals(value, target, caseSensitive);
    case 'notEquals':
      return !looseEquals(value, target, caseSensitive);

    case 'contains': {
      const text = caseSensitive ? toText(value) : toText(value).toLowerCase();
      const needle = caseSensitive ? toText(target) : toText(target).toLowerCase();
      return text.includes(needle);
    }
    case 'notContains': {
      const text = caseSensitive ? toText(value) : toText(value).toLowerCase();
      const needle = caseSensitive ? toText(target) : toText(target).toLowerCase();
      return !text.includes(needle);
    }
    case 'startsWith': {
      const text = caseSensitive ? toText(value) : toText(value).toLowerCase();
      const needle = caseSensitive ? toText(target) : toText(target).toLowerCase();
      return text.startsWith(needle);
    }
    case 'endsWith': {
      const text = caseSensitive ? toText(value) : toText(value).toLowerCase();
      const needle = caseSensitive ? toText(target) : toText(target).toLowerCase();
      return text.endsWith(needle);
    }

    case 'greaterThan':
      return relational(value, target) > 0;
    case 'greaterThanOrEqual':
      return relational(value, target) >= 0;
    case 'lessThan':
      return relational(value, target) < 0;
    case 'lessThanOrEqual':
      return relational(value, target) <= 0;

    case 'between': {
      const [lo, hi] = Array.isArray(target) ? target : [target, value2];
      if (lo == null && hi == null) return true;
      if (lo != null && relational(value, lo) < 0) return false;
      if (hi != null && relational(value, hi) > 0) return false;
      return true;
    }

    case 'in': {
      const list = asList(target);
      if (list.length === 0) return true;
      // Multi-value cells match when they intersect the selection.
      if (Array.isArray(value)) {
        return value.some((entry) => list.some((item) => looseEquals(entry, item, caseSensitive)));
      }
      return list.some((item) => looseEquals(value, item, caseSensitive));
    }
    case 'notIn': {
      const list = asList(target);
      if (list.length === 0) return true;
      if (Array.isArray(value)) {
        return !value.some((entry) => list.some((item) => looseEquals(entry, item, caseSensitive)));
      }
      return !list.some((item) => looseEquals(value, item, caseSensitive));
    }

    default:
      return true;
  }
}

/** Evaluate a condition or group against a row. */
export function evaluateNode<T>(
  node: FilterNode,
  row: T,
  rowIndex: number,
  columns: Map<string, ResolvedColumn<T>>,
): boolean {
  if (node.disabled) return true;

  if (isFilterGroup(node)) {
    const active = node.conditions.filter((child) => !child.disabled);
    if (active.length === 0) return true;

    switch (node.operator) {
      case 'OR':
        return active.some((child) => evaluateNode(child, row, rowIndex, columns));
      case 'NOT':
        return !active.some((child) => evaluateNode(child, row, rowIndex, columns));
      case 'AND':
      default:
        return active.every((child) => evaluateNode(child, row, rowIndex, columns));
    }
  }

  const column = columns.get(node.field);
  if (!column) return true;
  if (column.filterFn) return column.filterFn(row, node);

  return evaluateOperator(column.getValue(row, rowIndex), node);
}

/** Apply the whole filter tree. Top-level groups are ANDed together. */
export function filterRows<T>(
  rows: T[],
  filters: FiltersState,
  columns: Map<string, ResolvedColumn<T>>,
): T[] {
  const active = filters.filter((group) => !group.disabled && group.conditions.length > 0);
  if (active.length === 0) return rows;
  return rows.filter((row, index) =>
    active.every((group) => evaluateNode(group, row, index, columns)),
  );
}

/** Count leaf conditions, for the "3 filters active" badge. */
export function countConditions(filters: FiltersState): number {
  let count = 0;
  const walk = (nodes: FilterNode[]): void => {
    for (const node of nodes) {
      if (node.disabled) continue;
      if (isFilterGroup(node)) walk(node.conditions);
      else count += 1;
    }
  };
  walk(filters);
  return count;
}

/** Default operator for a filter type. */
export function defaultOperator(type: FilterType = 'text'): FilterOperator {
  return OPERATORS_BY_TYPE[type]?.[0] ?? 'equals';
}

/** Infer a sensible filter type when a column doesn't declare one. */
export function inferFilterType<T>(column: ResolvedColumn<T>, sample?: unknown): FilterType {
  if (column.filterType) return column.filterType;
  if (column.filterOptions?.length) return 'select';

  switch (column.type) {
    case 'number':
    case 'currency':
    case 'percentage':
    case 'progress':
    case 'rating':
      return 'number';
    case 'date':
    case 'datetime':
    case 'relativeTime':
      return 'date';
    case 'boolean':
    case 'checkbox':
    case 'switch':
      return 'boolean';
    case 'badge':
    case 'status':
    case 'tags':
      return 'select';
    default:
      break;
  }

  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'boolean') return 'boolean';
  if (sample instanceof Date) return 'date';
  return 'text';
}

/** Collect distinct values for select-style filters. */
export function collectOptions<T>(rows: T[], column: ResolvedColumn<T>, limit = 200) {
  const seen = new Map<string, unknown>();
  for (let i = 0; i < rows.length && seen.size < limit; i += 1) {
    const value = column.getValue(rows[i], i);
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (isEmptyValue(entry)) continue;
      const key = toText(entry);
      if (!seen.has(key)) seen.set(key, entry);
    }
  }
  return Array.from(seen.entries())
    .map(([label, value]) => ({ label, value: value as string | number | boolean }))
    .sort((a, b) => compareValues(a.label, b.label));
}

export const emptyFilters: FiltersState = [];

/** Build a fresh top-level AND group. */
export function createFilterGroup(operator: FilterGroup['operator'] = 'AND'): FilterGroup {
  return { id: `group-${Date.now().toString(36)}`, operator, conditions: [] };
}
