import type { AggregateType, ResolvedColumn } from '../types';
import { isEmptyValue, toNumber, toText } from '../utils';
import { compareValues } from './sort';

/** Run one built-in aggregation over a column's values. */
export function runAggregate(type: AggregateType, values: unknown[]): unknown {
  switch (type) {
    case 'count':
      return values.length;

    case 'countDistinct':
      return new Set(values.filter((v) => !isEmptyValue(v)).map(toText)).size;

    case 'first':
      return values.length ? values[0] : undefined;

    case 'last':
      return values.length ? values[values.length - 1] : undefined;

    case 'sum':
    case 'avg': {
      let sum = 0;
      let count = 0;
      for (const value of values) {
        const n = toNumber(value);
        if (n === null) continue;
        sum += n;
        count += 1;
      }
      if (count === 0) return type === 'sum' ? 0 : undefined;
      return type === 'sum' ? sum : sum / count;
    }

    case 'min':
    case 'max': {
      const present = values.filter((v) => !isEmptyValue(v));
      if (present.length === 0) return undefined;
      return present.reduce((best, value) => {
        const cmp = compareValues(value, best);
        if (type === 'min') return cmp < 0 ? value : best;
        return cmp > 0 ? value : best;
      });
    }

    default:
      return undefined;
  }
}

/** Aggregate a single column over a row set. */
export function aggregateColumn<T>(rows: T[], column: ResolvedColumn<T>): unknown {
  if (!column.aggregate) return undefined;
  if (typeof column.aggregate === 'function') return column.aggregate(rows, column.id);
  const values = rows.map((row, index) => column.getValue(row, index));
  return runAggregate(column.aggregate, values);
}

/** Aggregate every column that declares an aggregation. */
export function aggregateColumns<T>(
  rows: T[],
  columns: ResolvedColumn<T>[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const column of columns) {
    if (!column.aggregate) continue;
    out[column.id] = aggregateColumn(rows, column);
  }
  return out;
}
