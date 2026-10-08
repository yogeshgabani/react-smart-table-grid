import type { RowAction } from '../types';

export type RowActionsDisplay = 'buttons' | 'iconButtons' | 'dropdown' | 'contextMenu';

/**
 * The display to use when the theme doesn't pick one: icon buttons when every
 * action has an icon, otherwise the "⋯" menu — never a row of bare initials.
 */
export function resolveActionsDisplay<T>(
  actions: RowAction<T>[],
  configured: RowActionsDisplay | undefined,
): RowActionsDisplay {
  if (configured) return configured;
  return actions.length > 0 && actions.every((action) => action.icon) ? 'iconButtons' : 'dropdown';
}
