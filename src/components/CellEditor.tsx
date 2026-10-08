import * as React from 'react';
import type { EditorContext, EditorType, ResolvedColumn, RowUpdatePayload } from '../types';
import { cx, toDate, toLocalInputValue, toText } from '../utils';
import { useGridContext } from './context';
import { CheckIcon } from './icons';

export interface CellEditorProps<T> {
  column: ResolvedColumn<T>;
  row: T;
  rowId: string;
  rowIndex: number;
}

/** Pick a default editor from the column's cell type. */
function inferEditor<T>(column: ResolvedColumn<T>): EditorType {
  if (typeof column.editor === 'string') return column.editor;
  switch (column.type) {
    case 'number':
    case 'currency':
    case 'percentage':
    case 'progress':
    case 'rating':
      return 'number';
    case 'date':
      return 'date';
    case 'datetime':
    case 'relativeTime':
      return 'datetime';
    case 'boolean':
    case 'checkbox':
      return 'checkbox';
    case 'switch':
      return 'switch';
    case 'badge':
    case 'status':
      return column.editorOptions?.length ? 'select' : 'text';
    case 'tags':
    case 'json':
      return 'textarea';
    default:
      return column.editorOptions?.length ? 'select' : 'text';
  }
}

function toInputValue(value: unknown, editor: EditorType): string {
  if (value == null) return '';
  // Local time, not `toISOString()` — the UTC day is wrong for half the world,
  // and saving an untouched cell would silently shift it.
  if (editor === 'date' || editor === 'datetime') {
    const date = toDate(value);
    return date ? toLocalInputValue(date, editor === 'datetime') : '';
  }
  if (editor === 'textarea' && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return toText(value);
    }
  }
  return toText(value);
}

/**
 * The inline editor for a single cell.
 *
 * Commits on Enter or blur, discards on Escape, and blocks the commit when
 * `column.validate` returns a message.
 */
export function CellEditor<T>({ column, row, rowId, rowIndex }: CellEditorProps<T>): React.JSX.Element {
  const { api, props } = useGridContext<T>();
  const editor = inferEditor(column);

  const initial = column.getValue(row, rowIndex);
  const [draft, setDraft] = React.useState<unknown>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  // Blur fires while committing too; this stops a double commit.
  const committed = React.useRef(false);

  React.useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    if ('select' in node && typeof node.select === 'function' && editor !== 'checkbox' && editor !== 'switch') {
      node.select();
    }
  }, [editor]);

  const parse = React.useCallback(
    (raw: unknown): unknown => {
      if (column.parse && typeof raw === 'string') return column.parse(raw);
      if (editor === 'number') {
        if (raw === '' || raw == null) return null;
        const n = Number(raw);
        return Number.isNaN(n) ? raw : n;
      }
      if (editor === 'checkbox' || editor === 'switch') return Boolean(raw);
      if (editor === 'multiSelect' && typeof raw === 'string') {
        return raw.split(',').map((part) => part.trim()).filter(Boolean);
      }
      return raw;
    },
    [column, editor],
  );

  const cancel = React.useCallback(() => {
    committed.current = true;
    api.stopEditing(false);
  }, [api]);

  const save = React.useCallback(() => {
    if (committed.current) return;
    const value = parse(draft);

    const result = column.validate?.(value, row);
    if (typeof result === 'string') {
      setError(result);
      return;
    }

    committed.current = true;

    const previous = column.getValue(row, rowIndex);
    // A date input only ever holds `YYYY-MM-DD`, so compare at that precision
    // or every untouched timestamp would count as an edit.
    const changed =
      editor === 'date' || editor === 'datetime'
        ? toInputValue(value, editor) !== toInputValue(previous, editor)
        : value !== previous;
    if (changed) {
      const key = column.accessorKey ?? column.id;
      const changes = { [key]: value } as Partial<T>;
      api.updateRow(rowId, changes);

      const payload: RowUpdatePayload<T> = {
        rowId,
        row: { ...row, ...changes },
        previousRow: row,
        changes,
        columnId: column.id,
      };
      void props.onRowUpdate?.(payload);
    }
    api.stopEditing(true);
  }, [api, column, draft, parse, props, row, rowId, rowIndex]);

  const onKeyDown = (event: React.KeyboardEvent): void => {
    event.stopPropagation();
    if (event.key === 'Enter' && editor !== 'textarea') {
      event.preventDefault();
      save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    } else if (event.key === 'Tab') {
      save();
    }
  };

  /* ---- custom editor ------------------------------------------------ */
  if (typeof column.editor === 'function') {
    const ctx: EditorContext<T> = {
      value: draft,
      row,
      rowId,
      rowIndex,
      column,
      setValue: setDraft,
      save,
      cancel,
      error,
    };
    return <>{column.editor(ctx)}</>;
  }

  const shared = {
    onKeyDown,
    onBlur: save,
    className: 'sdg-editor',
  };

  let field: React.ReactNode;

  switch (editor) {
    case 'select':
      field = (
        <select
          {...shared}
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={toText(draft)}
          onChange={(event) => setDraft(event.target.value)}
        >
          <option value="" />
          {(column.editorOptions ?? []).map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;

    case 'textarea':
      field = (
        <textarea
          {...shared}
          className="sdg-editor sdg-editor--textarea"
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={toInputValue(draft, editor)}
          onChange={(event) => setDraft(event.target.value)}
        />
      );
      break;

    case 'checkbox':
    case 'switch':
      field = (
        <label className={cx('sdg-checkbox', editor === 'switch' && 'sdg-checkbox--switch')}>
          <input
            {...shared}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="checkbox"
            checked={Boolean(draft)}
            onChange={(event) => setDraft(event.target.checked)}
          />
          <span className="sdg-checkbox-box">
            <CheckIcon size={11} className="sdg-checkbox-check" />
          </span>
        </label>
      );
      break;

    case 'multiSelect':
      field = (
        <input
          {...shared}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={Array.isArray(draft) ? draft.join(', ') : toText(draft)}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="comma, separated, values"
        />
      );
      break;

    default:
      field = (
        <input
          {...shared}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={editor === 'number' ? 'number' : editor === 'date' ? 'date' : editor === 'datetime' ? 'datetime-local' : 'text'}
          value={toInputValue(draft, editor)}
          onChange={(event) => setDraft(event.target.value)}
        />
      );
  }

  return (
    <>
      {field}
      {error && (
        <span className="sdg-editor-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
