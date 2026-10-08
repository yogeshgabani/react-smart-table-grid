import type { ResolvedColumn, SortDirection, SortingState } from '../types';
import { isEmptyValue, toDate, toNumber } from '../utils';

const collator =
  typeof Intl !== 'undefined'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

/**
 * Type-aware comparison. Numbers compare numerically, dates chronologically,
 * strings with a natural-order collator so "item 2" sorts before "item 10".
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;

  const aEmpty = isEmptyValue(a);
  const bEmpty = isEmptyValue(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Number(Boolean(a)) - Number(Boolean(b));
  }

  if (a instanceof Date || b instanceof Date) {
    const ad = toDate(a);
    const bd = toDate(b);
    if (ad && bd) return ad.getTime() - bd.getTime();
  }

  if (typeof a === 'number' && typeof b === 'number') return a - b;

  if (typeof a === 'string' && typeof b === 'string') {
    // Strings that are really dates should still sort chronologically.
    const ad = toDate(a);
    const bd = toDate(b);
    if (ad && bd && /\d{4}-\d{2}-\d{2}/.test(a) && /\d{4}-\d{2}-\d{2}/.test(b)) {
      return ad.getTime() - bd.getTime();
    }
    return collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0;
  }

  const an = toNumber(a);
  const bn = toNumber(b);
  if (an !== null && bn !== null) return an - bn;

  const as = String(a);
  const bs = String(b);
  return collator ? collator.compare(as, bs) : as < bs ? -1 : as > bs ? 1 : 0;
}

/** Sort rows by a multi-column rule set. Stable; returns a new array. */
export function sortRows<T>(
  rows: T[],
  sorting: SortingState,
  columns: Map<string, ResolvedColumn<T>>,
): T[] {
  if (sorting.length === 0 || rows.length < 2) return rows;

  const rules = sorting
    .map((rule) => {
      const column = columns.get(rule.id);
      if (!column) return null;
      return { rule, column };
    })
    .filter((entry): entry is { rule: { id: string; direction: SortDirection }; column: ResolvedColumn<T> } => entry !== null);

  if (rules.length === 0) return rows;

  return rows.slice().sort((rowA, rowB) => {
    for (const { rule, column } of rules) {
      const factor = rule.direction === 'desc' ? -1 : 1;

      if (column.sortComparator) {
        const result = column.sortComparator(rowA, rowB, rule.direction);
        if (result !== 0) return result;
        continue;
      }

      const read = column.sortAccessor ?? ((row: T) => column.getValue(row, 0));
      const a = read(rowA);
      const b = read(rowB);

      // Empty values always sink to the bottom unless the column asks otherwise,
      // so a descending sort doesn't float blanks to the top.
      const aEmpty = isEmptyValue(a);
      const bEmpty = isEmptyValue(b);
      if (aEmpty !== bEmpty) {
        const emptyLast = (column.emptySort ?? 'last') === 'last';
        return aEmpty === emptyLast ? 1 : -1;
      }

      const result = compareValues(a, b) * factor;
      if (result !== 0) return result;
    }
    return 0;
  });
}

/** Cycle a column through asc → desc → unsorted. */
export function toggleSorting(
  sorting: SortingState,
  columnId: string,
  multi: boolean,
): SortingState {
  const existing = sorting.find((rule) => rule.id === columnId);

  if (!existing) {
    const next = { id: columnId, direction: 'asc' as const };
    return multi ? [...sorting, next] : [next];
  }

  if (existing.direction === 'asc') {
    const next = { id: columnId, direction: 'desc' as const };
    return multi ? sorting.map((rule) => (rule.id === columnId ? next : rule)) : [next];
  }

  // Third click clears this column.
  return multi ? sorting.filter((rule) => rule.id !== columnId) : [];
}

export function getSortRule(sorting: SortingState, columnId: string) {
  const index = sorting.findIndex((rule) => rule.id === columnId);
  return index === -1
    ? { direction: null as SortDirection | null, index: -1 }
    : { direction: sorting[index].direction, index };
}

/** Serialize sorting for URLs / APIs: `name.asc,age.desc`. */
export function serializeSorting(sorting: SortingState): string {
  return sorting.map((rule) => `${rule.id}.${rule.direction}`).join(',');
}

export function parseSorting(input: string): SortingState {
  if (!input) return [];
  return input
    .split(',')
    .map((chunk) => {
      const lastDot = chunk.lastIndexOf('.');
      if (lastDot === -1) return { id: chunk, direction: 'asc' as SortDirection };
      const id = chunk.slice(0, lastDot);
      const direction = chunk.slice(lastDot + 1) === 'desc' ? 'desc' : 'asc';
      return { id, direction: direction as SortDirection };
    })
    .filter((rule) => rule.id.length > 0);
}
