import * as React from 'react';
import type { Density, ExportFormat, ToolbarConfig } from '../types';
import { countConditions } from '../core/filter';
import { EXPORT_LABELS } from '../export';
import { cx } from '../utils';
import { useGridContext } from './context';
import { Button, MenuDivider, MenuItem, Popover } from './primitives';
import { ColumnsPanel } from './ColumnsPanel';
import { FilterPanel } from './FilterPanel';
import { SearchInput } from './SearchInput';
import {
  ColumnsIcon,
  DensityIcon,
  DownloadIcon,
  ExitFullscreenIcon,
  FilterIcon,
  FullscreenIcon,
  PlusIcon,
  RedoIcon,
  RefreshIcon,
  SettingsIcon,
  UndoIcon,
} from './icons';

const DENSITIES: Density[] = ['dense', 'compact', 'comfortable', 'spacious'];

export interface ToolbarProps<T> {
  config: ToolbarConfig<T>;
  searchRef?: React.MutableRefObject<HTMLInputElement | null>;
  isSmallScreen?: boolean;
}

export function Toolbar<T>({ config, searchRef, isSmallScreen }: ToolbarProps<T>): React.JSX.Element {
  const ctx = useGridContext<T>();
  const { api, state, theme, labels, props, loading, selection } = ctx;
  const ui = theme.ui.toolbar ?? {};

  if (config.render) return <>{config.render({ grid: api })}</>;

  const activeFilters = countConditions(state.filters);

  const exportFormats: ExportFormat[] = Array.isArray(config.export)
    ? config.export
    : Array.isArray(props.exportable)
      ? props.exportable
      : ['csv', 'excel', 'json', 'print', 'clipboard'];

  return (
    <div
      className={cx(
        'sdg-toolbar',
        ui.variant && ui.variant !== 'default' && `sdg-toolbar--${ui.variant}`,
        ui.position === 'bottom' && 'sdg-toolbar--bottom',
        'sdg-toolbar--bordered',
        ui.className,
      )}
      style={ui.style}
      role="toolbar"
      aria-label="Grid toolbar"
    >
      {config.title && <span className="sdg-toolbar-title">{config.title}</span>}
      {config.start}

      {config.search && <SearchInput autoFocusRef={searchRef} />}

      {ui.align === 'between' && <span className="sdg-toolbar-spacer" />}

      <div className="sdg-toolbar-group">
        {config.filter && (
          <Popover
            align="start"
            sheet={isSmallScreen}
            label={labels.filters}
            trigger={(triggerProps) => (
              <Button {...triggerProps} size="sm" active={activeFilters > 0} title={labels.filter}>
                <FilterIcon size={15} />
                {labels.filter}
                {activeFilters > 0 && <span className="sdg-badge-count">{activeFilters}</span>}
              </Button>
            )}
          >
            {(close) => <FilterPanel<T> onClose={close} />}
          </Popover>
        )}

        {config.columns && (
          <Popover
            align="end"
            sheet={isSmallScreen}
            label={labels.columns}
            trigger={(triggerProps) => (
              <Button {...triggerProps} size="sm" title={labels.columns}>
                <ColumnsIcon size={15} />
                {!isSmallScreen && labels.columns}
              </Button>
            )}
          >
            {() => <ColumnsPanel />}
          </Popover>
        )}

        {config.export && (
          <Popover
            align="end"
            label={labels.export}
            trigger={(triggerProps) => (
              <Button {...triggerProps} size="sm" title={labels.export}>
                <DownloadIcon size={15} />
                {!isSmallScreen && labels.export}
              </Button>
            )}
          >
            {(close) => (
              <div role="menu" style={{ minWidth: 190 }}>
                {exportFormats.map((format) => (
                  <MenuItem
                    key={format}
                    onClick={() => {
                      void api.exportData({ format, scope: 'filtered' });
                      close();
                    }}
                  >
                    {EXPORT_LABELS[format]}
                  </MenuItem>
                ))}
                {selection.size > 0 && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      onClick={() => {
                        void api.exportData({ format: 'csv', scope: 'selected' });
                        close();
                      }}
                    >
                      {`CSV — ${selection.size} ${labels.selected}`}
                    </MenuItem>
                  </>
                )}
              </div>
            )}
          </Popover>
        )}

        {props.editable && (
          <>
            <Button
              size="sm"
              icon
              title={labels.undo}
              aria-label={labels.undo}
              disabled={!api.canUndo()}
              onClick={() => api.undo()}
            >
              <UndoIcon size={15} />
            </Button>
            <Button
              size="sm"
              icon
              title={labels.redo}
              aria-label={labels.redo}
              disabled={!api.canRedo()}
              onClick={() => api.redo()}
            >
              <RedoIcon size={15} />
            </Button>
          </>
        )}

        {config.addRow && (
          <Button size="sm" variant="primary" onClick={() => props.onAddRow?.({ grid: api })}>
            <PlusIcon size={15} />
            {labels.addRow}
          </Button>
        )}

        {config.density && (
          <Popover
            align="end"
            label={labels.density}
            trigger={(triggerProps) => (
              <Button {...triggerProps} size="sm" icon title={labels.density} aria-label={labels.density}>
                <DensityIcon size={15} />
              </Button>
            )}
          >
            {(close) => (
              <div role="menu" style={{ minWidth: 160 }}>
                {DENSITIES.map((density) => (
                  <MenuItem
                    key={density}
                    active={ctx.density === density}
                    onClick={() => {
                      api.setDensity(density);
                      close();
                    }}
                  >
                    {density[0].toUpperCase() + density.slice(1)}
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
        )}

        {config.refresh && (
          <Button
            size="sm"
            icon
            title={labels.refresh}
            aria-label={labels.refresh}
            disabled={loading}
            onClick={() => api.refresh()}
          >
            <RefreshIcon size={15} />
          </Button>
        )}

        {config.fullscreen && (
          <Button
            size="sm"
            icon
            title={state.fullscreen ? labels.exitFullscreen : labels.fullscreen}
            aria-label={state.fullscreen ? labels.exitFullscreen : labels.fullscreen}
            active={state.fullscreen}
            onClick={() => api.toggleFullscreen()}
          >
            {state.fullscreen ? <ExitFullscreenIcon size={15} /> : <FullscreenIcon size={15} />}
          </Button>
        )}

        {config.settings && (
          <Popover
            align="end"
            label={labels.settings}
            trigger={(triggerProps) => (
              <Button {...triggerProps} size="sm" icon title={labels.settings} aria-label={labels.settings}>
                <SettingsIcon size={15} />
              </Button>
            )}
          >
            {(close) => (
              <div role="menu" style={{ minWidth: 200 }}>
                <MenuItem
                  onClick={() => {
                    api.resetColumns();
                    close();
                  }}
                >
                  Reset columns
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    api.resetState();
                    close();
                  }}
                >
                  Reset everything
                </MenuItem>
              </div>
            )}
          </Popover>
        )}
      </div>

      {props.plugins?.map((plugin) =>
        plugin.toolbar ? <React.Fragment key={plugin.name}>{plugin.toolbar({ grid: api })}</React.Fragment> : null,
      )}

      {config.end}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Bulk selection bar
 * ------------------------------------------------------------------ */

export function SelectionBar<T>(): React.JSX.Element | null {
  const { api, selection, labels, props, totalRows } = useGridContext<T>();
  if (selection.size === 0) return null;

  const bulkActions = props.bulkActions ?? [];

  return (
    <div className="sdg-selection-bar" role="status">
      <strong>{selection.size}</strong>
      <span>{labels.selected}</span>

      {selection.size < totalRows && (
        <Button size="xs" variant="ghost" onClick={() => api.selectAll('filtered')}>
          {`Select all ${totalRows}`}
        </Button>
      )}

      <span className="sdg-toolbar-spacer" />

      {bulkActions.map((action) => {
        const rows = api.getSelectedRows();
        const disabled =
          typeof action.disabled === 'function' ? action.disabled(rows) : Boolean(action.disabled);
        return (
          <Button
            key={action.id}
            size="sm"
            variant={action.danger ? 'danger' : 'default'}
            disabled={disabled}
            onClick={() => action.onClick(rows, { grid: api })}
          >
            {action.icon}
            {action.label}
          </Button>
        );
      })}

      <Button size="sm" variant="ghost" onClick={() => api.clearSelection()}>
        {labels.clearSelection}
      </Button>
    </div>
  );
}
