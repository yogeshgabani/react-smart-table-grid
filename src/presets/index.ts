import type { GridPresetName, GridRow, SmartDataGridProps } from '../types';

/** A preset is just a bundle of props, applied under whatever the user passes. */
export type PresetProps<T = GridRow> = Partial<
  Pick<
    SmartDataGridProps<T>,
    | 'theme'
    | 'density'
    | 'sortable'
    | 'searchable'
    | 'filterable'
    | 'pagination'
    | 'selectable'
    | 'resizable'
    | 'reorderable'
    | 'stickyHeader'
    | 'showFooter'
    | 'exportable'
    | 'editable'
    | 'toolbar'
    | 'responsive'
    | 'ui'
    | 'virtualized'
    | 'highlightSearch'
    | 'multiSort'
  >
>;

/**
 * Opinionated starting points. Each preset sets a theme, a density and a
 * sensible feature set for that kind of application.
 */
export const gridPresets: Record<GridPresetName, PresetProps> = {
  admin: {
    theme: 'modern',
    density: 'comfortable',
    sortable: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 25, pageSizeOptions: [10, 25, 50, 100], variant: 'pill' },
    selectable: 'multiple',
    resizable: true,
    stickyHeader: true,
    exportable: ['csv', 'excel', 'print'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true, density: true, fullscreen: true },
  },

  crm: {
    theme: 'crm',
    density: 'comfortable',
    sortable: true,
    searchable: true,
    filterable: true,
    highlightSearch: true,
    pagination: { pageSize: 20, pageSizeOptions: [20, 50, 100], variant: 'pill' },
    selectable: 'multiple',
    resizable: true,
    reorderable: true,
    stickyHeader: true,
    exportable: ['csv', 'excel'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true },
    ui: { actions: { display: 'dropdown', showOnHover: true } },
  },

  hrms: {
    theme: 'hrms',
    density: 'comfortable',
    sortable: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 15, pageSizeOptions: [15, 30, 60] },
    selectable: 'multiple',
    stickyHeader: true,
    exportable: ['csv', 'excel', 'pdf'],
    toolbar: { search: true, filter: true, columns: true, export: true },
  },

  erp: {
    theme: 'erp',
    density: 'compact',
    sortable: true,
    multiSort: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 50, pageSizeOptions: [50, 100, 200, 500], variant: 'outlined', size: 'sm' },
    selectable: 'multiple',
    resizable: true,
    reorderable: true,
    stickyHeader: true,
    showFooter: true,
    virtualized: true,
    exportable: ['csv', 'excel', 'json'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true, density: true, fullscreen: true, settings: true },
  },

  analytics: {
    theme: 'analytics',
    density: 'compact',
    sortable: true,
    multiSort: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 25, pageSizeOptions: [25, 50, 100], variant: 'numbered', size: 'sm' },
    stickyHeader: true,
    showFooter: true,
    resizable: true,
    exportable: ['csv', 'json', 'excel'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true, density: true },
  },

  saas: {
    theme: 'saas',
    density: 'comfortable',
    sortable: true,
    searchable: true,
    filterable: true,
    highlightSearch: true,
    pagination: { pageSize: 10, pageSizeOptions: [10, 25, 50], variant: 'simple' },
    selectable: 'multiple',
    stickyHeader: true,
    exportable: ['csv'],
    toolbar: { search: true, filter: true, columns: true, export: true },
  },

  enterprise: {
    theme: 'enterprise',
    density: 'compact',
    sortable: true,
    multiSort: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 50, pageSizeOptions: [25, 50, 100, 250], variant: 'outlined' },
    selectable: 'multiple',
    resizable: true,
    reorderable: true,
    stickyHeader: true,
    showFooter: true,
    virtualized: true,
    exportable: ['csv', 'excel', 'json', 'pdf', 'print'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true, density: true, fullscreen: true, settings: true },
  },

  minimal: {
    theme: 'minimal',
    density: 'comfortable',
    sortable: true,
    pagination: { pageSize: 10, variant: 'minimal' },
    toolbar: false,
  },

  dashboard: {
    theme: 'dashboard',
    density: 'compact',
    sortable: true,
    searchable: true,
    pagination: { pageSize: 8, variant: 'minimal', size: 'sm', showPageSizeSelector: false },
    stickyHeader: true,
    toolbar: { search: true, refresh: true },
  },

  ecommerce: {
    theme: 'modern',
    density: 'comfortable',
    sortable: true,
    searchable: true,
    filterable: true,
    pagination: { pageSize: 24, pageSizeOptions: [12, 24, 48, 96], variant: 'pill' },
    selectable: 'multiple',
    resizable: true,
    stickyHeader: true,
    responsive: 'card',
    exportable: ['csv', 'excel'],
    toolbar: { search: true, filter: true, columns: true, export: true, refresh: true },
  },
};

export function getPreset<T>(name: GridPresetName | undefined): PresetProps<T> {
  if (!name) return {};
  return (gridPresets[name] ?? {}) as PresetProps<T>;
}

export const gridPresetNames = Object.keys(gridPresets) as GridPresetName[];
