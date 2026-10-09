import * as React from 'react';
import pkg from '../package.json';
import { PlaygroundThemeProvider, usePlaygroundTheme, type ThemeMode } from './theme';
import { Icon, Kbd, MOD_KEY, Segmented, cx, useCopy, type IconName } from './ui';
import { Overview } from './pages/Overview';
import { LivePlayground } from './pages/LivePlayground';
import { Showcase } from './pages/Showcase';
import { UiPlayground } from './pages/UiPlayground';
import { Themes } from './pages/Themes';
import { ThemeBuilder } from './pages/ThemeBuilder';
import { Presets } from './pages/Presets';
import { ServerSide } from './pages/ServerSide';
import { TreeAndGrouping } from './pages/TreeAndGrouping';
import { Editable } from './pages/Editable';
import { Responsive } from './pages/Responsive';
import { Benchmark } from './pages/Benchmark';
import { Headless } from './pages/Headless';
import { ReleaseNotes } from './changelog';
import { SiteFooter } from './footer';

export interface PageDef {
  id: string;
  label: string;
  group: string;
  title: string;
  description: string;
  icon: IconName;
  tags?: string[];
  badge?: string;
  /** The page draws its own hero. */
  hideHeader?: boolean;
  render: () => React.JSX.Element;
}

export const PAGES: PageDef[] = [
  {
    id: 'overview',
    label: 'Introduction',
    group: 'Get started',
    title: 'Introduction',
    description: 'What the grid is, how to install it, and a two-prop table you can paste today.',
    icon: 'home',
    hideHeader: true,
    render: () => <Overview />,
  },
  {
    id: 'playground',
    label: 'Live playground',
    group: 'Get started',
    title: 'Live playground',
    description:
      'Flip any prop in the panel and watch the grid change. The JSX below the preview is generated from your choices — copy it straight into your app.',
    icon: 'play',
    tags: ['props', 'live code', 'event log'],
    badge: 'New',
    render: () => <LivePlayground />,
  },
  {
    id: 'showcase',
    label: 'Full showcase',
    group: 'Get started',
    title: 'Full showcase',
    description:
      'Every interaction at once: search, filters, grouping, selection, expansion, row and bulk actions, export and fullscreen.',
    icon: 'layers',
    tags: ['240 rows', 'admin preset', 'events'],
    render: () => <Showcase />,
  },
  {
    id: 'changelog',
    label: 'Changelog',
    group: 'Get started',
    title: 'Changelog',
    description: 'Every release and what changed in it, newest first — rendered live from CHANGELOG.md.',
    icon: 'history',
    tags: [`v${pkg.version}`, 'keep a changelog'],
    badge: `v${pkg.version}`,
    render: () => <ReleaseNotes />,
  },
  {
    id: 'ui',
    label: 'One-stop UI',
    group: 'Design',
    title: 'One-stop UI customization',
    description: 'Completely different designs from the same columns — only the `ui` object changes.',
    icon: 'sliders',
    tags: ['ui prop', 'CSS variables'],
    render: () => <UiPlayground />,
  },
  {
    id: 'themes',
    label: 'Theme presets',
    group: 'Design',
    title: 'Theme presets',
    description: 'Every built-in theme side by side. Switch the page theme in the top bar to see the dark palettes.',
    icon: 'palette',
    tags: ['22 presets', 'light + dark'],
    render: () => <Themes />,
  },
  {
    id: 'builder',
    label: 'Theme builder',
    group: 'Design',
    title: 'Theme builder',
    description: 'Tune colours, sizing and variants, watch the preview update, then copy the generated theme.',
    icon: 'wand',
    tags: ['createGridTheme'],
    render: () => <ThemeBuilder />,
  },
  {
    id: 'presets',
    label: 'App presets',
    group: 'Design',
    title: 'Application presets',
    description: 'One prop configures a whole grid for a kind of product — admin, CRM, HRMS, ERP and more.',
    icon: 'grid',
    tags: ['preset prop'],
    render: () => <Presets />,
  },
  {
    id: 'server',
    label: 'Server-side data',
    group: 'Data',
    title: 'Server-side data',
    description: 'Data providers, request de-duplication, abort on change, error states and a declarative `dataSource`.',
    icon: 'server',
    tags: ['dataProvider', 'abort', 'retry'],
    render: () => <ServerSide />,
  },
  {
    id: 'tree',
    label: 'Tree & grouping',
    group: 'Data',
    title: 'Tree data, grouping and aggregation',
    description: 'Nested rows, multi-level grouping with per-group aggregates, and grouped column headers.',
    icon: 'tree',
    tags: ['tree', 'groupBy', 'aggregates'],
    render: () => <TreeAndGrouping />,
  },
  {
    id: 'editable',
    label: 'Inline editing',
    group: 'Data',
    title: 'Inline editing',
    description: 'Typed editors, validation, keyboard commits, and undo / redo over the grid’s own edit history.',
    icon: 'pencil',
    tags: ['editors', 'validation', 'undo'],
    render: () => <Editable />,
  },
  {
    id: 'responsive',
    label: 'Responsive & RTL',
    group: 'Platform',
    title: 'Responsive layouts and RTL',
    description: 'Card and stacked layouts, priority columns and full right-to-left mirroring, in a resizable device frame.',
    icon: 'phone',
    tags: ['card', 'stacked', 'priority', 'rtl'],
    render: () => <Responsive />,
  },
  {
    id: 'benchmark',
    label: 'Benchmark',
    group: 'Platform',
    title: 'Benchmark',
    description: 'Up to 1,000,000 rows with live FPS, render time and DOM-node counts.',
    icon: 'gauge',
    tags: ['virtualization', '1M rows'],
    render: () => <Benchmark />,
  },
  {
    id: 'headless',
    label: 'Headless',
    group: 'Platform',
    title: 'Headless mode',
    description: 'The same search, filter and sort pipeline driving completely custom markup.',
    icon: 'code',
    tags: ['react-smart-table-grid/headless'],
    render: () => <Headless />,
  },
];

