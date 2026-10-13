import type { WordPressSite } from "@/components/integrations/types";

/** Match URL site id, else active console site, else first enabled property. */
export function resolveOrganicDashboardSite(
  sites: WordPressSite[],
  siteIdFromUrl: string | undefined,
  activeSiteId: string | null,
): WordPressSite | undefined {
  const enabled = sites.filter((s) => s.enabled !== false);
  if (enabled.length === 0) return undefined;

  if (siteIdFromUrl) {
    const byUrl = enabled.find((s) => s.id === siteIdFromUrl);
    if (byUrl) return byUrl;
  }

  if (activeSiteId) {
    const byActive = enabled.find((s) => s.id === activeSiteId);
    if (byActive) return byActive;
  }

  return enabled[0];
}
