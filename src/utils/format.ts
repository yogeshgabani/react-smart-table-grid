import { toDate, toLocalInputValue, toNumber } from './index';

/** Cache Intl instances — constructing them per cell is measurably slow. */
const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function numberFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

function dateFormatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

export interface NumberFormatOptions {
  locale?: string;
  decimals?: number;
  notation?: 'standard' | 'compact';
  prefix?: string;
  suffix?: string;
}

export function formatNumber(value: unknown, options: NumberFormatOptions = {}): string {
  const n = toNumber(value);
  if (n === null) return '';
  const text = numberFormatter(options.locale, {
    minimumFractionDigits: options.decimals,
    maximumFractionDigits: options.decimals ?? 3,
    notation: options.notation,
  }).format(n);
  return `${options.prefix ?? ''}${text}${options.suffix ?? ''}`;
}

export function formatCurrency(
  value: unknown,
  options: NumberFormatOptions & { currency?: string } = {},
): string {
  const n = toNumber(value);
  if (n === null) return '';
  return numberFormatter(options.locale, {
    style: 'currency',
    currency: options.currency ?? 'USD',
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2,
    notation: options.notation,
  }).format(n);
}

export function formatPercent(value: unknown, options: NumberFormatOptions = {}): string {
  const n = toNumber(value);
  if (n === null) return '';
  // Values above 1 are read as already-scaled percentages (85 → 85%).
  const ratio = Math.abs(n) > 1 ? n / 100 : n;
  return numberFormatter(options.locale, {
    style: 'percent',
    minimumFractionDigits: options.decimals ?? 0,
    maximumFractionDigits: options.decimals ?? 1,
  }).format(ratio);
}

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  /** A named preset, or leave undefined for a medium date. */
  dateFormat?: string;
  withTime?: boolean;
}

const DATE_PRESETS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: 'short' },
  medium: { dateStyle: 'medium' },
  long: { dateStyle: 'long' },
  full: { dateStyle: 'full' },
  iso: {},
  time: { timeStyle: 'short' },
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
};

export function formatDate(value: unknown, options: DateFormatOptions = {}): string {
  const date = toDate(value);
  if (!date) return '';

  const preset = options.dateFormat ?? (options.withTime ? 'datetime' : 'medium');
  const pad = (n: number): string => String(n).padStart(2, '0');

  // Local time, like every other preset — `toISOString()` would shift the
  // calendar day for anyone not on UTC.
  if (preset === 'iso') {
    if (!options.withTime) return toLocalInputValue(date);
    return `${toLocalInputValue(date, true).replace('T', ' ')}:${pad(date.getSeconds())}`;
  }

  const intlOptions = DATE_PRESETS[preset];
  if (intlOptions) {
    return dateFormatter(options.locale, { ...intlOptions, timeZone: options.timeZone }).format(date);
  }

  // Treat an unknown string as a token pattern: YYYY-MM-DD HH:mm:ss
  return preset
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()));
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
];

export function formatRelativeTime(value: unknown, locale?: string, now = Date.now()): string {
  const date = toDate(value);
  if (!date) return '';

  let formatter = relativeFormatters.get(locale ?? '');
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relativeFormatters.set(locale ?? '', formatter);
  }

  const diff = date.getTime() - now;
  const abs = Math.abs(diff);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return formatter.format(0, 'second');
}

/** Initials for avatar fallbacks: "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic pastel colour derived from a string, for avatars and tags. */
export function colorFromString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 88%)`;
}

export function textColorFromString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 32%)`;
}

/** Conventional colours for common status vocabularies. */
export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  active: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },
  success: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },
  completed: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },
  approved: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },
  paid: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },
  online: { bg: 'rgba(22,163,74,.12)', fg: '#15803D' },

  pending: { bg: 'rgba(217,119,6,.14)', fg: '#B45309' },
  warning: { bg: 'rgba(217,119,6,.14)', fg: '#B45309' },
  review: { bg: 'rgba(217,119,6,.14)', fg: '#B45309' },
  processing: { bg: 'rgba(217,119,6,.14)', fg: '#B45309' },

  inactive: { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
  draft: { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
  archived: { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
  offline: { bg: 'rgba(100,116,139,.14)', fg: '#475569' },

  failed: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },
  error: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },
  rejected: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },
  cancelled: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },
  canceled: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },
  overdue: { bg: 'rgba(220,38,38,.12)', fg: '#B91C1C' },

  new: { bg: 'rgba(37,99,235,.12)', fg: '#1D4ED8' },
  info: { bg: 'rgba(37,99,235,.12)', fg: '#1D4ED8' },
  open: { bg: 'rgba(37,99,235,.12)', fg: '#1D4ED8' },
};

export function statusColors(value: string): { bg: string; fg: string } {
  return (
    STATUS_COLORS[value.toLowerCase().trim()] ?? {
      bg: colorFromString(value),
      fg: textColorFromString(value),
    }
  );
}
