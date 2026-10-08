import * as React from 'react';

export interface VirtualizerOptions {
  count: number;
  scrollRef: React.RefObject<HTMLElement | null>;
  /** Fixed height, or a per-index resolver for variable rows. */
  rowHeight: number | ((index: number) => number);
  overscan?: number;
  enabled?: boolean;
}

export interface VirtualRange {
  start: number;
  end: number;
  paddingTop: number;
  paddingBottom: number;
  totalSize: number;
}

/**
 * Windowing for table bodies.
 *
 * Rather than absolutely positioning rows (which breaks `<table>` semantics and
 * column alignment), this reports a row range plus two spacer heights. The body
 * renders a spacer `<tr>` above and below the visible slice, so the browser's
 * own table layout keeps every column aligned.
 */
export function useVirtualizer(options: VirtualizerOptions): VirtualRange {
  const { count, scrollRef, rowHeight, overscan = 8, enabled = true } = options;

  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node || !enabled) return undefined;

    let frame = 0;
    const onScroll = (): void => {
      // Coalesce scroll events into one state update per frame.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrollTop(node.scrollTop);
      });
    };

    const measure = (): void => setViewportHeight(node.clientHeight);

    measure();
    setScrollTop(node.scrollTop);
    node.addEventListener('scroll', onScroll, { passive: true });

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(node);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [scrollRef, enabled]);

  // Cumulative offsets are only needed for variable-height rows; fixed heights
  // stay O(1) so a million rows cost nothing to measure.
  const offsets = React.useMemo(() => {
    if (typeof rowHeight === 'number' || !enabled) return null;
    const list = new Float64Array(count + 1);
    for (let i = 0; i < count; i += 1) list[i + 1] = list[i] + rowHeight(i);
    return list;
  }, [count, rowHeight, enabled]);

  return React.useMemo<VirtualRange>(() => {
    if (!enabled || count === 0) {
      return { start: 0, end: count, paddingTop: 0, paddingBottom: 0, totalSize: 0 };
    }

    if (offsets) {
      const total = offsets[count];
      const findIndex = (offset: number): number => {
        let low = 0;
        let high = count;
        while (low < high) {
          const mid = (low + high) >> 1;
          if (offsets[mid + 1] <= offset) low = mid + 1;
          else high = mid;
        }
        return low;
      };
      const start = Math.max(0, findIndex(scrollTop) - overscan);
      const end = Math.min(count, findIndex(scrollTop + viewportHeight) + overscan + 1);
      return {
        start,
        end,
        paddingTop: offsets[start],
        paddingBottom: total - offsets[end],
        totalSize: total,
      };
    }

    const size = rowHeight as number;
    const total = count * size;
    const visible = Math.ceil((viewportHeight || 600) / size);
    const start = Math.max(0, Math.floor(scrollTop / size) - overscan);
    const end = Math.min(count, start + visible + overscan * 2);

    return {
      start,
      end,
      paddingTop: start * size,
      paddingBottom: Math.max(0, total - end * size),
      totalSize: total,
    };
  }, [enabled, count, offsets, rowHeight, scrollTop, viewportHeight, overscan]);
}

/** Fire `onLoadMore` when the scroll container nears its end. */
export function useInfiniteScroll(options: {
  scrollRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  onLoadMore: () => void;
}): void {
  const { scrollRef, enabled, hasMore, loading, threshold = 240, onLoadMore } = options;

  const handlerRef = React.useRef(onLoadMore);
  handlerRef.current = onLoadMore;

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node || !enabled || !hasMore || loading) return undefined;

    const check = (): void => {
      const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
      if (remaining <= threshold) handlerRef.current();
    };

    node.addEventListener('scroll', check, { passive: true });
    // The first page may not fill the viewport — check immediately too.
    check();

    return () => node.removeEventListener('scroll', check);
  }, [scrollRef, enabled, hasMore, loading, threshold]);
}

/** Track horizontal/vertical scroll offsets for pinned-column shadows. */
export function useScrollState(scrollRef: React.RefObject<HTMLElement | null>): {
  scrolledX: boolean;
  scrolledY: boolean;
  scrollableX: boolean;
} {
  const [state, setState] = React.useState({
    scrolledX: false,
    scrolledY: false,
    scrollableX: false,
  });

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    let frame = 0;
    const update = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const scrollableX = node.scrollWidth > node.clientWidth + 1;
        const scrolledX = node.scrollLeft > 1 || (scrollableX && node.scrollLeft < -1);
        const scrolledY = node.scrollTop > 1;
        setState((prev) =>
          prev.scrolledX === scrolledX && prev.scrolledY === scrolledY && prev.scrollableX === scrollableX
            ? prev
            : { scrolledX, scrolledY, scrollableX },
        );
      });
    };

    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(node);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [scrollRef]);

  return state;
}
