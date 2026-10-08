import * as React from 'react';
import type {
  GridState,
  GridStateChangeMeta,
  GridStateInput,
  PersistConfig,
  UrlStateConfig,
} from '../types';
import { createInitialState, mergeControlled } from '../core/state';
import { parseSorting, serializeSorting } from '../core/sort';
import { isBrowser } from '../utils';

/* ------------------------------------------------------------------ *
 * URL synchronisation
 * ------------------------------------------------------------------ */

const DEFAULT_URL_KEYS: NonNullable<UrlStateConfig['keys']> = [
  'page',
  'pageSize',
  'search',
  'sort',
  'filters',
  'density',
];

function readUrlState(config: Required<Pick<UrlStateConfig, 'prefix' | 'keys'>>): GridStateInput {
  if (!isBrowser()) return {};
  const params = new URLSearchParams(window.location.search);
  const get = (key: string): string | null => params.get(`${config.prefix}${key}`);
  const out: GridStateInput = {};

  if (config.keys.includes('page') || config.keys.includes('pageSize')) {
    const page = Number(get('page'));
    const size = Number(get('pageSize'));
    if (Number.isFinite(page) && page > 0) {
      out.pagination = { pageIndex: page - 1, pageSize: Number.isFinite(size) && size > 0 ? size : 10 };
    } else if (Number.isFinite(size) && size > 0) {
      out.pagination = { pageIndex: 0, pageSize: size };
    }
  }

  if (config.keys.includes('search')) {
    const search = get('search');
    if (search) out.search = { query: search, columns: {} };
  }

  if (config.keys.includes('sort')) {
    const sort = get('sort');
    if (sort) out.sorting = parseSorting(sort);
  }

  if (config.keys.includes('filters')) {
    const filters = get('filters');
    if (filters) {
      try {
        out.filters = JSON.parse(decodeURIComponent(filters));
      } catch {
        /* a malformed URL shouldn't break the grid */
      }
    }
  }

  if (config.keys.includes('density')) {
    const density = get('density');
    if (density) out.density = density as GridState['density'];
  }

  return out;
}

