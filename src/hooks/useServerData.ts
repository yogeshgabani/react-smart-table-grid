import * as React from 'react';
import type { DataProvider, DataProviderParams, GridState } from '../types';
import { hashKey } from '../utils';

export interface UseServerDataOptions<T> {
  provider: DataProvider<T> | null;
  state: GridState;
  /** Append pages instead of replacing them (infinite scroll). */
  append?: boolean;
  enabled?: boolean;
}

export interface ServerDataResult<T> {
  rows: T[];
  total: number | undefined;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  aggregates: Record<string, unknown> | undefined;
  refetch: () => void;
  loadMore: () => void;
}

/**
 * Drive a `DataProvider` from grid state.
 *
 * Requests are keyed on the state slices the server cares about, in-flight
 * requests are aborted when the key changes, and out-of-order responses are
 * discarded so a slow first request can't overwrite a fast second one.
 */
export function useServerData<T>(options: UseServerDataOptions<T>): ServerDataResult<T> {
  const { provider, state, append = false, enabled = true } = options;

  const [rows, setRows] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState<number | undefined>(undefined);
  const [aggregates, setAggregates] = React.useState<Record<string, unknown> | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);

  const cursorRef = React.useRef<string | null>(null);
  const requestId = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

  // Only the slices a server actually needs go into the key — column sizing or
  // expansion changing must not trigger a refetch.
  const key = hashKey({
    provider: provider?.key ?? Boolean(provider),
    sorting: state.sorting,
    filters: state.filters,
    search: state.search,
    grouping: state.grouping,
    pageIndex: append ? 0 : state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    nonce,
  });

  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    if (!provider || !enabled) return undefined;

    const id = requestId.current + 1;
    requestId.current = id;

    abortRef.current?.abort();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    abortRef.current = controller;

    const current = stateRef.current;
    const params: DataProviderParams = {
      page: current.pagination.pageIndex + 1,
      pageIndex: current.pagination.pageIndex,
      pageSize: current.pagination.pageSize,
      cursor: append ? cursorRef.current : current.pagination.cursor ?? null,
      filters: current.filters,
      sorting: current.sorting,
      search: current.search.query,
      columnSearch: current.search.columns,
      grouping: current.grouping,
      signal: controller?.signal,
    };

    setLoading(true);
    setError(null);

    provider
      .fetch(params)
      .then((result) => {
        if (requestId.current !== id) return;
        cursorRef.current = result.nextCursor ?? null;
        setRows(result.rows);
        setTotal(result.total);
        setAggregates(result.aggregates);
        setHasMore(
          result.hasMore ??
            (result.nextCursor != null ||
              (result.total != null && result.rows.length < result.total)),
        );
      })
      .catch((cause: unknown) => {
        if (requestId.current !== id) return;
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });

    return () => controller?.abort();
    // `key` is the intentional dependency — it encodes every input above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, provider, enabled, append]);

  const refetch = React.useCallback(() => {
    cursorRef.current = null;
    setNonce((value) => value + 1);
  }, []);

  const loadMore = React.useCallback(() => {
    if (!provider || loading || !hasMore) return;

    const id = requestId.current + 1;
    requestId.current = id;
    const current = stateRef.current;

    setLoading(true);
    provider
      .fetch({
        page: Math.floor(rows.length / current.pagination.pageSize) + 1,
        pageIndex: Math.floor(rows.length / current.pagination.pageSize),
        pageSize: current.pagination.pageSize,
        cursor: cursorRef.current,
        filters: current.filters,
        sorting: current.sorting,
        search: current.search.query,
        columnSearch: current.search.columns,
        grouping: current.grouping,
      })
      .then((result) => {
        if (requestId.current !== id) return;
        cursorRef.current = result.nextCursor ?? null;
        setRows((prev) => [...prev, ...result.rows]);
        if (result.total != null) setTotal(result.total);
        setHasMore(
          result.hasMore ?? (result.nextCursor != null ? true : result.rows.length > 0),
        );
      })
      .catch((cause: unknown) => {
        if (requestId.current !== id) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [provider, loading, hasMore, rows.length]);

  return { rows, total, loading, error, hasMore, aggregates, refetch, loadMore };
}
