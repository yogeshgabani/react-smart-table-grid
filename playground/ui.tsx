import * as React from 'react';

/* Shared building blocks for the playground chrome. The grid styles itself;
   everything here is the frame around it. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ *
 * Icons — 24px stroke icons, drawn inline so the playground ships no
 * icon dependency.
 * ------------------------------------------------------------------ */

const ICONS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" />,
  layers: (
    <>
      <path d="m12 2 10 5-10 5L2 7z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  palette: (
    <>
      <circle cx="13.5" cy="6.5" r="1.2" />
      <circle cx="17.5" cy="10.5" r="1.2" />
      <circle cx="8.5" cy="7.5" r="1.2" />
      <circle cx="6.5" cy="12.5" r="1.2" />
      <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.7 5.7 0 0 0 22 9.7C22 5.4 17.5 2 12 2z" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5" />
      <path d="m3 21 9-9" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  server: (
    <>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 7h.01M6 17h.01" />
    </>
  ),
  tree: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1.2" />
      <rect x="15" y="15" width="6" height="6" rx="1.2" />
      <rect x="15" y="3" width="6" height="6" rx="1.2" />
      <path d="M9 6h6M6 9v3a3 3 0 0 0 3 3h6" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  gauge: (
    <>
      <path d="m12 14 4-4" />
      <path d="M3.3 19a10 10 0 1 1 17.4 0" />
    </>
  ),
  code: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  terminal: (
    <>
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  package: (
    <>
      <path d="m7.5 4.3 9 5.2" />
      <path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9h18M3 15h18M9 9v12" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </>
  ),
  cursor: <path d="m4 4 7 17 2.5-7.5L21 11z" />,
  keyboard: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M7 16h10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  arrowUpRight: <path d="M7 17 17 7M7 7h10v10" />,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  // Brand marks, simplified to the same stroke style as the rest of the set.
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  youtube: (
    <>
      <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  xLogo: (
    <>
      <path d="M4 4l11.7 16H20L8.3 4z" />
      <path d="M4 20l6.8-6.8M13.2 10.8 20 4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}): React.JSX.Element {
  return (
    <svg
      className={cx('pg-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Clipboard
 * ------------------------------------------------------------------ */

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Non-secure origins (a LAN IP) have no async clipboard.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
}

/** `[copied, copy]` — `copied` flips back after a moment. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number>();

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = React.useCallback((text: string) => {
    void writeClipboard(text).then(() => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    });
  }, []);

  return [copied, copy];
}

/* ------------------------------------------------------------------ *
 * Code
 * ------------------------------------------------------------------ */

// One pass, first group wins. Good enough for short TSX / CSS snippets
// without shipping a highlighter.
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|` + '`(?:\\\\.|[^`\\\\])*`)',
    String.raw`(?<tag><\/?[A-Za-z][\w.-]*(?=[\s>/])|(?<![=-])\/?>)`,
    String.raw`(?<keyword>\b(?:import|from|export|default|const|let|return|function|async|await|new|type|interface|extends|if|else|true|false|null|undefined)\b)`,
    String.raw`(?<prop>--[\w-]+|\b[A-Za-z_$][\w$]*(?==)|\b[A-Za-z_$][\w$]*(?=\??:\s))`,
    String.raw`(?<number>#[0-9A-Fa-f]{3,8}\b|\b\d[\d_.]*(?:px|ms|%)?)`,
    String.raw`(?<fn>\b[A-Za-z_$][\w$]*(?=\())`,
  ].join('|'),
  'g',
);

function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(code.slice(last, index));
    const kind = Object.entries(match.groups ?? {}).find(([, value]) => value !== undefined)?.[0];
    out.push(
      <span key={index} className={`tok-${kind}`}>
        {match[0]}
      </span>,
    );
    last = index + match[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({
  code,
  title,
  language = 'tsx',
  className,
}: {
  code: string;
  title?: string;
  language?: 'tsx' | 'css' | 'bash';
  className?: string;
}): React.JSX.Element {
  const [copied, copy] = useCopy();
  const tokens = React.useMemo(() => (language === 'bash' ? null : highlight(code)), [code, language]);

  return (
    <div className={cx('pg-codeblock', className)}>
      <div className="pg-codeblock-bar">
        <span className="pg-codeblock-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="pg-codeblock-title">{title ?? language}</span>
        <button type="button" className="pg-copy" onClick={() => copy(code)} aria-live="polite">
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="pg-code">
        <code>
          {language === 'bash'
            ? code.split('\n').map((line, index) => (
                <span key={index} className="pg-bash-line">
                  <span className="tok-prompt" aria-hidden="true">
                    ${' '}
                  </span>
                  {line}
                  {'\n'}
                </span>
              ))
            : tokens}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export function Section({
  title,
  description,
  actions,
  children,
  className,
  icon,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: IconName;
}): React.JSX.Element {
  return (
    <section className={cx('pg-card', className)}>
      {(title || actions) && (
        <header className="pg-card-head">
          <div className="pg-card-heading">
            {icon && (
              <span className="pg-card-icon">
                <Icon name={icon} size={16} />
              </span>
            )}
            <div>
              {title && <h2 className="pg-card-title">{title}</h2>}
              {description && <p className="pg-card-desc">{description}</p>}
            </div>
          </div>
          {actions && <div className="pg-card-actions">{actions}</div>}
        </header>
      )}
      <div className="pg-card-body">{children}</div>
    </section>
  );
}

/**
 * A live example with a Preview / Code switch. The preview stays mounted while
 * the code is shown, so the grid keeps its sort, page and selection.
 */
export function Demo({
  title,
  description,
  code,
  codeTitle,
  language,
  actions,
  toolbar,
  children,
  icon,
  plain,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  code?: string;
  codeTitle?: string;
  language?: 'tsx' | 'css' | 'bash';
  actions?: React.ReactNode;
  /** Controls rendered in a strip above the preview. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  icon?: IconName;
  /** Drop the dotted canvas behind the preview. */
  plain?: boolean;
}): React.JSX.Element {
  const [tab, setTab] = React.useState<'preview' | 'code'>('preview');

  return (
    <section className="pg-card pg-demo">
      <header className="pg-card-head">
        <div className="pg-card-heading">
          {icon && (
            <span className="pg-card-icon">
              <Icon name={icon} size={16} />
            </span>
          )}
          <div>
            <h2 className="pg-card-title">{title}</h2>
            {description && <p className="pg-card-desc">{description}</p>}
          </div>
        </div>
        <div className="pg-card-actions">
          {actions}
          {code && (
            <Segmented
              label="View"
              size="sm"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'preview', label: 'Preview', icon: 'eye' },
                { value: 'code', label: 'Code', icon: 'code' },
              ]}
            />
          )}
        </div>
      </header>
      {toolbar && tab === 'preview' && <div className="pg-demo-toolbar">{toolbar}</div>}
      <div className={cx('pg-canvas', plain && 'pg-canvas--plain')} hidden={tab !== 'preview'}>
        {children}
      </div>
      {code && tab === 'code' && (
        <div className="pg-demo-code">
          <CodeBlock code={code} title={codeTitle} language={language} />
        </div>
      )}
    </section>
  );
}

/** A collapsible group of controls in a side panel. */
export function PanelSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}): React.JSX.Element {
  return (
    <details className="pg-panel-section" open={defaultOpen}>
      <summary>
        {title}
        <Icon name="chevronDown" size={14} className="pg-panel-chevron" />
      </summary>
      <div className="pg-panel-body">{children}</div>
    </details>
  );
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

export interface SegmentedOption<V extends string> {
  value: V;
  label?: string;
  icon?: IconName;
  title?: string;
}

export function Segmented<V extends string>({
  value,
  onChange,
  options,
  label,
  size,
  stretch,
}: {
  value: V;
  onChange: (value: V) => void;
  options: Array<SegmentedOption<V>>;
  label: string;
  size?: 'sm';
  stretch?: boolean;
}): React.JSX.Element {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  // Arrow keys move the choice, like native radios.
  const onKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  // With nothing checked (a custom value), the first option keeps the group tabbable.
  const hasChecked = options.some((option) => option.value === value);

  return (
    <div
      className={cx('pg-segmented', size && `pg-segmented--${size}`, stretch && 'pg-segmented--stretch')}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const tabbable = checked || (!hasChecked && index === 0);
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label ? undefined : (option.title ?? option.value)}
            tabIndex={tabbable ? 0 : -1}
            title={option.title}
            className="pg-segmented-item"
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.icon && <Icon name={option.icon} size={14} />}
            {option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="pg-switch-row">
      <span className="pg-switch-text">
        <span className="pg-switch-label">{label}</span>
        {description && <span className="pg-switch-desc">{description}</span>}
      </span>
      <span className="pg-switch">
        <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="pg-switch-track" aria-hidden="true">
          <span className="pg-switch-thumb" />
        </span>
      </span>
    </label>
  );
}

export function Field({
  label,
  hint,
  children,
  stacked,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  stacked?: boolean;
}): React.JSX.Element {
  return (
    <div className={cx('pg-field', stacked && 'pg-field--stacked')}>
      <span className="pg-field-label">
        {label}
        {hint && <span className="pg-field-hint">{hint}</span>}
      </span>
      <span className="pg-field-control">{children}</span>
    </div>
  );
}

export function Select<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V;
  onChange: (value: V) => void;
  options: ReadonlyArray<V | { value: V; label: string }>;
  label: string;
}): React.JSX.Element {
  return (
    <span className="pg-select-wrap">
      <select className="pg-select" value={value} aria-label={label} onChange={(event) => onChange(event.target.value as V)}>
        {options.map((option) => {
          const entry = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          );
        })}
      </select>
      <Icon name="chevronDown" size={14} className="pg-select-chevron" />
    </span>
  );
}

