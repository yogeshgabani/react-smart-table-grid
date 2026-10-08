import * as React from 'react';
import { SmartDataGrid, gridPresetNames, type GridPresetName } from 'react-smart-table-grid';
import { analyticsColumns, orderColumns, userColumns } from '../columns';
import { makeOrders, makeUsers, type Order, type User } from '../data';
import { useGridMode } from '../theme';
import { Demo, Icon, cx, type IconName } from '../ui';

const users = makeUsers(120);
const orders = makeOrders(90);

const PRESETS: Record<GridPresetName, { text: string; icon: IconName }> = {
  admin: { text: 'Modern theme, multi-select, full toolbar, 25 rows per page.', icon: 'shield' },
  crm: { text: 'Purple theme, hover row actions, highlighted search, reorderable columns.', icon: 'activity' },
  hrms: { text: 'Teal theme, roomy rows, PDF export.', icon: 'home' },
  erp: { text: 'Bordered compact grid, multi-sort, virtualized, 50 rows per page.', icon: 'package' },
  analytics: { text: 'Dark header, numbered pagination, footer aggregates.', icon: 'gauge' },
  saas: { text: 'Neutral monochrome, simple pagination, 10 rows per page.', icon: 'layers' },
  enterprise: { text: 'Everything on: virtualization, all exports, settings panel.', icon: 'server' },
  minimal: { text: 'No toolbar, no borders — just the data.', icon: 'table' },
  dashboard: { text: 'Small and dense: 8 rows, search and refresh only.', icon: 'grid' },
  ecommerce: { text: 'Card layout with large page sizes, for product and order lists.', icon: 'download' },
};

export function Presets(): React.JSX.Element {
  const mode = useGridMode();
  const [preset, setPreset] = React.useState<GridPresetName>('admin');

  const isOrders = preset === 'ecommerce' || preset === 'erp';
  const isAnalytics = preset === 'analytics' || preset === 'dashboard';
  const dataName = isOrders ? 'orders' : isAnalytics ? 'accounts' : 'users';

  return (
    <>
      <div className="pg-preset-grid" role="radiogroup" aria-label="Application preset">
        {gridPresetNames.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={preset === name}
            className={cx('pg-preset', preset === name && 'pg-preset--active')}
            onClick={() => setPreset(name)}
          >
            <span className="pg-preset-icon">
              <Icon name={PRESETS[name].icon} size={16} />
            </span>
            <b>{name}</b>
            <small>{PRESETS[name].text}</small>
          </button>
        ))}
      </div>

      <Demo
        icon="grid"
        title={`preset="${preset}"`}
        description={PRESETS[preset].text}
        code={`<SmartDataGrid data={${dataName}} columns={columns} preset="${preset}" />`}
      >
        {isOrders ? (
          <SmartDataGrid<Order>
            key={`orders-${preset}`}
            data={orders}
            columns={orderColumns}
            getRowId="id"
            preset={preset}
            darkMode={mode}
            height={540}
          />
        ) : isAnalytics ? (
          <SmartDataGrid<User>
            key={`analytics-${preset}`}
            data={users}
            columns={analyticsColumns}
            getRowId="id"
            preset={preset}
            darkMode={mode}
            showFooter
            height={540}
          />
        ) : (
          <SmartDataGrid<User>
            key={`users-${preset}`}
            data={users}
            columns={userColumns}
            getRowId="id"
            preset={preset}
            darkMode={mode}
            height={540}
          />
        )}
      </Demo>
    </>
  );
}
