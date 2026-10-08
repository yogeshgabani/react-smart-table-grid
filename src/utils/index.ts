/** Small, dependency-free helpers shared across the grid. */

/** Join class names, dropping falsy entries. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    out = out ? `${out} ${part}` : part;
  }
  return out;
}

type Plain = Record<string, unknown>;

function isPlainObject(value: unknown): value is Plain {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-merge `source` onto `target`, right-most wins.
 * Arrays and class instances are replaced, never merged — merging arrays makes
 * "override the preset's pageSizeOptions" impossible to express.
 */
export function deepMerge<A extends object, B extends object>(target: A, source: B): A & B {
  const out: Plain = { ...(target as Plain) };
  for (const key of Object.keys(source as Plain)) {
    const next = (source as Plain)[key];
    if (next === undefined) continue;
    const prev = out[key];
    out[key] = isPlainObject(prev) && isPlainObject(next) ? deepMerge(prev, next) : next;
  }
  return out as A & B;
}

/** Merge a list of partial objects left-to-right. Later entries win. */
export function mergeAll<T extends object>(...sources: Array<Partial<T> | undefined | null>): T {
  let out = {} as T;
  for (const source of sources) {
    if (!source) continue;
    out = deepMerge(out, source) as T;
  }
  return out;
}

/** Read `a.b.c` out of a nested object without throwing on missing links. */
export function getByPath(source: unknown, path: string): unknown {
  if (source == null) return undefined;
  if (!path.includes('.')) return (source as Plain)[path];
  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (current == null) return undefined;
    current = (current as Plain)[segment];
  }
  return current;
}

/** Immutably write `a.b.c` into a nested object. */
export function setByPath<T extends object>(source: T, path: string, value: unknown): T {
  if (!path.includes('.')) return { ...source, [path]: value };
  const [head, ...rest] = path.split('.');
  const child = (source as Plain)[head];
  return {
    ...source,
    [head]: setByPath(isPlainObject(child) ? child : {}, rest.join('.'), value),
  } as T;
}

/** Coerce anything into a comparable, searchable string. */
export function toText(value: unknown): string {
  if (value == null) return '';
  const type = typeof value;
  if (type === 'string') return value as string;
  if (type === 'number' || type === 'bigint' || type === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toText).join(', ');
  if (type === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return Number.isNaN(value.getTime());
  return false;
}

/** Best-effort numeric coercion. Returns `null` when the value isn't numeric. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[\s,_]/g, '');
    if (cleaned === '') return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a `YYYY-MM-DD` string as a local calendar day. `new Date('2024-01-05')`
 * reads it as UTC midnight, which shows as Jan 4 anywhere west of Greenwich.
 */
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = DATE_ONLY.exec(value.trim());
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Best-effort date coercion. Returns `null` when the value isn't a date. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const day = parseDateOnly(value);
    if (day) return day;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** A date as the local `YYYY-MM-DD` (or `YYYY-MM-DDTHH:mm`) an `<input>` expects. */
export function toLocalInputValue(date: Date, withTime = false): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

const SAFE_SCHEME = /^(?:https?|mailto|tel|ftp):/i;

/**
 * Vet a URL taken from row data before it becomes an `href`. Web, mail and
 * phone links pass, as do relative URLs; `javascript:`, `data:`, `vbscript:`
 * and other schemes return `undefined`.
 */
export function safeHref(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  // Browsers ignore whitespace and control characters inside a scheme
  // ("java\tscript:"), so strip them before looking at it.
  const normalized = trimmed.replace(/[\u0000- \u007F]+/g, '');
  if (!/^[a-z][a-z0-9+.-]*:/i.test(normalized)) return trimmed;
  return SAFE_SCHEME.test(normalized) ? trimmed : undefined;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Move an item within an array, returning a new array. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(clamp(to, 0, next.length), 0, moved);
  return next;
}

let idCounter = 0;
/** Monotonic ids. Deliberately not random so SSR and hydration agree. */
export function nextId(prefix = 'sdg'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** Stable key for memoising derived data across renders. */
export function hashKey(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Add a `px` suffix to bare numbers; pass strings through untouched. */
export function px(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}
