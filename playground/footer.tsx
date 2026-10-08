import * as React from 'react';
import { builtInCellTypes, themePresetNames } from 'react-smart-table-grid';
import { RELEASES } from './changelog';
import { SITE, type SocialLink } from './site';
import { useNpmStats, useVisitorStats } from './stats';
import { ButtonLink, Icon, type IconName } from './ui';

const number = (value: number | null | undefined): string => (value == null ? '—' : value.toLocaleString());

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({
  icon,
  label,
  value,
  hint,
  live,
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  live?: boolean;
}): React.JSX.Element {
  return (
    <div className={live ? 'pg-footstat pg-footstat--live' : 'pg-footstat'}>
      <span className="pg-footstat-icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="pg-footstat-body">
        <span className="pg-footstat-label">
          {label}
          {live && (
            <span className="pg-live-badge">
              <span className="pg-live-badge-dot" aria-hidden="true" />
              LIVE
            </span>
          )}
        </span>
        <span className="pg-footstat-value">{value}</span>
        <span className="pg-footstat-hint">{hint}</span>
      </span>
    </div>
  );
}

export function SiteFooter(): React.JSX.Element {
  const npm = useNpmStats(SITE.name);
  const visits = useVisitorStats(SITE.counterNamespace);
  const latestRelease = RELEASES.find((release) => release.version.toLowerCase() !== 'unreleased');
  const year = new Date().getFullYear();
  // Every icon always shows; one without a link in `.env` opens "Coming soon".
  const [comingSoon, setComingSoon] = React.useState<SocialLink | null>(null);

  const updated =
    npm.status === 'ok'
      ? { value: formatDate(npm.publishedAt), hint: `v${npm.version} on npm` }
      : { value: formatDate(latestRelease?.date), hint: `v${latestRelease?.version ?? SITE.version} · from CHANGELOG` };

  const downloads =
    npm.status === 'ok'
      ? {
          value: number(npm.total),
          hint: `${number(npm.lastWeek)} last 7 days · npm counts through ${formatDate(npm.through)}`,
        }
      : npm.status === 'loading'
        ? { value: '…', hint: 'Asking npm…' }
        : npm.status === 'unpublished'
          ? { value: '0', hint: 'Not on npm yet — counts start the day after publishing' }
          : { value: '—', hint: 'npm stats are unreachable right now' };

  const localHint = 'Not counted on localhost';

  return (
    <footer className="pg-site-footer">
      <div className="pg-footcard">
        <div className="pg-footcard-row pg-footcard-brand">
          <span className="pg-footcard-logo" aria-hidden="true">
            <Icon name="table" size={20} strokeWidth={2} />
          </span>
          <span className="pg-footcard-name">
            <b>{SITE.name}</b>
            <small>{SITE.tagline}</small>
          </span>
          <span className="pg-footcard-links">
            {SITE.repoUrl && (
              <ButtonLink href={SITE.repoUrl} icon="github" size="sm" external>
                GitHub
              </ButtonLink>
            )}
            <ButtonLink href={SITE.npmUrl} icon="package" size="sm" external>
              npm
            </ButtonLink>
            <ButtonLink href="#changelog" icon="history" size="sm">
              Changelog
            </ButtonLink>
            <ButtonLink href="#playground" icon="play" size="sm">
              Live playground
            </ButtonLink>
          </span>
        </div>

        <div className="pg-footcard-row pg-footcard-social">
          <p>
            <a className="pg-footcard-connect" href={SITE.author.url} target="_blank" rel="noopener noreferrer">
              Connect with {SITE.author.firstName}
            </a>
            <span className="pg-footcard-dash" aria-hidden="true">
              —
            </span>
            follow for updates &amp; new releases
          </p>
          <ul className="pg-socials" aria-label="Social profiles">
            {SITE.socials.map((social) => (
              <li key={social.id}>
                {social.href ? (
                  <a
                    className="pg-social"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <Icon name={social.icon} size={17} />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="pg-social pg-social--soon"
                    aria-haspopup="dialog"
                    aria-label={`${social.label} — coming soon`}
                    title={`${social.label} — coming soon`}
                    onClick={() => setComingSoon(social)}
                  >
                    <Icon name={social.icon} size={17} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="pg-footcard-row pg-footcard-legal">
          <div>
            <p className="pg-footcard-meta">
              <span className="pg-license">{SITE.license}</span>
              <span aria-hidden="true">·</span>© {year} {SITE.name}
              <span aria-hidden="true">·</span>
              <b>{builtInCellTypes.length}</b> cell types
              <span aria-hidden="true">·</span>
              <b>{themePresetNames.length}</b> themes
            </p>
            <p className="pg-footcard-crafted">
              Crafted with <Icon name="heart" size={13} className="pg-heart" /> for the React &amp; Next.js community
            </p>
          </div>
          <a className="pg-builtby" href={SITE.author.url} target="_blank" rel="noopener noreferrer">
            Built by <b>{SITE.author.name}</b>
            <Icon name="arrowUpRight" size={14} />
          </a>
        </div>
      </div>

      <div className="pg-footrule" aria-hidden="true" />

      <div className="pg-footstats">
        <StatCard icon="calendar" label="Last updated" value={updated.value} hint={updated.hint} />
        <StatCard icon="download" label="npm downloads" value={downloads.value} hint={downloads.hint} />
        <StatCard
          icon="eye"
          label="Total hits"
          value={number(visits.hits)}
          hint={visits.counting ? 'Page views, all time' : localHint}
        />
        <StatCard
          icon="users"
          label="Total visitors"
          value={number(visits.visitors)}
          hint={visits.counting ? 'Unique browsers · refreshes every minute' : localHint}
          live
        />
      </div>

      <ComingSoonDialog social={comingSoon} onClose={() => setComingSoon(null)} />
    </footer>
  );
}

/* ------------------------------------------------------------------ *
 * "Coming soon" for a social link not set in `.env`
 * ------------------------------------------------------------------ */

function ComingSoonDialog({ social, onClose }: { social: SocialLink | null; onClose: () => void }): React.JSX.Element {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const alternatives = SITE.socials.filter((entry) => entry.href);

  // A native modal <dialog>: the browser traps focus, makes the page inert and
  // closes it on Escape.
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!social) {
      if (dialog.open) dialog.close();
      return undefined;
    }

    triggerRef.current = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    confirmRef.current?.focus();
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = overflow;
      triggerRef.current?.focus();
    };
  }, [social]);

  return (
    <dialog
      ref={dialogRef}
      className="pg-dialog"
      aria-labelledby="pg-soon-title"
      aria-describedby="pg-soon-text"
      onClose={onClose}
      onClick={(event) => {
        // The body fills the dialog, so a click landing on the <dialog> itself is the backdrop.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      {social && (
        <div className="pg-dialog-body">
          <span className="pg-dialog-icon" aria-hidden="true">
            <Icon name={social.icon} size={28} />
          </span>
          <span className="pg-dialog-chip">
            <Icon name="history" size={12} />
            Coming soon
          </span>
          <h2 id="pg-soon-title" className="pg-dialog-title">
            {social.label} is on its way
          </h2>
          <p id="pg-soon-text" className="pg-dialog-text">
            {SITE.author.firstName}&apos;s {social.label} isn&apos;t live yet.{' '}
            {alternatives.length > 0 ? 'Until then, follow along here:' : 'Check back soon.'}
          </p>

          {alternatives.length > 0 && (
            <ul className="pg-socials pg-dialog-socials" aria-label="Available profiles">
              {alternatives.map((entry) => (
                <li key={entry.id}>
                  <a
                    className="pg-social"
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={entry.label}
                    title={entry.label}
                  >
                    <Icon name={entry.icon} size={17} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <form method="dialog" className="pg-dialog-actions">
            <button ref={confirmRef} className="pg-btn pg-btn--primary">
              Got it
            </button>
          </form>
        </div>
      )}
    </dialog>
  );
}
