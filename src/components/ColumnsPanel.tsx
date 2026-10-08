import * as React from 'react';
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECT_COLUMN_ID } from '../core/columns';
import { cx, toText } from '../utils';
import { useGridContext } from './context';
import { Button, Checkbox } from './primitives';
import { GripIcon, PinIcon } from './icons';

const SYSTEM = new Set([SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID]);

/** Column visibility, order and pinning — the "Column Settings" panel. */
export function ColumnsPanel(): React.JSX.Element {
  const { api, columns, state, labels, theme, props } = useGridContext();
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const list = columns.all.filter((column) => !SYSTEM.has(column.id));
  const order = list.map((column) => column.id);

  const isVisible = (id: string, hidden?: boolean): boolean => state.columnVisibility[id] ?? !hidden;

  return (
    <div style={{ minWidth: 260 }}>
      <div className="sdg-popover-header">
        <span>{labels.columns}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              const next: Record<string, boolean> = {};
              for (const column of list) next[column.id] = true;
              api.setState({ columnVisibility: next });
            }}
          >
            {labels.showAll}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => api.resetColumns()}>
            {labels.reset}
          </Button>
          {props.onSaveColumns && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                props.onSaveColumns?.({
                  columnOrder: order,
                  columnVisibility: state.columnVisibility,
                  columnPinning: state.columnPinning,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
              }}
            >
              {saved ? '✓' : labels.save}
            </Button>
          )}
        </span>
      </div>

      <div role="group" aria-label={labels.columns}>
        {list.map((column) => {
          const visible = isVisible(column.id, column.hidden);
          const label = typeof column.header === 'string' ? column.header : toText(column.id);

          return (
            <div
              key={column.id}
              className={cx('sdg-menu-item', overId === column.id && dragId !== column.id && 'sdg-menu-item--active')}
              style={{ cursor: 'default' }}
              draggable={column.reorderable !== false}
              onDragStart={(event) => {
                setDragId(column.id);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', column.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setOverId(column.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const source = event.dataTransfer.getData('text/plain') || dragId;
                setDragId(null);
                setOverId(null);
                if (!source || source === column.id) return;
                const targetIndex = order.indexOf(column.id);
                if (targetIndex >= 0) api.moveColumn(source, targetIndex);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
            >
              {column.reorderable !== false && (
                <span className="sdg-drag-handle" aria-hidden>
                  <GripIcon size={14} />
                </span>
              )}

              <Checkbox
                checked={visible}
                disabled={column.hideable === false}
                variant={theme.ui.checkbox?.variant}
                size="sm"
                aria-label={`Toggle ${label}`}
                onChange={(next) => api.toggleColumnVisibility(column.id, next)}
              />

              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </span>

              {column.pinnable !== false && (
                <Button
                  size="xs"
                  icon
                  variant="ghost"
                  active={Boolean(column.pinned)}
                  title={column.pinned ? labels.unpin : labels.pinLeft}
                  aria-label={column.pinned ? labels.unpin : labels.pinLeft}
                  onClick={() => api.pinColumn(column.id, column.pinned ? false : 'left')}
                >
                  <PinIcon size={13} />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
