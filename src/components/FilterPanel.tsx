import * as React from 'react';
import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FiltersState,
  LogicOperator,
  ResolvedColumn,
} from '../types';
import {
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  UNARY_OPERATORS,
  collectOptions,
  createFilterGroup,
  defaultOperator,
  inferFilterType,
  isFilterGroup,
} from '../core/filter';
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECT_COLUMN_ID } from '../core/columns';
import { toText } from '../utils';
import { useGridContext } from './context';
import { Button, Select } from './primitives';
import { CloseIcon, PlusIcon } from './icons';

const SYSTEM = new Set([SELECT_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID]);

let conditionCounter = 0;
function newConditionId(): string {
  conditionCounter += 1;
  return `cond-${conditionCounter}`;
}

/* ------------------------------------------------------------------ *
 * Value input
 * ------------------------------------------------------------------ */

function ValueInput<T>({
  condition,
  column,
  rows,
  onChange,
}: {
  condition: FilterCondition;
  column: ResolvedColumn<T> | undefined;
  rows: T[];
  onChange: (patch: Partial<FilterCondition>) => void;
}): React.JSX.Element | null {
  const type = column ? inferFilterType(column) : 'text';

  if (UNARY_OPERATORS.includes(condition.operator)) return null;

  const options = React.useMemo(() => {
    if (!column) return [];
    if (column.filterOptions?.length) return column.filterOptions;
    if (type === 'select' || type === 'multiSelect' || type === 'radio' || type === 'checkbox') {
      return collectOptions(rows, column, 60);
    }
    return [];
  }, [column, rows, type]);

  if (condition.operator === 'between') {
    const inputType = type === 'date' || type === 'dateRange' ? 'date' : 'number';
    return (
      <>
        <input
          className="sdg-input"
          style={{ width: 110 }}
          type={inputType}
          value={toText(condition.value)}
          onChange={(event) => onChange({ value: event.target.value })}
          aria-label="From"
        />
        <span style={{ color: 'var(--grid-muted)' }}>–</span>
        <input
          className="sdg-input"
          style={{ width: 110 }}
          type={inputType}
          value={toText(condition.value2)}
          onChange={(event) => onChange({ value2: event.target.value })}
          aria-label="To"
        />
      </>
    );
  }

  if (condition.operator === 'in' || condition.operator === 'notIn' || type === 'multiSelect') {
    const selected = Array.isArray(condition.value) ? condition.value.map(toText) : [];
    return (
      <select
        className="sdg-select"
        multiple
        size={Math.min(4, Math.max(2, options.length))}
        style={{ minWidth: 150, height: 'auto' }}
        value={selected}
        onChange={(event) =>
          onChange({ value: Array.from(event.target.selectedOptions).map((option) => option.value) })
        }
        aria-label="Values"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (options.length > 0) {
    return (
      <Select
        style={{ minWidth: 150 }}
        value={toText(condition.value)}
        options={[
          { label: '—', value: '' },
          ...options.map((option) => ({ label: option.label, value: String(option.value) })),
        ]}
        onChange={(value) => onChange({ value })}
        aria-label="Value"
      />
    );
  }

  if (type === 'boolean') {
    return (
      <Select
        value={toText(condition.value)}
        options={[
          { label: '—', value: '' },
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ]}
        onChange={(value) => onChange({ value: value === 'true' })}
        aria-label="Value"
      />
    );
  }

  const inputType = type === 'number' || type === 'slider' ? 'number' : type === 'date' ? 'date' : 'text';

  return (
    <input
      className="sdg-input"
      style={{ flex: 1, minWidth: 130 }}
      type={inputType}
      value={toText(condition.value)}
      onChange={(event) => onChange({ value: event.target.value })}
      placeholder="Value"
      aria-label="Value"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Group editor
 * ------------------------------------------------------------------ */

function GroupEditor<T>({
  group,
  columns,
  rows,
  depth,
  onChange,
  onRemove,
}: {
  group: FilterGroup;
  columns: ResolvedColumn<T>[];
  rows: T[];
  depth: number;
  onChange: (next: FilterGroup) => void;
  onRemove?: () => void;
}): React.JSX.Element {
  const { labels } = useGridContext<T>();
  const byId = React.useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const setLogic = (operator: LogicOperator): void => onChange({ ...group, operator });

  const updateNode = (index: number, next: FilterNode): void => {
    const conditions = group.conditions.slice();
    conditions[index] = next;
    onChange({ ...group, conditions });
  };

  const removeNode = (index: number): void => {
    onChange({ ...group, conditions: group.conditions.filter((_, i) => i !== index) });
  };

  const addCondition = (): void => {
    const column = columns[0];
    if (!column) return;
    const type = inferFilterType(column);
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { id: newConditionId(), field: column.id, operator: defaultOperator(type), type },
      ],
    });
  };

  return (
    <div className="sdg-filter-group">
      <div className="sdg-filter-row">
        <div className="sdg-filter-logic" role="group" aria-label="Combine with">
          {(['AND', 'OR', 'NOT'] as LogicOperator[]).map((operator) => (
            <button
              key={operator}
              type="button"
              aria-pressed={group.operator === operator}
              onClick={() => setLogic(operator)}
            >
              {operator}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        {onRemove && (
          <Button size="xs" icon variant="ghost" aria-label="Remove group" onClick={onRemove}>
            <CloseIcon size={13} />
          </Button>
        )}
      </div>

      {group.conditions.map((node, index) => {
        if (isFilterGroup(node)) {
          return (
            <GroupEditor<T>
              key={node.id ?? index}
              group={node}
              columns={columns}
              rows={rows}
              depth={depth + 1}
              onChange={(next) => updateNode(index, next)}
              onRemove={() => removeNode(index)}
            />
          );
        }

        const column = byId.get(node.field);
        const type = column ? inferFilterType(column) : 'text';
        const operators = column?.filterOperators ?? OPERATORS_BY_TYPE[type];

        return (
          <div className="sdg-filter-row" key={node.id ?? index}>
            <span style={{ color: 'var(--grid-muted)', fontSize: 12, minWidth: 44 }}>
              {index === 0 ? labels.where : group.operator}
            </span>

            <Select
              value={node.field}
              options={columns.map((column) => ({
                label: typeof column.header === 'string' ? column.header : column.id,
                value: column.id,
              }))}
              onChange={(field) => {
                const nextColumn = byId.get(field);
                const nextType = nextColumn ? inferFilterType(nextColumn) : 'text';
                updateNode(index, {
                  ...node,
                  field,
                  type: nextType,
                  operator: defaultOperator(nextType),
                  value: undefined,
                  value2: undefined,
                });
              }}
              aria-label="Column"
            />

            <Select
              value={node.operator}
              options={operators.map((operator) => ({ label: OPERATOR_LABELS[operator], value: operator }))}
              onChange={(operator) => updateNode(index, { ...node, operator: operator as FilterOperator })}
              aria-label="Operator"
            />

            <ValueInput<T>
              condition={node}
              column={column}
              rows={rows}
              onChange={(patch) => updateNode(index, { ...node, ...patch })}
            />

            <Button
              size="xs"
              icon
              variant="ghost"
              aria-label="Remove condition"
              onClick={() => removeNode(index)}
            >
              <CloseIcon size={13} />
            </Button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <Button size="xs" variant="ghost" onClick={addCondition}>
          <PlusIcon size={13} /> {labels.addCondition}
        </Button>
        {depth < 2 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() =>
              onChange({ ...group, conditions: [...group.conditions, createFilterGroup('OR')] })
            }
          >
            <PlusIcon size={13} /> {labels.addGroup}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Panel
 * ------------------------------------------------------------------ */

export function FilterPanel<T>({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { api, state, columns, labels, allRows } = useGridContext<T>();

  const filterable = React.useMemo(
    () => columns.all.filter((column) => !SYSTEM.has(column.id) && column.filterable !== false),
    [columns.all],
  );

  // Edit a local copy so half-built conditions don't blank the grid mid-typing.
  const [draft, setDraft] = React.useState<FiltersState>(() =>
    state.filters.length > 0 ? state.filters : [createFilterGroup('AND')],
  );

  const apply = (): void => {
    api.setFilters(draft.filter((group) => group.conditions.length > 0));
    onClose();
  };

  return (
    <div className="sdg-filter-panel">
      <div className="sdg-popover-header">
        <span>{labels.filters}</span>
        <Button size="xs" icon variant="ghost" aria-label="Close" onClick={onClose}>
          <CloseIcon size={14} />
        </Button>
      </div>

      {draft.map((group, index) => (
        <GroupEditor<T>
          key={group.id ?? index}
          group={group}
          columns={filterable}
          rows={allRows}
          depth={0}
          onChange={(next) => setDraft(draft.map((entry, i) => (i === index ? next : entry)))}
          onRemove={draft.length > 1 ? () => setDraft(draft.filter((_, i) => i !== index)) : undefined}
        />
      ))}

      <div className="sdg-popover-footer">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft([createFilterGroup('AND')]);
            api.clearFilters();
          }}
        >
          {labels.reset}
        </Button>
        <Button size="sm" variant="primary" onClick={apply}>
          {labels.apply}
        </Button>
      </div>
    </div>
  );
}
