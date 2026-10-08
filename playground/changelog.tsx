import * as React from 'react';
import changelogMarkdown from '../CHANGELOG.md?raw';
import { ButtonLink, Chip, Icon, cx, type IconName } from './ui';

/* The playground's changelog is CHANGELOG.md itself — add a `## [x.y.z] — date`
   section there and it appears here, no second copy to keep in sync. */

export interface ReleaseGroup {
  title?: string;
  items: string[];
}

export interface ReleaseSection {
  title: string;
  groups: ReleaseGroup[];
}

export interface Release {
  version: string;
  date?: string;
  summary: string[];
  sections: ReleaseSection[];
}

/** Parse Keep a Changelog markdown: `## [version] — date`, `### Section`, `**Group**`, `- item`. */
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | null = null;
  let section: ReleaseSection | null = null;
  let group: ReleaseGroup | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    const heading = /^##\s+\[([^\]]+)\](?:\s*[—–-]\s*(.+))?$/.exec(line);
    if (heading) {
      release = { version: heading[1], date: heading[2]?.trim(), summary: [], sections: [] };
      releases.push(release);
      section = null;
      group = null;
      continue;
    }
    if (!release || !line) continue;

    const sub = /^###\s+(.+)$/.exec(line);
    if (sub) {
      section = { title: sub[1], groups: [] };
      release.sections.push(section);
      group = null;
      continue;
    }

    const bold = /^\*\*(.+)\*\*$/.exec(line);
    if (bold && section) {
      group = { title: bold[1], items: [] };
      section.groups.push(group);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet && section) {
      if (!group) {
        group = { items: [] };
        section.groups.push(group);
      }
      group.items.push(bullet[1]);
      continue;
    }

    // A wrapped bullet continues on an indented line.
    if (/^\s+/.test(rawLine) && group?.items.length) {
      group.items[group.items.length - 1] += ` ${line}`;
    } else if (!section) {
      release.summary.push(line);
    }
  }

  // An empty [Unreleased] heading is just a placeholder.
  return releases.filter((entry) => entry.sections.length > 0 || entry.summary.length > 0);
}

export const RELEASES = parseChangelog(changelogMarkdown);

/** `**bold**`, `` `code` `` and `[text](url)` — all CHANGELOG.md uses. */
function Inline({ text }: { text: string }): React.JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        // Bold can wrap code (`**\`name\`**`), so render its inside too.
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index}>
              <Inline text={part.slice(2, -2)} />
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          return (
            <a key={index} href={link[2]}>
              {link[1]}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

const SECTION_STYLE: Record<string, { icon: IconName; tone: string }> = {
  added: { icon: 'zap', tone: 'accent' },
  changed: { icon: 'reset', tone: 'warning' },
  fixed: { icon: 'check', tone: 'success' },
  security: { icon: 'shield', tone: 'danger' },
  removed: { icon: 'trash', tone: 'danger' },
  deprecated: { icon: 'alert', tone: 'warning' },
  'known limitations': { icon: 'info', tone: 'neutral' },
};

function formatDay(value: string | undefined): string | undefined {
  const match = value && /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ReleaseCard({ release, latest, initial }: { release: Release; latest: boolean; initial: boolean }): React.JSX.Element {
  const upcoming = release.version.toLowerCase() === 'unreleased';
  const count = release.sections.reduce(
    (sum, section) => sum + section.groups.reduce((inner, group) => inner + group.items.length, 0),
    0,
  );

  return (
    <article className={cx('pg-release', latest && 'pg-release--latest')}>
      <div className="pg-release-meta">
        <span className="pg-release-version">{upcoming ? 'Next' : `v${release.version}`}</span>
        {release.date && <time className="pg-release-date">{formatDay(release.date)}</time>}
        <span className="pg-release-badges">
          {upcoming && <Chip tone="warning">UPCOMING</Chip>}
          {latest && <Chip tone="success">LATEST</Chip>}
          {initial && <Chip tone="accent">INITIAL</Chip>}
        </span>
        <span className="pg-release-count">{count} changes</span>
      </div>

      <div className="pg-release-body">
        {release.summary.map((line, index) => (
          <p key={index} className="pg-release-summary">
            <Inline text={line} />
          </p>
        ))}

        {release.sections.map((section) => {
          const style = SECTION_STYLE[section.title.toLowerCase()] ?? { icon: 'info' as IconName, tone: 'neutral' };
          return (
            <section key={section.title} className="pg-release-section" data-tone={style.tone}>
              <h4 className="pg-release-section-title">
                <Icon name={style.icon} size={14} />
                {section.title}
              </h4>
              <div className="pg-release-groups">
                {section.groups.map((group, index) => (
                  <div key={group.title ?? index} className="pg-release-group">
                    {group.title && <h5>{group.title}</h5>}
                    <ul>
                      {group.items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          <Inline text={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

/** Every release, newest first. `compact` caps the height and scrolls. */
export function ReleaseNotes({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const firstReleased = RELEASES.findIndex((entry) => entry.version.toLowerCase() !== 'unreleased');

  return (
    <section className="pg-card pg-changelog">
      <header className="pg-card-head">
        <div className="pg-card-heading">
          <span className="pg-card-icon">
            <Icon name="history" size={16} />
          </span>
          <div>
            <h2 className="pg-card-title">Changelog</h2>
            <p className="pg-card-desc">
              Read straight from <code>CHANGELOG.md</code> — add a release there and it shows up here.
            </p>
          </div>
        </div>
        <div className="pg-card-actions">
          <Chip>
            {RELEASES.length} release{RELEASES.length === 1 ? '' : 's'}
          </Chip>
          {compact && (
            <ButtonLink href="#changelog" variant="ghost" trailingIcon="arrowRight" size="sm">
              Full changelog
            </ButtonLink>
          )}
        </div>
      </header>
      <div className={cx('pg-changelog-list', compact && 'pg-changelog-list--compact')}>
        {RELEASES.map((release, index) => (
          <ReleaseCard
            key={release.version}
            release={release}
            latest={index === firstReleased}
            initial={index === RELEASES.length - 1 && release.version.toLowerCase() !== 'unreleased'}
          />
        ))}
        {RELEASES.length === 0 && <p className="pg-empty">No releases in CHANGELOG.md yet.</p>}
      </div>
    </section>
  );
}
