import * as React from 'react';
import { SmartDataGrid, type ResponsiveMode } from 'react-smart-table-grid';
import { userColumns } from '../columns';
import { makeUsers, type User } from '../data';
import { useGridMode } from '../theme';
import { Demo, Field, Range, Segmented } from '../ui';

const users = makeUsers(30);

type Mode = Exclude<ResponsiveMode, false | 'responsive-columns'>;

const MODES: Array<{ value: Mode; label: string; text: string }> = [
  { value: 'horizontal-scroll', label: 'Scroll', text: 'The table keeps its columns and scrolls sideways.' },
  { value: 'stacked', label: 'Stacked', text: 'Below 640px each row stacks into label / value pairs.' },
  { value: 'card', label: 'Cards', text: 'Every row becomes a card; the first column is its title.' },
  { value: 'priority', label: 'Priority', text: 'Columns drop out as the viewport narrows, by `minViewport`.' },
];

const DEVICES = [
  { value: '375', label: 'Phone', width: 375 },
  { value: '768', label: 'Tablet', width: 768 },
  { value: '1100', label: 'Laptop', width: 1100 },
] as const;

export function Responsive(): React.JSX.Element {
  const mode = useGridMode();
  const [layout, setLayout] = React.useState<Mode>('card');
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>('ltr');
  const [width, setWidth] = React.useState(420);

  // `priority` hides columns below their declared minViewport.
  const priorityColumns = React.useMemo(
    () =>
      userColumns.map((column, index) => ({
        ...column,
        minViewport: index < 3 ? undefined : 700 + index * 60,
      })),
    [],
  );

  const device = DEVICES.find((entry) => entry.width === width)?.value ?? '';
  const current = MODES.find((entry) => entry.value === layout)!;

  return (
    <Demo
      icon="phone"
      title="Simulated device frame"
      description={`${current.text} The grid measures its own container, so shrinking the frame exercises the same code path as a real phone.`}
      code={`<SmartDataGrid\n  data={users}\n  columns={columns}\n  responsive="${layout}"${dir === 'rtl' ? '\n  dir="rtl"' : ''}\n/>`}
      plain
      toolbar={
        <>
          <Segmented<Mode>
            label="Layout"
            size="sm"
            value={layout}
            onChange={setLayout}
            options={MODES.map(({ value, label }) => ({ value, label }))}
          />
          <Segmented
            label="Direction"
            size="sm"
            value={dir}
            onChange={setDir}
            options={[
              { value: 'ltr', label: 'LTR' },
              { value: 'rtl', label: 'RTL' },
            ]}
          />
          <Segmented<string>
            label="Device"
            size="sm"
            value={device}
            onChange={(value) => setWidth(Number(value))}
            options={DEVICES.map(({ value, label }) => ({ value, label }))}
          />
          <Field label="Width">
            <Range label="Frame width" value={width} min={320} max={1100} step={5} onChange={setWidth} format={(value) => `${value}px`} />
          </Field>
        </>
      }
    >
      <div className="pg-device-stage">
        <div className="pg-device" style={{ width }}>
          <div className="pg-device-bar" aria-hidden="true">
            <i />
            <span>{width}px</span>
          </div>
          <div className="pg-device-screen">
            <SmartDataGrid<User>
              data={users}
              columns={layout === 'priority' ? priorityColumns : userColumns}
              getRowId="id"
              responsive={layout}
              dir={dir}
              darkMode={mode}
              theme="modern"
              searchable
              filterable
              selectable
              expandable
              stickyHeader
              pagination={{ pageSize: 6, variant: 'compact', showPageSizeSelector: false }}
              toolbar={{ search: true, filter: true, columns: true }}
              height={540}
              renderExpanded={({ row }) => (
                <div>
                  <strong>{row.name}</strong> — {row.profile.city}, {row.country}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </Demo>
  );
}
