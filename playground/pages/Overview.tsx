import * as React from 'react';
import { SmartDataGrid, builtInCellTypes, gridPresetNames, themePresetNames } from 'react-smart-table-grid';
import { compactUserColumns } from '../columns';
import { makeUsers } from '../data';
import { ReleaseNotes } from '../changelog';
import { useGridMode } from '../theme';
import { ButtonLink, CodeBlock, Demo, Icon, Stat, StatGrid, type IconName } from '../ui';

const users = makeUsers(40);

const QUICK_START = `import { SmartDataGrid } from 'react-smart-table-grid';

const columns = [
  { accessorKey: 'name',       header: 'Name',   type: 'avatar' },
  { accessorKey: 'email',      header: 'Email',  type: 'email' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'status',     header: 'Status', type: 'status' },
  { accessorKey: 'salary',     header: 'Salary', type: 'currency' },
];

export function Team({ users }) {
  return <SmartDataGrid data={users} columns={columns} />;
}`;

const FLAGS = `<SmartDataGrid
  data={users}
  columns={columns}
  getRowId="id"
  searchable
  filterable
  selectable
  resizable
  reorderable
  highlightSearch
  exportable
  pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 32] }}
  height={480}
/>`;

const EXPLORE: Array<{ href: string; icon: IconName; title: string; text: string }> = [
  { href: '#playground', icon: 'play', title: 'Live playground', text: 'Toggle every prop and copy the generated JSX.' },
  { href: '#showcase', icon: 'layers', title: 'Full showcase', text: 'Search, filters, grouping, actions and export together.' },
  { href: '#ui', icon: 'sliders', title: 'One-stop UI', text: 'Restyle everything through a single `ui` object.' },
  { href: '#builder', icon: 'wand', title: 'Theme builder', text: 'Design a theme visually and export the code.' },
  { href: '#server', icon: 'server', title: 'Server-side data', text: 'Providers with abort, de-dupe and error states.' },
  { href: '#benchmark', icon: 'gauge', title: 'Benchmark', text: 'Scroll a million virtualized rows at 60 fps.' },
];

export function Overview(): React.JSX.Element {
  const mode = useGridMode();

  return (
    <>
      <section className="pg-intro">
        <div className="pg-intro-copy">
          <span className="pg-pill">
            <span className="pg-pill-dot" /> v0.1.0 · MIT · zero runtime dependencies
          </span>
          <h1 className="pg-display">
            One Smart Data Grid.
            <br />
            Any data. <span className="pg-gradient-text">Any UI.</span>
          </h1>
          <p className="pg-lede pg-lede--lg">
            An enterprise-grade React data grid — sorting, filtering, grouping, editing, virtualization and
            export — with one-stop theming that bends to any design system.
          </p>
          <div className="pg-cta">
            <ButtonLink href="#playground" variant="primary" icon="play" trailingIcon="arrowRight">
              Open live playground
            </ButtonLink>
            <ButtonLink href="#showcase" icon="layers">
              See everything at once
            </ButtonLink>
          </div>
        </div>
        <div className="pg-intro-install">
          <CodeBlock code="npm install react-smart-table-grid" language="bash" title="Install" />
          <CodeBlock
            code={`import { SmartDataGrid } from 'react-smart-table-grid';\n\n<SmartDataGrid data={rows} columns={columns} />`}
            title="App.tsx"
          />
        </div>
      </section>

      <StatGrid>
        <Stat icon="shield" tone="success" value="0" label="runtime dependencies" />
        <Stat icon="palette" value={themePresetNames.length} label="theme presets" />
        <Stat icon="grid" tone="warning" value={gridPresetNames.length} label="app presets" />
        <Stat icon="table" tone="neutral" value={builtInCellTypes.length} label="built-in cell types" />
        <Stat icon="gauge" tone="danger" value="1M" label="rows, virtualized" />
      </StatGrid>

      <Demo
        icon="zap"
        title="The 30-second grid"
        description="Two required props. Sorting is on by default; everything else is opt-in."
        code={QUICK_START}
        codeTitle="Team.tsx"
      >
        <SmartDataGrid data={users.slice(0, 6)} columns={compactUserColumns} darkMode={mode} />
      </Demo>

      <Demo
        icon="sliders"
        title="Add features with flags"
        description="Search, filters, selection, resizing, drag-to-reorder and export — no config objects needed to start."
        code={FLAGS}
      >
        <SmartDataGrid
          data={users}
          columns={compactUserColumns}
          getRowId="id"
          darkMode={mode}
          searchable
          sortable
          filterable
          selectable
          resizable
          reorderable
          stickyHeader
          highlightSearch
          exportable
          pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 32] }}
          height={480}
        />
      </Demo>

      <h2 className="pg-section-title">Explore</h2>
      <div className="pg-link-grid">
        {EXPLORE.map((entry) => (
          <a key={entry.href} className="pg-link-card" href={entry.href}>
            <span className="pg-link-card-icon">
              <Icon name={entry.icon} size={18} />
            </span>
            <span className="pg-link-card-text">
              <b>{entry.title}</b>
              <small>{entry.text}</small>
            </span>
            <Icon name="arrowRight" size={16} className="pg-link-card-arrow" />
          </a>
        ))}
      </div>

      <ReleaseNotes compact />
    </>
  );
}
