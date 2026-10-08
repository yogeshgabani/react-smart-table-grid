import pkg from '../package.json';
import type { IconName } from './ui';

/**
 * A social link from `.env`, or '' when it's missing or not a full http(s) URL —
 * the footer then shows a "Coming soon" dialog for it instead of a link.
 */
function socialUrl(name: string, value: string | undefined): string {
  const url = value?.trim() ?? '';
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
  } catch {
    /* fall through to the warning */
  }
  if (import.meta.env.DEV) console.warn(`[playground] ${name}="${url}" is not an http(s) URL — showing "Coming soon".`);
  return '';
}

const env = import.meta.env;

export interface SocialLink {
  id: string;
  icon: IconName;
  label: string;
  /** '' = not set yet → "Coming soon". */
  href: string;
}

/** Everything the footer and stats show, in one place. Social links come from `.env`. */
export const SITE = {
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  tagline: 'Enterprise-grade, themeable React data grid with one-stop UI customization.',
  npmUrl: `https://www.npmjs.com/package/${pkg.name}`,
  /** Empty hides the footer's GitHub button. */
  repoUrl: 'https://github.com/yogeshgabani/react-smart-table-grid',
  author: {
    name: 'Yogesh Gabani',
    firstName: 'Yogesh',
    url: 'https://github.com/yogeshgabani',
  },
  // Only `VITE_*` variables reach the browser; they're fixed at build time.
  socials: [
    { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', href: socialUrl('VITE_SOCIAL_WHATSAPP', env.VITE_SOCIAL_WHATSAPP) },
    { id: 'instagram', icon: 'instagram', label: 'Instagram', href: socialUrl('VITE_SOCIAL_INSTAGRAM', env.VITE_SOCIAL_INSTAGRAM) },
    { id: 'facebook', icon: 'facebook', label: 'Facebook', href: socialUrl('VITE_SOCIAL_FACEBOOK', env.VITE_SOCIAL_FACEBOOK) },
    { id: 'youtube', icon: 'youtube', label: 'YouTube', href: socialUrl('VITE_SOCIAL_YOUTUBE', env.VITE_SOCIAL_YOUTUBE) },
    { id: 'x', icon: 'xLogo', label: 'X (Twitter)', href: socialUrl('VITE_SOCIAL_X', env.VITE_SOCIAL_X) },
    { id: 'linkedin', icon: 'linkedin', label: 'LinkedIn', href: socialUrl('VITE_SOCIAL_LINKEDIN', env.VITE_SOCIAL_LINKEDIN) },
    { id: 'github', icon: 'github', label: 'GitHub', href: socialUrl('VITE_SOCIAL_GITHUB', env.VITE_SOCIAL_GITHUB) },
  ] satisfies SocialLink[],
  /** Abacus counter namespace — must be unique to this site. */
  counterNamespace: pkg.name,
};
