import { useMemo } from "react";
import { useWordPressSites } from "@/hooks/use-wordpress-sites";
import { useActiveWordPressSite } from "@/contexts/active-wordpress-site-context";
import { getStoredSites } from "@/components/integrations/storage";
import { resolveOrganicDashboardSite } from "@/lib/organic-dashboard/resolve-organic-dashboard-site";
import { OrganicReportingPanel } from "@/pages/OrganicDashboardPage";

export function OrganicReportingEmbeddedPanel() {
  const { sites: sitesFromHook } = useWordPressSites();
  const { activeWordPressSiteId } = useActiveWordPressSite();
  const sites = useMemo(
    () => (sitesFromHook.length > 0 ? sitesFromHook : getStoredSites()),
    [sitesFromHook],
  );
  const site = useMemo(
    () => resolveOrganicDashboardSite(sites, undefined, activeWordPressSiteId),
    [sites, activeWordPressSiteId],
  );

  if (!site) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-base text-muted-foreground">
        Select a property in the console to load Reporting.
      </div>
    );
  }

  return <OrganicReportingPanel site={site} inAppTab />;
}
