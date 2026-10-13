import type { WordPressSite } from "@/components/integrations/types";

/** Trailing " ..." from legacy ~60-char title chops — not part of the real business name. */
function isLikelyTruncatedStoredName(name: string): boolean {
  return / \.\.\.$/.test(name.trim());
}

function resolveStoredSiteLabel(site: WordPressSite): string {
  const stored = site.name.trim();
  const nap = site.napInfo?.name?.trim() ?? "";

  if (isLikelyTruncatedStoredName(stored)) {
    return nap || stored.replace(/ \.\.\.$/, "").trim();
  }

  if (stored) return stored;
  return nap;
}

/**
 * Integrations / Properties canonical label. Uses stored `site.name` (and NAP only for legacy truncation).
 * Ignores `menuDisplayName`.
 */
export function wordpressSiteCanonicalName(site: WordPressSite): string {
  return resolveStoredSiteLabel(site);
}

/** Manager header site menu and chip. User override via pencil in the top bar. */
export function wordpressSiteMenuDisplayName(site: WordPressSite): string {
  const menuOverride = site.menuDisplayName?.trim();
  if (menuOverride) return menuOverride;
  return resolveStoredSiteLabel(site);
}

/**
 * Canonical property name (Properties dashboard, Drive folders, workflows).
 * @deprecated Prefer `wordpressSiteCanonicalName` or `wordpressSiteMenuDisplayName`.
 */
export function wordpressSiteDisplayName(site: WordPressSite): string {
  return wordpressSiteCanonicalName(site);
}