export function Range({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format = String,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (value: number) => string;
}): React.JSX.Element {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <span className="pg-range-wrap">
      <input
        className="pg-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ '--pg-range-fill': `${percent}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="pg-range-value">{format(value)}</output>
    </span>
  );
}

export function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}): React.JSX.Element {
  const isHex = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <span className="pg-color">
      <span className="pg-color-swatch" style={{ background: value }}>
        <input
          type="color"
          value={isHex ? value : '#000000'}
          aria-label={`${label} colour picker`}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <input
        className="pg-input pg-input--mono"
        value={value}
        aria-label={label}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

export function Button({
  children,
  variant = 'default',
  size,
  icon,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm';
  icon?: IconName;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={cx('pg-btn', `pg-btn--${variant}`, size && `pg-btn--${size}`, className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = 'default',
  icon,
  trailingIcon,
  size = 'lg',
  external,
}: {
  children: React.ReactNode;
  href: string;
  variant?: 'default' | 'primary' | 'ghost';
  icon?: IconName;
  trailingIcon?: IconName;
  size?: 'sm' | 'md' | 'lg';
  /** Opens in a new tab, without handing the new page a reference back. */
  external?: boolean;
}): React.JSX.Element {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <a
      className={cx('pg-btn', `pg-btn--${variant}`, size !== 'md' && `pg-btn--${size}`)}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={iconSize} />}
    </a>
  );
}

/* ------------------------------------------------------------------ *
 * Display
 * ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  icon,
  tone = 'accent',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon: IconName;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}): React.JSX.Element {
  return (
    <div className="pg-stat">
      <span className="pg-stat-icon" data-tone={tone}>
        <Icon name={icon} size={18} />
      </span>
      <span className="pg-stat-body">
        <span className="pg-stat-value">{value}</span>
        <span className="pg-stat-label">{label}</span>
      </span>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="pg-stats">{children}</div>;
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'success';
  title?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="pg-callout" data-tone={tone}>
      <Icon name={tone === 'warning' ? 'alert' : tone === 'success' ? 'check' : 'info'} size={18} />
      <div>
        {title && <strong className="pg-callout-title">{title}</strong>}
        <div className="pg-callout-body">{children}</div>
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <kbd className="pg-kbd">{children}</kbd>;
}

export function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
}): React.JSX.Element {
  return (
    <span className="pg-chip" data-tone={tone}>
      {children}
    </span>
  );
}

/** "Ctrl" on Windows/Linux, "⌘" on Apple platforms. */
export const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/* ------------------------------------------------------------------ *
 * Event log — shows the grid's callbacks firing in real time.
 * ------------------------------------------------------------------ */

export interface LogEntry {
  id: number;
  time: string;
  name: string;
  detail: string;
}

export function useEventLog(limit = 50): {
  entries: LogEntry[];
  log: (name: string, detail?: string) => void;
  clear: () => void;
} {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const counter = React.useRef(0);

  const log = React.useCallback(
    (name: string, detail = '') => {
      counter.current += 1;
      const entry: LogEntry = {
        id: counter.current,
        time: new Date().toLocaleTimeString([], { hour12: false }),
        name,
        detail,
      };
      setEntries((previous) => [entry, ...previous].slice(0, limit));
    },
    [limit],
  );

  const clear = React.useCallback(() => setEntries([]), []);
  return { entries, log, clear };
}

export function EventLog({
  entries,
  onClear,
  empty = 'Interact with the grid — every callback shows up here.',
  title = 'Event log',
}: {
  entries: LogEntry[];
  onClear: () => void;
  empty?: React.ReactNode;
  title?: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="pg-card pg-log">
      <header className="pg-log-head">
        <span className="pg-live-dot" aria-hidden="true" />
        <h2 className="pg-log-title">{title}</h2>
        <Chip>{entries.length}</Chip>
        <span className="pg-spacer" />
        <Button size="sm" variant="ghost" icon="trash" onClick={onClear} disabled={entries.length === 0}>
          Clear
        </Button>
      </header>
      <ol className="pg-log-list" role="log" aria-live="polite">
        {entries.length === 0 ? (
          <li className="pg-log-empty">{empty}</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="pg-log-item">
              <time className="pg-log-time">{entry.time}</time>
              <code className="pg-log-name">{entry.name}</code>
              <span className="pg-log-detail">{entry.detail}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

/** Short, readable summaries of callback payloads for the log. */
export function describe(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const parts = value.slice(0, 3).map((entry) => describe(entry));
    return `[${parts.join(', ')}${value.length > 3 ? `, +${value.length - 3}` : ''}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('id' in record && 'direction' in record) return `${String(record.id)} ${String(record.direction)}`;
    if ('pageIndex' in record) return `page ${Number(record.pageIndex) + 1} · ${String(record.pageSize)}/page`;
    if ('name' in record) return String(record.name);
    return JSON.stringify(value).slice(0, 80);
  }
  return String(value);
}