const GROUPS = Array.from(new Set(PAGES.map((page) => page.group)));

function pageIdFromHash(): string {
  const id = window.location.hash.replace(/^#\/?/, '');
  return PAGES.some((page) => page.id === id) ? id : PAGES[0].id;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  return Boolean(node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable));
}

/* ------------------------------------------------------------------ */

export function App(): React.JSX.Element {
  return (
    <PlaygroundThemeProvider>
      <Shell />
    </PlaygroundThemeProvider>
  );
}

function Shell(): React.JSX.Element {
  const [pageId, setPageId] = React.useState(pageIdFromHash);
  const [navOpen, setNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  const index = PAGES.findIndex((entry) => entry.id === pageId);
  const page = PAGES[index] ?? PAGES[0];

  React.useEffect(() => {
    const onHashChange = (): void => {
      setPageId(pageIdFromHash());
      setNavOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  React.useEffect(() => {
    document.title = `${page.label} · Smart Data Grid by Yogesh Gabani`;
  }, [page.label]);

  // Ctrl/⌘+K or "/" opens page search. A focused grid claims Ctrl+K for its own
  // search box first (and prevents default), so this only fires elsewhere.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      const mod = event.ctrlKey || event.metaKey;
      if ((mod && event.key.toLowerCase() === 'k') || (event.key === '/' && !isTypingTarget(event.target))) {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === 'Escape') {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const prev = PAGES[index - 1];
  const next = PAGES[index + 1];

  return (
    <div className={cx('pg-app', navOpen && 'pg-app--nav-open')}>
      <button type="button" className="pg-skip" onClick={() => mainRef.current?.focus()}>
        Skip to content
      </button>

      <aside className="pg-sidebar" aria-label="Playground">
        <div className="pg-sidebar-head">
          <a className="pg-brand" href="#overview">
            <span className="pg-logo" aria-hidden="true">
              <Icon name="table" size={18} strokeWidth={2} />
            </span>
            <span className="pg-brand-text">
              <b>Smart Data Grid</b>
              <small>Live playground</small>
            </span>
          </a>
          <span className="pg-version">v{pkg.version}</span>
          <button
            type="button"
            className="pg-icon-btn pg-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <button type="button" className="pg-search-trigger" onClick={() => setPaletteOpen(true)}>
          <Icon name="search" size={15} />
          <span>Search pages…</span>
          <Kbd>{MOD_KEY} K</Kbd>
        </button>

        <nav className="pg-nav" aria-label="Pages">
          {GROUPS.map((group) => (
            <div className="pg-nav-section" key={group}>
              <div className="pg-nav-heading">{group}</div>
              <ul>
                {PAGES.filter((entry) => entry.group === group).map((entry) => (
                  <li key={entry.id}>
                    <a
                      className="pg-nav-link"
                      href={`#${entry.id}`}
                      aria-current={entry.id === page.id ? 'page' : undefined}
                    >
                      <Icon name={entry.icon} size={16} />
                      <span>{entry.label}</span>
                      {entry.badge && (
                        <span className={cx('pg-nav-badge', /^v\d/.test(entry.badge) && 'pg-nav-badge--muted')}>
                          {entry.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="pg-sidebar-foot">
          <Icon name="zap" size={16} />
          <span>
            <b>Zero runtime dependencies</b>
            <small>React 18–19 · SSR-safe · tree-shakable</small>
          </span>
        </div>
      </aside>

      <div className="pg-backdrop" hidden={!navOpen} onClick={() => setNavOpen(false)} />

      <div className="pg-main-col">
        <header className="pg-topbar">
          <button
            type="button"
            className="pg-icon-btn pg-menu-btn"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>

          <nav className="pg-breadcrumb" aria-label="Breadcrumb">
            <span>{page.group}</span>
            <Icon name="chevronRight" size={14} />
            <span aria-current="page">{page.label}</span>
          </nav>

          <div className="pg-topbar-actions">
            <button
              type="button"
              className="pg-icon-btn pg-topbar-search"
              aria-label="Search pages"
              onClick={() => setPaletteOpen(true)}
            >
              <Icon name="search" size={17} />
            </button>
            <InstallButton />
            <ThemeSwitcher />
          </div>
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="pg-main">
          {!page.hideHeader && <PageHeader page={page} />}
          <div className="pg-page" key={page.id}>
            {page.render()}
          </div>

          <nav className="pg-pager" aria-label="Previous and next page">
            {prev ? (
              <a className="pg-pager-link" href={`#${prev.id}`}>
                <small>
                  <Icon name="chevronLeft" size={14} /> Previous
                </small>
                <b>{prev.label}</b>
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a className="pg-pager-link pg-pager-link--next" href={`#${next.id}`}>
                <small>
                  Next <Icon name="chevronRight" size={14} />
                </small>
                <b>{next.label}</b>
              </a>
            )}
          </nav>

          <SiteFooter />
        </main>
      </div>

      <ScrollToTop focusTarget={mainRef} />

      {paletteOpen && <CommandPalette currentId={page.id} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PageHeader({ page }: { page: PageDef }): React.JSX.Element {
  return (
    <header className="pg-hero">
      <div className="pg-eyebrow">
        <Icon name={page.icon} size={14} />
        {page.group}
      </div>
      <h1 className="pg-title">{page.title}</h1>
      <p className="pg-lede">{page.description}</p>
      {page.tags && (
        <ul className="pg-tags" aria-label="Topics">
          {page.tags.map((tag) => (
            <li key={tag} className="pg-tag">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

function ThemeSwitcher(): React.JSX.Element {
  const { mode, setMode } = usePlaygroundTheme();
  return (
    <Segmented<ThemeMode>
      label="Colour theme"
      size="sm"
      value={mode}
      onChange={setMode}
      options={[
        { value: 'light', icon: 'sun', title: 'Light' },
        { value: 'dark', icon: 'moon', title: 'Dark' },
        { value: 'system', icon: 'monitor', title: 'System' },
      ]}
    />
  );
}

function InstallButton(): React.JSX.Element {
  const [copied, copy] = useCopy();
  const command = `npm i ${pkg.name}`;
  return (
    <button
      type="button"
      className="pg-install"
      onClick={() => copy(command)}
      title="Copy install command"
    >
      <Icon name="terminal" size={14} />
      <code>{command}</code>
      <Icon name={copied ? 'check' : 'copy'} size={14} />
      <span className="pg-sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

const SCROLL_TOP_THRESHOLD = 480;

/** Floating "back to top" button. Its ring fills as the page scrolls. */
function ScrollToTop({ focusTarget }: { focusTarget: React.RefObject<HTMLElement | null> }): React.JSX.Element {
  const [visible, setVisible] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    let frame = 0;
    const update = (): void => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      // Progress goes straight to a CSS variable so scrolling never re-renders.
      buttonRef.current?.style.setProperty('--pg-totop-progress', progress.toFixed(4));
      setVisible(window.scrollY > SCROLL_TOP_THRESHOLD);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const scrollToTop = (): void => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    // The button hides once at the top; move focus to the page so keyboard users
    // aren't dropped back onto <body>.
    focusTarget.current?.focus({ preventScroll: true });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cx('pg-totop', visible && 'pg-totop--visible')}
      aria-label="Back to top"
      title="Back to top"
      onClick={scrollToTop}
    >
      <svg className="pg-totop-ring" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle className="pg-totop-track" cx="24" cy="24" r="22" />
        <circle className="pg-totop-progress" cx="24" cy="24" r="22" />
      </svg>
      <Icon name="arrowUp" size={18} strokeWidth={2} />
    </button>
  );
}

/* ------------------------------------------------------------------ */

function CommandPalette({ currentId, onClose }: { currentId: string; onClose: () => void }): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previousFocus = React.useRef<Element | null>(document.activeElement);

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PAGES;
    return PAGES.filter((page) =>
      `${page.label} ${page.group} ${page.description} ${(page.tags ?? []).join(' ')}`.toLowerCase().includes(needle),
    );
  }, [query]);

  React.useEffect(() => {
    inputRef.current?.focus();
    const previous = previousFocus.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      (previous as HTMLElement | null)?.focus?.();
    };
  }, []);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  React.useEffect(() => {
    const id = results[active]?.id;
    if (id) document.getElementById(`pg-option-${id}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const go = (page: PageDef | undefined): void => {
    if (!page) return;
    onClose();
    window.location.hash = page.id;
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (results.length ? (value + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (results.length ? (value - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      // The input is the only stop inside the dialog.
      event.preventDefault();
    }
  };

  return (
    <div
      className="pg-palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pg-palette" role="dialog" aria-modal="true" aria-label="Search pages">
        <div className="pg-palette-search">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and features…"
            role="combobox"
            aria-expanded="true"
            aria-controls="pg-palette-list"
            aria-activedescendant={results[active] ? `pg-option-${results[active].id}` : undefined}
            aria-autocomplete="list"
            spellCheck={false}
          />
          <Kbd>Esc</Kbd>
        </div>

        <ul id="pg-palette-list" className="pg-palette-list" role="listbox" aria-label="Pages">
          {results.length === 0 ? (
            <li className="pg-palette-empty">No pages match “{query}”.</li>
          ) : (
            results.map((page, index) => (
              <li
                key={page.id}
                id={`pg-option-${page.id}`}
                role="option"
                aria-selected={index === active}
                className="pg-palette-item"
                onMouseMove={() => setActive(index)}
                onClick={() => go(page)}
              >
                <span className="pg-palette-icon">
                  <Icon name={page.icon} size={16} />
                </span>
                <span className="pg-palette-text">
                  <b>
                    {page.label}
                    {page.id === currentId && <span className="pg-palette-current">current</span>}
                  </b>
                  <small>{page.description}</small>
                </span>
                <span className="pg-palette-group">{page.group}</span>
              </li>
            ))
          )}
        </ul>

        <div className="pg-palette-foot" aria-hidden="true">
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span>
            <Kbd>↵</Kbd> open
          </span>
          <span>
            <Kbd>Esc</Kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
