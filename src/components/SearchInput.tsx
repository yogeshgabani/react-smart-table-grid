import * as React from 'react';
import { cx } from '../utils';
import { useGridContext } from './context';
import { CloseIcon, SearchIcon } from './icons';

export interface SearchInputProps {
  autoFocusRef?: React.MutableRefObject<HTMLInputElement | null>;
}

/**
 * Global search box. The input is uncontrolled-feeling (updates immediately)
 * while the grid debounces the actual filtering — see `useGrid`.
 */
export function SearchInput({ autoFocusRef }: SearchInputProps): React.JSX.Element {
  const { api, state, theme, labels } = useGridContext();
  const ui = theme.ui.search ?? {};
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(autoFocusRef, () => inputRef.current as HTMLInputElement, []);

  const variant = ui.variant ?? 'default';
  const size = ui.size ?? 'md';

  return (
    <div
      className={cx(
        'sdg-search',
        variant !== 'default' && `sdg-search--${variant}`,
        size !== 'md' && `sdg-search--${size}`,
        ui.className,
      )}
      style={ui.style}
    >
      <span className="sdg-search-icon">{theme.ui.icon?.search ?? ui.icon ?? <SearchIcon size={15} />}</span>
      <input
        ref={inputRef}
        className="sdg-search-input"
        type="search"
        role="searchbox"
        value={state.search.query}
        placeholder={ui.placeholder ?? labels.searchPlaceholder}
        aria-label={labels.search}
        onChange={(event) => api.setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            api.clearSearch();
          }
        }}
      />
      {ui.clearable !== false && state.search.query && (
        <button
          type="button"
          className="sdg-search-clear"
          aria-label="Clear search"
          onClick={() => {
            api.clearSearch();
            inputRef.current?.focus();
          }}
        >
          <CloseIcon size={13} />
        </button>
      )}
    </div>
  );
}
