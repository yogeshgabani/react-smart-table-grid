import type {
  DataProvider,
  DataProviderParams,
  DataProviderResult,
  DataSourceConfig,
  GridRow,
} from '../types';
import { SmartDataGridError } from '../core/errors';
import { serializeSorting } from '../core/sort';

/**
 * Wrap a fetch function as a data provider.
 *
 * ```ts
 * const provider = createDataProvider({
 *   fetch: async ({ page, pageSize, filters, sorting, search }) => {
 *     const res = await api.users.list({ page, pageSize, sorting, search });
 *     return { rows: res.data, total: res.total };
 *   },
 * });
 * ```
 */
export function createDataProvider<T = GridRow>(provider: DataProvider<T>): DataProvider<T> {
  if (typeof provider.fetch !== 'function') {
    throw new SmartDataGridError(
      'invalid-data-provider',
      'createDataProvider() requires a "fetch" function.',
    );
  }
  return provider;
}

/** Flatten grid params into a plain query object. */
export function defaultSerialize(params: DataProviderParams): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.cursor) query.cursor = params.cursor;
  if (params.search) query.search = params.search;
  if (params.sorting.length) query.sort = serializeSorting(params.sorting);
  if (params.grouping.length) query.groupBy = params.grouping.join(',');

  const hasFilters = params.filters.some((group) => group.conditions.length > 0);
  if (hasFilters) query.filters = JSON.stringify(params.filters);

  for (const [columnId, value] of Object.entries(params.columnSearch)) {
    if (value) query[columnId] = value;
  }
  return query;
}

/** Best-effort mapping of an unknown API shape onto `{ rows, total }`. */
export function defaultTransform<T>(response: unknown): DataProviderResult<T> {
  if (Array.isArray(response)) return { rows: response as T[], total: response.length };

  const body = (response ?? {}) as Record<string, unknown>;
  const rows =
    (body.rows as T[]) ??
    (body.data as T[]) ??
    (body.items as T[]) ??
    (body.results as T[]) ??
    (body.records as T[]) ??
    [];

  const total =
    (body.total as number) ??
    (body.totalCount as number) ??
    (body.count as number) ??
    (body.totalRecords as number) ??
    (Array.isArray(rows) ? rows.length : 0);

  return {
    rows: Array.isArray(rows) ? rows : [],
    total,
    nextCursor: (body.nextCursor as string) ?? (body.next as string) ?? null,
    hasMore: body.hasMore as boolean | undefined,
    aggregates: body.aggregates as Record<string, unknown> | undefined,
  };
}

/**
 * Turn a declarative `dataSource` into a provider. Uses global `fetch` unless
 * a custom `fetcher` is supplied — the package never depends on an HTTP client.
 */
export function createDataSourceProvider<T = GridRow>(
  config: DataSourceConfig<T>,
): DataProvider<T> {
  const method = config.method ?? 'GET';
  const serialize = config.serialize ?? defaultSerialize;
  const transform = config.transform ?? defaultTransform<T>;

  return createDataProvider<T>({
    key: `${method}:${config.url}`,
    fetch: async (params) => {
      const payload = serialize(params);

      // Let callers rename params to match their API's vocabulary.
      const mapped: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        const alias = config.paramMap?.[key as keyof DataProviderParams];
        mapped[alias ?? key] = value;
      }

      const headers =
        typeof config.headers === 'function' ? config.headers() : (config.headers ?? {});

      let url = config.url;
      const init: RequestInit = {
        method,
        headers: { Accept: 'application/json', ...headers },
        signal: params.signal,
        credentials: config.credentials,
      };

      if (method === 'GET' || method === 'DELETE') {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(mapped)) {
          if (value === undefined || value === null || value === '') continue;
          search.set(key, String(value));
        }
        const query = search.toString();
        if (query) url += (url.includes('?') ? '&' : '?') + query;
      } else {
        init.body = JSON.stringify(mapped);
        init.headers = { 'Content-Type': 'application/json', ...(init.headers as object) };
      }

      const raw = config.fetcher
        ? await config.fetcher(url, init)
        : await defaultFetcher(url, init);

      return transform(raw);
    },
  });
}

async function defaultFetcher(url: string, init: RequestInit): Promise<unknown> {
  if (typeof fetch === 'undefined') {
    throw new SmartDataGridError(
      'no-fetch',
      'No global fetch() was found. Provide dataSource.fetcher to use your own HTTP client.',
    );
  }
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new SmartDataGridError(
      'request-failed',
      `Request to ${url} failed with ${response.status} ${response.statusText}.`,
    );
  }
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SmartDataGridError(
      'invalid-json',
      `Response from ${url} was not valid JSON. Provide dataSource.transform to parse it.`,
    );
  }
}
