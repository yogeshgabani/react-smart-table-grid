import type {
  Density,
  GridTheme,
  ThemeBorders,
  ThemeColors,
  ThemeMotion,
  ThemeRadius,
  ThemeShadows,
  ThemeSizing,
  ThemeSpacing,
  ThemeTypography,
} from '../types';

export const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryContrast: '#FFFFFF',
  secondary: '#64748B',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0891B2',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  overlay: 'rgba(15, 23, 42, 0.45)',
  focusRing: 'rgba(37, 99, 235, 0.35)',

  headerBackground: '#F8FAFC',
  headerText: '#334155',

  rowBackground: '#FFFFFF',
  rowAltBackground: '#F8FAFC',
  rowHover: '#F1F5F9',
  rowSelected: '#EFF6FF',
  rowSelectedHover: '#DBEAFE',

  scrollbarThumb: '#CBD5E1',
  scrollbarTrack: 'transparent',

  pinShadow: 'rgba(15, 23, 42, 0.13)',
  hoverOverlay: 'rgba(15, 23, 42, 0.06)',
  activeOverlay: 'rgba(15, 23, 42, 0.12)',
};

export const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  primaryContrast: '#0B1220',
  secondary: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#22D3EE',

  background: '#0B1220',
  surface: '#111827',
  surfaceAlt: '#0F172A',

  text: '#E2E8F0',
  textMuted: '#94A3B8',
  textInverse: '#0B1220',

  border: '#1F2937',
  borderStrong: '#334155',
  overlay: 'rgba(2, 6, 23, 0.6)',
  focusRing: 'rgba(59, 130, 246, 0.45)',

  headerBackground: '#0F172A',
  headerText: '#CBD5E1',

  rowBackground: '#111827',
  rowAltBackground: '#0F172A',
  rowHover: '#1E293B',
  rowSelected: '#172554',
  rowSelectedHover: '#1E3A8A',

  scrollbarThumb: '#334155',
  scrollbarTrack: 'transparent',

  pinShadow: 'rgba(0, 0, 0, 0.45)',
  hoverOverlay: 'rgba(226, 232, 240, 0.08)',
  activeOverlay: 'rgba(226, 232, 240, 0.16)',
};

export const defaultTypography: ThemeTypography = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: '14px',
  headerFontSize: '13px',
  fontWeight: 400,
  headerFontWeight: 600,
  lineHeight: 1.5,
  letterSpacing: 'normal',
};

export const defaultSpacing: ThemeSpacing = {
  unit: 4,
  cellPaddingX: '16px',
  cellPaddingY: '12px',
  headerPaddingX: '16px',
  headerPaddingY: '12px',
  gap: '8px',
};

export const defaultBorders: ThemeBorders = {
  width: '1px',
  style: 'solid',
  headerBorder: true,
  rowBorder: true,
  columnBorder: false,
  outerBorder: true,
};

export const defaultRadius: ThemeRadius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '14px',
  full: '9999px',
  container: '10px',
};

export const defaultShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg: '0 12px 32px rgba(15, 23, 42, 0.12)',
  container: '0 1px 3px rgba(15, 23, 42, 0.06)',
  pinned: '4px 0 8px -4px rgba(15, 23, 42, 0.15)',
  sticky: '0 2px 4px -2px rgba(15, 23, 42, 0.12)',
};

// A navy-tinted shadow all but disappears against a dark surface, so popovers
// and pinned columns need real black-based shadows in dark mode instead of
// just swapping colors.
export const darkShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.35)',
  md: '0 4px 14px rgba(0, 0, 0, 0.45)',
  lg: '0 16px 40px rgba(0, 0, 0, 0.55)',
  container: '0 1px 3px rgba(0, 0, 0, 0.4)',
  pinned: '4px 0 10px -4px rgba(0, 0, 0, 0.5)',
  sticky: '0 2px 6px -2px rgba(0, 0, 0, 0.45)',
};

export const defaultSizing: ThemeSizing = {
  headerHeight: 48,
  rowHeight: 52,
  toolbarHeight: 56,
  footerHeight: 48,
  paginationHeight: 56,
};

export const defaultMotion: ThemeMotion = {
  enabled: true,
  duration: '160ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/** Density adjusts sizing and padding without touching the rest of the theme. */
export const densityTokens: Record<
  Density,
  { rowHeight: number; headerHeight: number; cellPaddingY: string; cellPaddingX: string; fontSize: string }
> = {
  dense: { rowHeight: 32, headerHeight: 34, cellPaddingY: '4px', cellPaddingX: '8px', fontSize: '12px' },
  compact: { rowHeight: 40, headerHeight: 42, cellPaddingY: '6px', cellPaddingX: '12px', fontSize: '13px' },
  comfortable: { rowHeight: 52, headerHeight: 48, cellPaddingY: '12px', cellPaddingX: '16px', fontSize: '14px' },
  spacious: { rowHeight: 64, headerHeight: 58, cellPaddingY: '18px', cellPaddingX: '20px', fontSize: '15px' },
};

/** The theme every other theme is layered on top of. */
export const defaultTheme: GridTheme = {
  name: 'default',
  mode: 'light',
  colors: lightColors,
  typography: defaultTypography,
  spacing: defaultSpacing,
  borders: defaultBorders,
  radius: defaultRadius,
  shadows: defaultShadows,
  sizing: defaultSizing,
  motion: defaultMotion,
  density: 'comfortable',
  ui: {
    table: { variant: 'default', layout: 'fixed' },
    header: { variant: 'default', sticky: true, border: true },
    row: { striped: false, border: true },
    pagination: { variant: 'default', position: 'bottom-right', size: 'md' },
    search: { variant: 'default', size: 'md', clearable: true },
    checkbox: { variant: 'rounded', size: 'md' },
    loading: { variant: 'skeleton', rows: 8 },
    emptyState: { variant: 'default' },
    errorState: { variant: 'retry', retry: true },
    toolbar: { variant: 'default', align: 'between', position: 'top' },
    // No default `display`: it depends on whether the actions have icons.
    actions: {},
    button: { variant: 'default' },
    filter: { placement: 'panel' },
  },
  __smartGridTheme: true,
};
