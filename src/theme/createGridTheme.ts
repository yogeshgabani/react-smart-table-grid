import type {
  ColorMode,
  Density,
  GridTheme,
  GridThemeInput,
  GridUIConfig,
  ThemePreset,
} from '../types';
import { mergeAll } from '../utils';
import { isThemePreset, themePresets } from './presets';
import { darkColors, darkShadows, defaultShadows, defaultTheme, densityTokens, lightColors } from './tokens';

/** Slot keys `GridThemeInput` shares with `GridUIConfig`. */
const SLOT_KEYS = [
  'table',
  'header',
  'headerCell',
  'body',
  'row',
  'cell',
  'footer',
  'toolbar',
  'search',
  'filter',
  'pagination',
  'checkbox',
  'loading',
  'emptyState',
  'errorState',
  'scrollbar',
  'icon',
  'actions',
  'button',
] as const;

type ThemeTokens = Omit<GridThemeInput, (typeof SLOT_KEYS)[number] | 'extends'>;

/** Split a theme input into token overrides and slot (UI) overrides. */
function splitThemeInput(input: GridThemeInput): { tokens: ThemeTokens; ui: GridUIConfig } {
  const tokens: Record<string, unknown> = {};
  const ui: Record<string, unknown> = {};
  const slots = new Set<string>(SLOT_KEYS);

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (slots.has(key)) ui[key] = value;
    else if (key !== 'extends') tokens[key] = value;
  }
  return { tokens: tokens as ThemeTokens, ui: ui as GridUIConfig };
}

export function isResolvedTheme(value: unknown): value is GridTheme {
  return typeof value === 'object' && value !== null && '__smartGridTheme' in value;
}

/**
 * Build a reusable theme object.
 *
 * ```ts
 * const myTheme = createGridTheme({
 *   extends: 'modern',
 *   colors: { primary: '#2563EB' },
 *   header: { height: 52 },
 * });
 * ```
 */
export function createGridTheme(input: GridThemeInput = {}): GridTheme {
  const base: GridTheme = input.extends
    ? applyThemeInput(defaultTheme, themePresets[input.extends as Exclude<ThemePreset, 'system'>] ?? {})
    : defaultTheme;

  return applyThemeInput(base, input);
}

/** Layer one theme input onto a resolved theme. */
export function applyThemeInput(base: GridTheme, input: GridThemeInput): GridTheme {
  const { tokens, ui } = splitThemeInput(input);

  const mode = (tokens.mode ?? base.mode) as 'light' | 'dark';
  const paletteBase = mode === 'dark' && base.mode !== 'dark' ? darkColors : base.colors;

  return {
    ...base,
    name: tokens.name ?? base.name,
    mode,
    colors: mergeAll(paletteBase, tokens.colors),
    typography: mergeAll(base.typography, tokens.typography),
    spacing: mergeAll(base.spacing, tokens.spacing),
    borders: mergeAll(base.borders, tokens.borders),
    radius: mergeAll(base.radius, tokens.radius),
    shadows: mergeAll(base.shadows, tokens.shadows),
    sizing: mergeAll(base.sizing, tokens.sizing),
    motion: mergeAll(base.motion, tokens.motion),
    density: tokens.density ?? base.density,
    ui: mergeAll(base.ui, ui),
    dark: tokens.dark ?? base.dark,
    cssVars: mergeAll(base.cssVars ?? {}, tokens.cssVars ?? {}),
    __smartGridTheme: true,
  };
}

/** Apply density tokens on top of a theme. */
export function applyDensity(theme: GridTheme, density: Density): GridTheme {
  const tokens = densityTokens[density];
  if (!tokens) return theme;
  return {
    ...theme,
    density,
    sizing: {
      ...theme.sizing,
      rowHeight: theme.ui.row?.height ?? tokens.rowHeight,
      headerHeight: theme.ui.header?.height ?? tokens.headerHeight,
    },
    spacing: {
      ...theme.spacing,
      cellPaddingX: tokens.cellPaddingX,
      cellPaddingY: tokens.cellPaddingY,
    },
    typography: {
      ...theme.typography,
      fontSize: theme.typography.fontSize === defaultTheme.typography.fontSize ? tokens.fontSize : theme.typography.fontSize,
    },
  };
}

export interface ResolveThemeInput {
  theme?: ThemePreset | GridTheme | GridThemeInput;
  /** Highest-priority slot overrides, straight from the `ui` prop. */
  ui?: GridUIConfig;
  density?: Density;
  colorMode?: ColorMode;
  /** Result of a `prefers-color-scheme: dark` media query. */
  systemDark?: boolean;
}

/**
 * Resolve the final theme for a render.
 *
 * Priority (lowest → highest):
 *   default theme → preset theme → custom theme → `ui` overrides → component props
 *
 * Component props are applied by the components themselves, which is why this
 * function stops at `ui`.
 */
