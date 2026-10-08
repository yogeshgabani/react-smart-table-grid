import type { DataProvider, DataProviderParams, DataProviderResult, GridRow } from '../types';
import { createDataProvider, defaultSerialize, defaultTransform } from '../data/provider';

/**
 * Optional integration adapters.
 *
 * None of these import the library they adapt — you pass the client in. That
 * keeps axios, React Query, SWR and RTK Query out of the dependency graph while
 * still giving each a one-liner.
 */

/* ------------------------------------------------------------------ *
 * fetch
 * ------------------------------------------------------------------ */

export interface FetchAdapterOptions<T> {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  serialize?: (params: DataProviderParams) => Record<string, unknown>;
  transform?: (response: unknown) => DataProviderResult<T>;
}

export function fetchAdapter<T = GridRow>(options: FetchAdapterOptions<T>): DataProvider<T> {
  const serialize = options.serialize ?? defaultSerialize;
  const transform = options.transform ?? defaultTransform<T>;

  return createDataProvider<T>({
    key: `fetch:${options.url}`,
    fetch: async (params) => {
      const payload = serialize(params);
      const method = options.method ?? 'GET';

      let url = options.url;
      const init: RequestInit = {
        method,
        headers: { Accept: 'application/json', ...options.headers },
        signal: params.signal,
      };

      if (method === 'GET') {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
          if (value != null && value !== '') search.set(key, String(value));
        }
        const query = search.toString();
        if (query) url += (url.includes('?') ? '&' : '?') + query;
      } else {
        init.body = JSON.stringify(payload);
        init.headers = { 'Content-Type': 'application/json', ...(init.headers as object) };
      }

      const response = await fetch(url, init);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return transform(await response.json());
    },
  });
}

/* ------------------------------------------------------------------ *
 * axios
 * ------------------------------------------------------------------ */

/** The slice of the axios interface this adapter needs. */
export interface AxiosLike {
  request: (config: {
    url: string;
    method?: string;
    params?: Record<string, unknown>;
    data?: Record<string, unknown>;
    signal?: AbortSignal;
  }) => Promise<{ data: unknown }>;
}

export interface AxiosAdapterOptions<T> {
  client: AxiosLike;
  url: string;
  method?: 'get' | 'post';
  serialize?: (params: DataProviderParams) => Record<string, unknown>;
  transform?: (response: unknown) => DataProviderResult<T>;
}

export function axiosAdapter<T = GridRow>(options: AxiosAdapterOptions<T>): DataProvider<T> {
  const serialize = options.serialize ?? defaultSerialize;
  const transform = options.transform ?? defaultTransform<T>;
  const method = options.method ?? 'get';

  return createDataProvider<T>({
    key: `axios:${options.url}`,
    fetch: async (params) => {
      const payload = serialize(params);
      const response = await options.client.request({
        url: options.url,
        method,
        params: method === 'get' ? payload : undefined,
        data: method === 'post' ? payload : undefined,
        signal: params.signal,
      });
      return transform(response.data);
    },
  });
}

/* ------------------------------------------------------------------ *
 * React Query / SWR / RTK Query
 * ------------------------------------------------------------------ */

/**
 * Bridge for cache-first clients.
 *
 * With React Query, SWR or RTK Query you already own the fetching and caching;
 * the grid only needs the current page's rows and the total. Pass those in and
 * drive the request from `onStateChange`:
 *
 * ```tsx
 * const [gridState, setGridState] = useState<GridState>();
 * const { data, isFetching } = useQuery({
 *   queryKey: ['users', gridState],
 *   queryFn: () => api.users(gridState),
 * });
 *
 * <SmartDataGrid
 *   columns={columns}
 *   dataProvider={cachedAdapter({ rows: data?.rows ?? [], total: data?.total })}
 *   loading={isFetching}
 *   manual
 *   onStateChange={setGridState}
 * />
 * ```
 */
export function cachedAdapter<T = GridRow>(snapshot: {
  rows: T[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
  aggregates?: Record<string, unknown>;
}): DataProvider<T> {
  return createDataProvider<T>({
    key: 'cached',
    fetch: async () => ({
      rows: snapshot.rows,
      total: snapshot.total ?? snapshot.rows.length,
      hasMore: snapshot.hasMore,
      nextCursor: snapshot.nextCursor,
      aggregates: snapshot.aggregates,
    }),
  });
}

/** Alias with names that read better next to each library. */
export const reactQueryAdapter = cachedAdapter;
export const swrAdapter = cachedAdapter;
export const rtkQueryAdapter = cachedAdapter;

/* ------------------------------------------------------------------ *
 * In-memory (demos, tests, mocked APIs)
 * ------------------------------------------------------------------ */

export interface MemoryAdapterOptions<T> {
  rows: T[];
  /** Simulated network latency in ms. */
  delay?: number;
}

/** Serve a local array through the server-side code path. */
export function memoryAdapter<T = GridRow>(options: MemoryAdapterOptions<T>): DataProvider<T> {
  return createDataProvider<T>({
    key: 'memory',
    fetch: async (params) => {
      if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay));
      const start = params.pageIndex * params.pageSize;
      return {
        rows: options.rows.slice(start, start + params.pageSize),
        total: options.rows.length,
      };
    },
  });
}
