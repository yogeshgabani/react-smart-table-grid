import * as React from 'react';

/* Live numbers for the footer: npm downloads and site visitors. Both APIs are
   public, need no key, and send `Access-Control-Allow-Origin: *`. */

const REGISTRY = 'https://registry.npmjs.org';
const DOWNLOADS = 'https://api.npmjs.org/downloads';
const ABACUS = 'https://abacus.jasoncameron.dev';

/* ------------------------------------------------------------------ *
 * npm
 * ------------------------------------------------------------------ */

export type NpmStats =
  | { status: 'loading' }
  | { status: 'unpublished' }
  | { status: 'error' }
  | {
      status: 'ok';
      version: string;
      publishedAt: string;
      total: number;
      lastWeek: number;
      /** Last day npm has counted — its numbers trail by a day or more. */
      through: string;
    };

const DAY = 86_400_000;
// The range endpoint serves at most 18 months per request.
const RANGE_DAYS = 540;
const CACHE_MS = 10 * 60_000;

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

async function getJson(url: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, { signal });
  // npm answers 404 for a package it has never seen, or has no counts for yet.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return (await response.json()) as Record<string, unknown>;
}

export async function loadNpmStats(name: string, signal: AbortSignal): Promise<NpmStats> {
  const doc = await getJson(`${REGISTRY}/${name.replace('/', '%2f')}`, signal);
  if (!doc) return { status: 'unpublished' };

  const time = (doc.time ?? {}) as Record<string, string>;
  const version = ((doc['dist-tags'] ?? {}) as Record<string, string>).latest ?? '';
  const created = new Date(time.created ?? Date.now());
  const today = new Date();

  let total = 0;
  for (let start = created; start <= today; start = new Date(start.getTime() + RANGE_DAYS * DAY)) {
    const end = new Date(Math.min(start.getTime() + (RANGE_DAYS - 1) * DAY, today.getTime()));
    const range = await getJson(`${DOWNLOADS}/range/${isoDay(start)}:${isoDay(end)}/${name}`, signal);
    const days = (range?.downloads ?? []) as Array<{ downloads: number }>;
    for (const day of days) total += day.downloads;
  }

  // A range echoes back the end date asked for; `last-week` reports the last
  // day npm has actually counted.
  const week = await getJson(`${DOWNLOADS}/point/last-week/${name}`, signal);
  return {
    status: 'ok',
    version,
    publishedAt: time[version] ?? time.modified ?? time.created ?? '',
    total,
    lastWeek: Number(week?.downloads ?? 0),
    through: String(week?.end ?? ''),
  };
}

function readCache(key: string): NpmStats | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const { at, value } = JSON.parse(raw) as { at: number; value: NpmStats };
    return Date.now() - at < CACHE_MS ? value : null;
  } catch {
    return null;
  }
}

/** Downloads and latest publish date, fetched once per tab and cached for 10 minutes. */
export function useNpmStats(name: string): NpmStats {
  const cacheKey = `sdg-playground:npm:${name}`;
  const [stats, setStats] = React.useState<NpmStats>(() => readCache(cacheKey) ?? { status: 'loading' });

  React.useEffect(() => {
    if (stats.status !== 'loading') return undefined;
    const controller = new AbortController();
    loadNpmStats(name, controller.signal)
      .then((value) => {
        setStats(value);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), value }));
        } catch {
          /* uncached is fine */
        }
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setStats({ status: 'error' });
      });
    return () => controller.abort();
    // Fetch once; `stats` only gates the first run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, cacheKey]);

  return stats;
}

/* ------------------------------------------------------------------ *
 * Visitors (Abacus)
 * ------------------------------------------------------------------ */

export interface VisitorStats {
  hits: number | null;
  visitors: number | null;
  /** False on localhost and in dev — your own testing never inflates the numbers. */
  counting: boolean;
}

const VISITED_KEY = 'sdg-playground:visited';
const POLL_MS = 60_000;

function isLocalHost(hostname: string): boolean {
  return /^(localhost|127(\.\d+){3}|\[::1\]|0\.0\.0\.0)$/.test(hostname) || hostname.endsWith('.local');
}

async function counter(mode: 'hit' | 'get', namespace: string, key: string): Promise<number> {
  const response = await fetch(`${ABACUS}/${mode}/${encodeURIComponent(namespace)}/${key}`);
  if (response.status === 404) return 0; // a key exists only after its first hit
  if (!response.ok) throw new Error(String(response.status));
  const data = (await response.json()) as { value?: number };
  return Number(data.value) || 0;
}

/**
 * Page views ("hits") count every load; visitors count once per browser.
 * Numbers refresh every minute while the tab is visible.
 */
export function useVisitorStats(namespace: string): VisitorStats {
  const counting = !import.meta.env.DEV && !isLocalHost(window.location.hostname);
  const [hits, setHits] = React.useState<number | null>(null);
  const [visitors, setVisitors] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    const keep = (setter: (value: number) => void) => (value: number) => {
      if (alive) setter(value);
    };

    let firstVisit = false;
    try {
      firstVisit = counting && !window.localStorage.getItem(VISITED_KEY);
    } catch {
      /* storage blocked — count as a returning visitor rather than double count */
    }

    counter(counting ? 'hit' : 'get', namespace, 'hits').then(keep(setHits), () => undefined);
    counter(firstVisit ? 'hit' : 'get', namespace, 'visitors').then((value) => {
      keep(setVisitors)(value);
      if (firstVisit) {
        try {
          window.localStorage.setItem(VISITED_KEY, String(Date.now()));
        } catch {
          /* fine */
        }
      }
    }, () => undefined);

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      counter('get', namespace, 'hits').then(keep(setHits), () => undefined);
      counter('get', namespace, 'visitors').then(keep(setVisitors), () => undefined);
    }, POLL_MS);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [namespace, counting]);

  return { hits, visitors, counting };
}