function writeUrlState(
  state: GridState,
  config: Required<Pick<UrlStateConfig, 'prefix' | 'keys' | 'history'>>,
): void {
  if (!isBrowser()) return;
  const params = new URLSearchParams(window.location.search);
  const key = (name: string): string => `${config.prefix}${name}`;

  const setOrDelete = (name: string, value: string | null): void => {
    if (value === null || value === '') params.delete(key(name));
    else params.set(key(name), value);
  };

  if (config.keys.includes('page')) {
    setOrDelete('page', state.pagination.pageIndex > 0 ? String(state.pagination.pageIndex + 1) : null);
  }
  if (config.keys.includes('pageSize')) {
    setOrDelete('pageSize', String(state.pagination.pageSize));
  }
  if (config.keys.includes('search')) {
    setOrDelete('search', state.search.query || null);
  }
  if (config.keys.includes('sort')) {
    setOrDelete('sort', state.sorting.length ? serializeSorting(state.sorting) : null);
  }
  if (config.keys.includes('filters')) {
    const hasFilters = state.filters.some((group) => group.conditions.length > 0);
    setOrDelete('filters', hasFilters ? encodeURIComponent(JSON.stringify(state.filters)) : null);
  }
  if (config.keys.includes('density')) {
    setOrDelete('density', state.density);
  }

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

  if (config.history === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

function getStorage(kind: 'local' | 'session'): Storage | null {
  if (!isBrowser()) return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    // Storage can throw in private mode or with third-party cookies blocked.
    return null;
  }
}

function readPersisted(config: PersistConfig): GridStateInput {
  const storage = getStorage(config.storage ?? 'local');
  if (!storage) return {};
  try {
    const raw = storage.getItem(`react-smart-table-grid:${config.key}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GridStateInput;
    if (!config.keys) return parsed;
    const filtered: GridStateInput = {};
    for (const key of config.keys) {
      if (parsed[key] !== undefined) (filtered as Record<string, unknown>)[key] = parsed[key];
    }
    return filtered;
  } catch {
    return {};
  }
}

function writePersisted(state: GridState, config: PersistConfig): void {
  const storage = getStorage(config.storage ?? 'local');
  if (!storage) return;
  const keys =
    config.keys ??
    (['columnVisibility', 'columnOrder', 'columnSizing', 'columnPinning', 'density', 'pagination'] as Array<
      keyof GridState
    >);
  const payload: Record<string, unknown> = {};
  for (const key of keys) payload[key] = state[key];
  try {
    storage.setItem(`react-smart-table-grid:${config.key}`, JSON.stringify(payload));
  } catch {
    /* quota errors shouldn't break the grid */
  }
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

export interface UseGridStateOptions {
  defaultState?: GridStateInput;
  /** When provided, these slices become controlled. */
  state?: GridStateInput;
  onStateChange?: (state: GridState, meta: GridStateChangeMeta) => void;
  urlState?: boolean | UrlStateConfig;
  persist?: PersistConfig;
  /** Last word on the default state — plugins' `initState` hooks run here. */
  initState?: (state: GridState) => GridState;
}

export interface UseGridStateResult {
  state: GridState;
  setState: (
    updater: GridStateInput | ((prev: GridState) => GridState),
    meta?: GridStateChangeMeta,
  ) => void;
  /** Patch a single slice, with the change key reported to `onStateChange`. */
  patch: <K extends keyof GridState>(key: K, value: GridState[K]) => void;
  reset: () => void;
}

export function useGridState(options: UseGridStateOptions): UseGridStateResult {
  const { defaultState, state: controlled, onStateChange, urlState, persist, initState } = options;

  // Saved and URL state still win over this: they record what the user chose.
  const initStateRef = React.useRef(initState);
  initStateRef.current = initState;
  const buildDefaults = React.useCallback((): GridState => {
    const base = createInitialState(defaultState);
    return initStateRef.current ? initStateRef.current(base) : base;
  }, [defaultState]);

  const urlConfig = React.useMemo(() => {
    if (!urlState) return null;
    const config = typeof urlState === 'object' ? urlState : {};
    if (config.enabled === false) return null;
    return {
      prefix: config.prefix ?? '',
      keys: config.keys ?? DEFAULT_URL_KEYS,
      history: config.history ?? ('replace' as const),
    };
  }, [urlState]);

  // Read URL and storage exactly once, during the initial state factory, so we
  // never render one frame with the wrong page and then correct it.
  const [internal, setInternal] = React.useState<GridState>(() => {
    let initial = buildDefaults();
    if (persist?.enabled !== false && persist?.key) {
      initial = { ...initial, ...readPersisted(persist) };
    }
    if (urlConfig) {
      initial = { ...initial, ...readUrlState(urlConfig) };
    }
    return initial;
  });

  const state = React.useMemo(() => mergeControlled(internal, controlled), [internal, controlled]);

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const onChangeRef = React.useRef(onStateChange);
  onChangeRef.current = onStateChange;

  const setState = React.useCallback(
    (
      updater: GridStateInput | ((prev: GridState) => GridState),
      meta: GridStateChangeMeta = { key: 'reset' },
    ) => {
      const previous = stateRef.current;
      const next =
        typeof updater === 'function' ? updater(previous) : ({ ...previous, ...updater } as GridState);
      if (next === previous) return;
      stateRef.current = next;
      setInternal(next);
      onChangeRef.current?.(next, meta);
    },
    [],
  );

  const patch = React.useCallback(
    <K extends keyof GridState>(key: K, value: GridState[K]) => {
      setState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }), { key });
    },
    [setState],
  );

  const reset = React.useCallback(() => {
    setState(buildDefaults(), { key: 'reset' });
  }, [setState, buildDefaults]);

  /* ---- side-effects ------------------------------------------------ */

  React.useEffect(() => {
    if (urlConfig) writeUrlState(state, urlConfig);
  }, [state, urlConfig]);

  React.useEffect(() => {
    if (persist?.key && persist.enabled !== false) writePersisted(state, persist);
  }, [state, persist]);

  return { state, setState, patch, reset };
}
