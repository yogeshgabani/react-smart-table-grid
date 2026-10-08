import * as React from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server. Layout effects
 * never run during SSR anyway, and React warns on every server render that
 * calls one.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/** SSR-safe media query subscription. Returns `false` on the server. */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      // Safari < 14 only supports the deprecated listener API.
      if (list.addEventListener) {
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
      }
      list.addListener(onChange);
      return () => list.removeListener(onChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function usePrefersDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Observe an element's width. Returns 0 until measured. */
export function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    setWidth(Math.round(node.getBoundingClientRect().width));

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

/** Viewport width, for responsive column hiding. */
export function useViewportWidth(): number {
  const subscribe = React.useCallback((onChange: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => (typeof window === 'undefined' ? 1280 : window.innerWidth),
    () => 1280,
  );
}

/** Debounce a rapidly-changing value. */
export function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return undefined;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return delay <= 0 ? value : debounced;
}

/** Latest-value ref, so callbacks stay stable without going stale. */
export function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}

// Every currently-active useOutsideClick instance, in the order it opened —
// so a Select nested inside a Filter panel's Popover doesn't also close the
// Filter panel when the user presses Escape meaning to close just the Select.
const activeEscapeStack: object[] = [];

/** Run a callback when a click lands outside every referenced element. */
export function useOutsideClick(
  refs: Array<React.RefObject<HTMLElement | null>>,
  handler: () => void,
  active = true,
): void {
  const saved = useLatest(handler);

  React.useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;

    const token = {};
    activeEscapeStack.push(token);

    const onPointerDown = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node | null;
      if (!target) return;
      for (const ref of refs) {
        if (ref.current?.contains(target)) return;
      }
      saved.current();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      // Only the most-recently-opened instance reacts; an outer popover gets
      // its own Escape press once the nested one has closed.
      if (activeEscapeStack[activeEscapeStack.length - 1] !== token) return;
      saved.current();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      const index = activeEscapeStack.indexOf(token);
      if (index !== -1) activeEscapeStack.splice(index, 1);
    };
    // `refs` is expected to be a stable array literal from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, saved, ...refs]);
}
