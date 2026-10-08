import * as React from 'react';

/**
 * Playground colour scheme. One switch drives both the page chrome and every
 * grid on the page, so a dark page never frames a bright white table.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

/** Kept in sync with the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = 'sdg-playground:theme';

interface PlaygroundTheme {
  mode: ThemeMode;
  resolved: ResolvedMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<PlaygroundTheme | null>(null);

function readStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage can be blocked — fall back to the system preference */
  }
  return 'system';
}

function useSystemDark(): boolean {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = React.useState(() => window.matchMedia?.(query).matches ?? false);

  React.useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const onChange = (): void => setDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return dark;
}

export function PlaygroundThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [mode, setModeState] = React.useState<ThemeMode>(readStoredMode);
  const systemDark = useSystemDark();
  const resolved: ResolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.pgTheme = resolved;
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* not persisting is fine */
    }
  }, []);

  const value = React.useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePlaygroundTheme(): PlaygroundTheme {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('usePlaygroundTheme() must be used inside <PlaygroundThemeProvider>');
  return context;
}

/** The value to hand a grid's `darkMode` prop so it matches the page. */
export function useGridMode(): ResolvedMode {
  return usePlaygroundTheme().resolved;
}
