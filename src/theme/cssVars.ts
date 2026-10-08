import type { CSSProperties } from 'react';
import type { GridTheme } from '../types';
import { px } from '../utils';

type Vars = Record<string, string>;

function set(vars: Vars, name: string, value: string | number | undefined | null): void {
  if (value === undefined || value === null || value === '') return;
  vars[name] = typeof value === 'number' ? String(value) : value;
}

/**
 * Flatten a resolved theme into `--grid-*` custom properties.
 *
 * `ui` slot values win over raw tokens here, which is what makes
 * `ui={{ header: { background: '#111' } }}` beat the theme's header colour
 * without any CSS class gymnastics.
 */
export function themeToCssVars(theme: GridTheme): CSSProperties {
  const vars: Vars = {};
  const { colors, typography, spacing, borders, radius, shadows, sizing, motion, ui } = theme;

  /* palette --------------------------------------------------------- */
  set(vars, '--grid-primary', colors.primary);
  set(vars, '--grid-primary-hover', colors.primaryHover);
  set(vars, '--grid-primary-contrast', colors.primaryContrast);
  set(vars, '--grid-secondary', colors.secondary);
  set(vars, '--grid-success', colors.success);
  set(vars, '--grid-warning', colors.warning);
  set(vars, '--grid-danger', colors.danger);
  set(vars, '--grid-info', colors.info);

  set(vars, '--grid-background', ui.table?.background ?? colors.background);
  set(vars, '--grid-surface', colors.surface);
  set(vars, '--grid-surface-alt', colors.surfaceAlt);

  set(vars, '--grid-text', ui.cell?.color ?? colors.text);
  set(vars, '--grid-muted', colors.textMuted);
  set(vars, '--grid-text-inverse', colors.textInverse);

  set(vars, '--grid-border', ui.table?.borderColor ?? colors.border);
  set(vars, '--grid-border-strong', colors.borderStrong);
  set(vars, '--grid-border-width', borders.width);
  set(vars, '--grid-border-style', borders.style);
  set(vars, '--grid-overlay', colors.overlay);
  set(vars, '--grid-focus-ring', colors.focusRing);

  /* typography ------------------------------------------------------ */
  set(vars, '--grid-font-family', typography.fontFamily);
  set(vars, '--grid-mono-family', typography.monoFamily);
  set(vars, '--grid-font-size', px(ui.cell?.fontSize) ?? typography.fontSize);
  set(vars, '--grid-font-weight', ui.cell?.fontWeight ?? typography.fontWeight);
  set(vars, '--grid-line-height', typography.lineHeight);
  set(vars, '--grid-letter-spacing', typography.letterSpacing);

  /* header ---------------------------------------------------------- */
  set(vars, '--grid-header-background', ui.header?.background ?? colors.headerBackground);
  set(vars, '--grid-header-text', ui.header?.color ?? colors.headerText);
  set(vars, '--grid-header-height', px(ui.header?.height ?? sizing.headerHeight));
  set(vars, '--grid-header-font-size', px(ui.header?.fontSize) ?? typography.headerFontSize);
  set(vars, '--grid-header-font-weight', ui.header?.fontWeight ?? typography.headerFontWeight);
  set(vars, '--grid-header-letter-spacing', ui.header?.letterSpacing ?? typography.letterSpacing);
  set(vars, '--grid-header-transform', ui.header?.textTransform ?? 'none');
  set(vars, '--grid-header-border-color', ui.header?.borderColor ?? colors.border);
  // Falls back to an overlay tinted with the header's own text colour, so a
  // sortable header shows a real hover on light and dark headers alike.
  set(
    vars,
    '--grid-header-hover',
    ui.header?.hoverBackground ?? 'color-mix(in srgb, currentColor 9%, transparent)',
  );
  set(vars, '--grid-header-padding', ui.headerCell?.padding ?? `${spacing.headerPaddingY} ${spacing.headerPaddingX}`);

  /* rows ------------------------------------------------------------ */
  set(vars, '--grid-row-background', ui.row?.background ?? colors.rowBackground);
  set(vars, '--grid-row-alt-background', ui.row?.altBackground ?? colors.rowAltBackground);
  set(vars, '--grid-row-hover', ui.row?.hoverBackground ?? colors.rowHover);
  set(vars, '--grid-row-selected', ui.row?.selectedBackground ?? colors.rowSelected);
  set(
    vars,
    '--grid-row-selected-hover',
    ui.row?.selectedHoverBackground ?? colors.rowSelectedHover,
  );
  set(vars, '--grid-row-height', px(ui.row?.height ?? sizing.rowHeight));
  set(vars, '--grid-row-border-color', ui.row?.borderColor ?? colors.border);
  set(
    vars,
    '--grid-row-accent',
    ui.row?.selectedAccent === true
      ? colors.primary
      : typeof ui.row?.selectedAccent === 'string'
        ? ui.row.selectedAccent
        : 'transparent',
  );

  /* cells ----------------------------------------------------------- */
  set(vars, '--grid-cell-padding', ui.cell?.padding ?? `${spacing.cellPaddingY} ${spacing.cellPaddingX}`);
  set(vars, '--grid-cell-border-color', ui.cell?.borderColor ?? colors.border);

  /* spacing, radius, shadow ----------------------------------------- */
  set(vars, '--grid-spacing', `${spacing.unit}px`);
  set(vars, '--grid-gap', spacing.gap);
  set(vars, '--grid-radius', px(ui.table?.radius) ?? radius.container);
  set(vars, '--grid-radius-sm', radius.sm);
  set(vars, '--grid-radius-md', radius.md);
  set(vars, '--grid-radius-lg', radius.lg);
  set(vars, '--grid-radius-xl', radius.xl);
  set(vars, '--grid-radius-full', radius.full);
  set(vars, '--grid-shadow', ui.table?.shadow ?? shadows.container);
  set(vars, '--grid-shadow-sm', shadows.sm);
  set(vars, '--grid-shadow-md', shadows.md);
  set(vars, '--grid-shadow-lg', shadows.lg);
  set(vars, '--grid-shadow-pinned', shadows.pinned);
  set(vars, '--grid-shadow-sticky', shadows.sticky);
  set(vars, '--grid-pin-shadow-color', colors.pinShadow);
  set(vars, '--grid-pin-shadow-size', px(ui.table?.pinShadowSize ?? 8));

  /* interaction overlays ------------------------------------------- */
  set(vars, '--grid-hover-overlay', colors.hoverOverlay);
  set(vars, '--grid-active-overlay', colors.activeOverlay);

  /* chrome ---------------------------------------------------------- */
  set(vars, '--grid-toolbar-height', px(ui.toolbar?.height ?? sizing.toolbarHeight));
  set(vars, '--grid-toolbar-background', ui.toolbar?.background ?? 'transparent');
  set(vars, '--grid-toolbar-padding', ui.toolbar?.padding ?? '8px 12px');
  set(vars, '--grid-toolbar-gap', ui.toolbar?.gap ?? spacing.gap);
  set(vars, '--grid-footer-height', px(ui.footer?.height ?? sizing.footerHeight));
  set(vars, '--grid-footer-background', ui.footer?.background ?? colors.surfaceAlt);
  set(vars, '--grid-footer-text', ui.footer?.color ?? colors.text);
  set(vars, '--grid-pagination-height', px(ui.pagination?.height ?? sizing.paginationHeight));
  set(vars, '--grid-pagination-active-bg', ui.pagination?.activeBackground ?? colors.primary);
  set(vars, '--grid-pagination-active-color', ui.pagination?.activeColor ?? colors.primaryContrast);
  set(vars, '--grid-pagination-radius', px(ui.pagination?.radius) ?? radius.md);
  set(vars, '--grid-pagination-gap', ui.pagination?.gap ?? '4px');

  /* controls -------------------------------------------------------- */
  set(vars, '--grid-checkbox-color', ui.checkbox?.color ?? colors.primary);
  set(vars, '--grid-checkbox-border', ui.checkbox?.borderColor ?? colors.borderStrong);
  set(vars, '--grid-checkbox-radius', px(ui.checkbox?.radius) ?? radius.sm);
  set(vars, '--grid-search-background', ui.search?.background ?? colors.surface);
  set(vars, '--grid-search-color', ui.search?.color ?? colors.text);
  set(vars, '--grid-search-border', ui.search?.borderColor ?? colors.border);
  set(vars, '--grid-search-radius', px(ui.search?.radius) ?? radius.md);
  set(vars, '--grid-search-width', px(ui.search?.width) ?? '240px');
  set(vars, '--grid-button-radius', px(ui.button?.radius) ?? radius.md);

  /* scrollbar ------------------------------------------------------- */
  set(vars, '--grid-scrollbar-width', px(ui.scrollbar?.width ?? 10));
  set(vars, '--grid-scrollbar-thumb', ui.scrollbar?.thumbColor ?? colors.scrollbarThumb);
  set(vars, '--grid-scrollbar-track', ui.scrollbar?.trackColor ?? colors.scrollbarTrack);

  /* motion ---------------------------------------------------------- */
  set(vars, '--grid-duration', motion.enabled ? motion.duration : '0ms');
  set(vars, '--grid-easing', motion.easing);

  /* escape hatch ---------------------------------------------------- */
  if (theme.cssVars) {
    for (const [key, value] of Object.entries(theme.cssVars)) {
      set(vars, key.startsWith('--') ? key : `--${key}`, value);
    }
  }

  return vars as CSSProperties;
}

/** The design tokens documented in the README, for the theme builder UI. */
export const documentedCssVars = [
  '--grid-primary',
  '--grid-background',
  '--grid-header-background',
  '--grid-header-text',
  '--grid-row-background',
  '--grid-row-hover',
  '--grid-row-selected',
  '--grid-border',
  '--grid-text',
  '--grid-muted',
  '--grid-radius',
  '--grid-spacing',
  '--grid-font-size',
  '--grid-header-height',
  '--grid-row-height',
] as const;
