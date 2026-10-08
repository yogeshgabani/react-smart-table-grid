import * as React from 'react';
import { SmartDataGrid } from 'react-smart-table-grid';
import { compactUserColumns } from '../columns';
import { getBenchmarkRows, type User } from '../data';
import { useGridMode } from '../theme';
import { Callout, Demo, Segmented, Stat, StatGrid, Switch } from '../ui';

const SIZES = [1_000, 10_000, 100_000, 500_000, 1_000_000];

const label = (count: number): string =>
  count >= 1_000_000 ? `${count / 1_000_000}M` : `${count / 1_000}K`;

interface Metrics {
  generateMs: number;
  renderMs: number;
  rows: number;
  memoryMb: number | null;
}

/** Rolling FPS meter — the number that actually tells you if scrolling is smooth. */
function useFps(): number {
  const [fps, setFps] = React.useState(60);

  React.useEffect(() => {
    let frame = 0;
    let frames = 0;
    let last = performance.now();

    const tick = (): void => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return fps;
}

export function Benchmark(): React.JSX.Element {
  const mode = useGridMode();
  const [size, setSize] = React.useState(1_000);
  const [rows, setRows] = React.useState<User[]>(() => getBenchmarkRows(1_000));
  const [metrics, setMetrics] = React.useState<Metrics>({ generateMs: 0, renderMs: 0, rows: 1_000, memoryMb: null });
  const [virtualized, setVirtualized] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const renderStart = React.useRef(0);

  const fps = useFps();

  const load = (count: number): void => {
    setBusy(true);
    setSize(count);
    // Yield a frame so the "busy" state paints before the main-thread work.
    requestAnimationFrame(() => {
      const generateStart = performance.now();
      const next = getBenchmarkRows(count);
      const generateMs = performance.now() - generateStart;

      renderStart.current = performance.now();
      setRows(next);
      setMetrics((previous) => ({ ...previous, generateMs, rows: count }));
      setBusy(false);
    });
  };

  React.useLayoutEffect(() => {
    if (!renderStart.current) return;
    const renderMs = performance.now() - renderStart.current;
    renderStart.current = 0;

    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    setMetrics((previous) => ({
      ...previous,
      renderMs,
      memoryMb: memory ? Math.round(memory.usedJSHeapSize / 1_048_576) : null,
    }));
  }, [rows]);

  const domRows = virtualized ? Math.min(rows.length, Math.ceil(560 / 40) + 20) : rows.length;
  const fpsTone = fps >= 50 ? 'success' : fps >= 30 ? 'warning' : 'danger';
  const risky = !virtualized && rows.length >= 100_000;

  return (
    <>
      <StatGrid>
        <Stat icon="table" value={metrics.rows.toLocaleString()} label="rows loaded" />
        <Stat icon="zap" tone="neutral" value={`${metrics.generateMs.toFixed(0)} ms`} label="data generation" />
        <Stat icon="activity" tone="warning" value={`${metrics.renderMs.toFixed(0)} ms`} label="render commit" />
        <Stat icon="gauge" tone={fpsTone} value={fps} label="fps, live" />
        <Stat icon="layers" tone="neutral" value={virtualized ? `~${domRows}` : domRows.toLocaleString()} label="rows in the DOM" />
        <Stat icon="server" tone="neutral" value={metrics.memoryMb == null ? 'n/a' : `${metrics.memoryMb} MB`} label="JS heap (Chromium)" />
      </StatGrid>

      <Demo
        icon="gauge"
        title={`${label(size)} rows${busy ? ' — generating…' : ''}`}
        description="Scroll fast and watch the FPS tile. Sorting and search run over every row, not just the visible window."
        code={`<SmartDataGrid
  data={rows}
  columns={columns}
  getRowId="id"
  virtualized={{ threshold: 50, overscan: 10 }}
  pagination={false}
  height={560}
/>`}
        toolbar={
          <>
            <Segmented<string>
              label="Row count"
              size="sm"
              value={String(size)}
              onChange={(value) => !busy && load(Number(value))}
              options={SIZES.map((count) => ({ value: String(count), label: label(count) }))}
            />
            <Switch label="Virtualized" checked={virtualized} onChange={setVirtualized} />
          </>
        }
      >
        <SmartDataGrid<User>
          data={rows}
          columns={compactUserColumns}
          getRowId="id"
          darkMode={mode}
          virtualized={virtualized ? { threshold: 50, overscan: 10 } : false}
          sortable
          searchable
          selectable
          resizable
          stickyHeader
          density="compact"
          pagination={false}
          height={560}
          toolbar={{ search: true, columns: true, density: true }}
        />
      </Demo>

      <Callout tone={risky ? 'warning' : 'info'} title={risky ? 'Virtualization is off' : 'Try turning virtualization off'}>
        {risky
          ? 'The browser is laying out every one of these rows — expect the tab to stall while it does.'
          : 'At 100K rows and above, the difference is the browser laying out ~35 rows versus all of them. Be ready to wait.'}
      </Callout>
    </>
  );
}
