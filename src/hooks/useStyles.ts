import * as React from 'react';
import { gridCss } from '../styles/css.generated';

const STYLE_ID = 'react-smart-table-grid-styles';

let refCount = 0;
let element: HTMLStyleElement | null = null;

// `useInsertionEffect` runs before layout effects read the DOM, which is exactly
// when a stylesheet needs to exist. It only exists in React 18+, so fall back.
const useIsomorphicInsertionEffect =
  typeof document === 'undefined'
    ? () => {}
    : ((React as unknown as { useInsertionEffect?: typeof React.useEffect }).useInsertionEffect ??
      React.useLayoutEffect);

/**
 * Inject the grid stylesheet into `document.head`, once per page regardless of
 * how many grids are mounted.
 *
 * SSR note: this is a client-only effect, so server-rendered HTML ships
 * unstyled for a frame. Apps that server-render should
 * `import 'react-smart-table-grid/styles.css'` in their root layout instead and pass
 * `injectStyles={false}` — see docs/nextjs.md.
 */
export function useGridStyles(enabled = true): void {
  useIsomorphicInsertionEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;

    if (!element) {
      // Respect a stylesheet the app already placed. Only checked while we own
      // nothing — our own <style> matches the same selector, and skipping the
      // count for it let the first grid to unmount strip every other grid.
      if (document.querySelector(`style[data-${STYLE_ID}], link[data-${STYLE_ID}]`)) {
        return undefined;
      }
      element = document.createElement('style');
      element.setAttribute('data-' + STYLE_ID, '');
      element.textContent = gridCss;
      document.head.insertBefore(element, document.head.firstChild);
    }
    refCount += 1;

    return () => {
      refCount -= 1;
      if (refCount <= 0 && element?.parentNode) {
        element.parentNode.removeChild(element);
        element = null;
        refCount = 0;
      }
    };
  }, [enabled]);
}

/** The raw stylesheet, for apps that want to inline it themselves. */
export { gridCss };
