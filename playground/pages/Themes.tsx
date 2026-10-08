import * as React from 'react';
import { SmartDataGrid, themePresetNames, type Density, type ThemePreset } from 'react-smart-table-grid';
import { compactUserColumns } from '../columns';
import { makeUsers } from '../data';
import { useGridMode } from '../theme';
import { Chip, Icon, Segmented, useCopy } from '../ui';

const users = makeUsers(5);
const columns = compactUserColumns.slice(0, 4);

function ThemeCard({ preset, density }: { preset: string; density: Density }): React.JSX.Element {
  const mode = useGridMode();
  const [copied, copy] = useCopy();

  return (
    <article className="pg-card pg-theme-card">
      <header className="pg-theme-card-head">
        <b>{preset}</b>
        <button
          type="button"
          className="pg-copy pg-copy--ghost"
          onClick={() => copy(`theme="${preset}"`)}
          title={`Copy theme="${preset}"`}
        >
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {copied ? 'Copied' : `theme="${preset}"`}
        </button>
      </header>
      <div className="pg-canvas pg-canvas--tight">
        <SmartDataGrid
          data={users}
          columns={columns}
          getRowId="id"
          theme={preset as ThemePreset}
          density={density}
          darkMode={mode}
        />
      </div>
    </article>
  );
}

export function Themes(): React.JSX.Element {
  const [density, setDensity] = React.useState<Density>('comfortable');
  const [query, setQuery] = React.useState('');
  const shown = themePresetNames.filter((name) => name.includes(query.trim().toLowerCase()));

  return (
    <>
      <div className="pg-filterbar">
        <label className="pg-search-field">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter themes…"
            aria-label="Filter themes"
          />
        </label>
        <Segmented<Density>
          label="Density"
          size="sm"
          value={density}
          onChange={setDensity}
          options={[
            { value: 'dense', label: 'Dense' },
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
        <span className="pg-spacer" />
        <Chip>
          {shown.length} of {themePresetNames.length} presets
        </Chip>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">No theme is called “{query}”.</p>
      ) : (
        <div className="pg-theme-grid">
          {shown.map((preset) => (
            <ThemeCard key={preset} preset={preset} density={density} />
          ))}
        </div>
      )}
    </>
  );
}
