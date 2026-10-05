/**
 * Only http(s) URLs are ever rendered as links. Source and license URLs are editor input
 * stored in the database, and a `javascript:` href is exactly what a careless paste produces.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

const CREATIVE_COMMONS_LICENSE = /^\/licenses\/([a-z-]+)\/(\d+(?:\.\d+)?)(?:\/.*)?$/i;
const CREATIVE_COMMONS_PUBLIC_DOMAIN = /^\/publicdomain\/(zero|mark)\/(\d+(?:\.\d+)?)(?:\/.*)?$/i;

/**
 * The name a reader knows a license by, read off its URL: `…/licenses/by-sa/2.0/` is
 * "CC BY-SA 2.0", `…/publicdomain/zero/1.0/` is "CC0 1.0".
 *
 * Derived rather than stored. The URL is already recorded for attribution, a stored name could
 * disagree with it, and the name is an identifier, not translatable copy. Returns null for any
 * URL that is not a Creative Commons page, so the caller shows the URL's host or nothing
 * rather than a wrong name.
 */
export function licenseLabelFromUrl(url: string | null | undefined): string | null {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  const { hostname, pathname } = new URL(safe);
  if (hostname !== 'creativecommons.org' && !hostname.endsWith('.creativecommons.org')) return null;

  const license = CREATIVE_COMMONS_LICENSE.exec(pathname);
  if (license) return `CC ${license[1].toUpperCase()} ${license[2]}`;

  const publicDomain = CREATIVE_COMMONS_PUBLIC_DOMAIN.exec(pathname);
  if (publicDomain) {
    return publicDomain[1].toLowerCase() === 'zero'
      ? `CC0 ${publicDomain[2]}`
      : `Public Domain Mark ${publicDomain[2]}`;
  }
  return null;
}