export function resolveTheme(input: ResolveThemeInput): GridTheme {
  const { theme, ui, density, colorMode = 'light', systemDark = false } = input;

  let resolved: GridTheme = defaultTheme;

  if (typeof theme === 'string') {
    if (theme === 'system') {
      resolved = applyThemeInput(defaultTheme, { mode: systemDark ? 'dark' : 'light' });
    } else if (isThemePreset(theme)) {
      resolved = applyThemeInput(defaultTheme, themePresets[theme]);
    }
  } else if (isResolvedTheme(theme)) {
    resolved = theme;
  } else if (theme && typeof theme === 'object') {
    resolved = createGridTheme(theme);
  }

  /* ---- dark mode -------------------------------------------------- */
  const wantsDark =
    colorMode === 'dark' || (colorMode === 'system' && systemDark) || resolved.mode === 'dark';

  if (wantsDark && resolved.mode !== 'dark') {
    // Preserve the theme's explicit colour/shadow choices on top of the dark
    // palette — but only the ones that still work there (see `darkSafeColors`).
    // A navy-tinted shadow is nearly invisible on a dark surface, so shadows
    // get the same light→dark swap colours do.
    resolved = {
      ...resolved,
      mode: 'dark',
      colors: mergeAll(darkColors, darkSafeColors(diffColors(resolved))),
      shadows: mergeAll(darkShadows, diffShadows(resolved)),
    };
  } else if (!wantsDark && resolved.mode === 'dark' && colorMode === 'light') {
    resolved = {
      ...resolved,
      mode: 'light',
      colors: mergeAll(lightColors, diffColors(resolved)),
      shadows: mergeAll(defaultShadows, diffShadows(resolved)),
    };
  }

  if (wantsDark && resolved.dark) {
    resolved = applyThemeInput(resolved, resolved.dark as GridThemeInput);
  }

  /* ---- density ---------------------------------------------------- */
  resolved = applyDensity(resolved, density ?? resolved.density);

  /* ---- `ui` prop wins over everything in the theme ---------------- */
  if (ui) {
    resolved = { ...resolved, ui: mergeAll(resolved.ui, ui) };
  }

  return resolved;
}

/** Colours a theme set that differ from the stock light palette. */
function diffColors(theme: GridTheme): Partial<GridTheme['colors']> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.colors)) {
    if ((lightColors as unknown as Record<string, string>)[key] !== value) out[key] = value;
  }
  return out as Partial<GridTheme['colors']>;
}

/** Background-like tokens: kept in dark mode only if they are dark themselves. */
const SURFACE_COLOR_KEYS = new Set([
  'background',
  'surface',
  'surfaceAlt',
  'border',
  'borderStrong',
  'headerBackground',
  'rowBackground',
  'rowAltBackground',
  'rowHover',
  'rowSelected',
  'rowSelectedHover',
  'scrollbarThumb',
]);

/** Foreground tokens: kept in dark mode only if they are light enough to read. */
const TEXT_COLOR_KEYS = new Set(['text', 'textMuted', 'headerText']);

/** WCAG relative luminance of an opaque-ish hex or rgb() colour; `null` if unknown or mostly transparent. */
function luminance(color: string): number | null {
  let channels: number[] | null = null;
  let alpha = 1;

  const hex = /^#([0-9a-f]{3,8})$/i.exec(color.trim());
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) digits = digits.replace(/./g, (d) => d + d);
    if (digits.length !== 6 && digits.length !== 8) return null;
    channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    if (digits.length === 8) alpha = parseInt(digits.slice(6, 8), 16) / 255;
  } else {
    const rgb = /^rgba?\(([^)]+)\)$/i.exec(color.trim());
    if (!rgb) return null;
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    channels = parts.slice(0, 3);
    if (parts.length > 3) alpha = parts[3];
  }

  if (alpha < 0.5) return null;
  const [r, g, b] = channels.map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Filter a light theme's explicit colours down to those that still read on a
 * dark surface. Brand colours (primary, success, overlays…) always carry over;
 * a preset's white header or near-black text does not, so `theme="modern"`
 * with `darkMode="dark"` gets a dark header instead of a white bar over a
 * dark body. Pin exact dark values with the theme's `dark` block.
 */
function darkSafeColors(colors: Partial<GridTheme['colors']>): Partial<GridTheme['colors']> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors) as Array<[string, string]>) {
    const level = luminance(value);
    if (SURFACE_COLOR_KEYS.has(key) && level !== null && level > 0.35) continue;
    if (TEXT_COLOR_KEYS.has(key) && level !== null && level < 0.45) continue;
    out[key] = value;
  }
  return out as Partial<GridTheme['colors']>;
}

/** Shadows a theme set that differ from the stock (light) shadow scale. */
function diffShadows(theme: GridTheme): Partial<GridTheme['shadows']> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.shadows)) {
    if ((defaultShadows as unknown as Record<string, string>)[key] !== value) out[key] = value;
  }
  return out as Partial<GridTheme['shadows']>;
}
