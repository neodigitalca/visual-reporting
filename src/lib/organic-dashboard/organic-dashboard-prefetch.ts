import type { QueryClient } from "@tanstack/react-query";
import type { WordPressSite } from "@/components/integrations/types";
import { resolveGa4PropertyIdForReporting } from "@/lib/ga4-reporting-property";
import { fetchOrganicDashboardBundle } from "@/lib/organic-dashboard/organic-dashboard-fetch";
import {
  buildOrganicDashboardFetchParams,
  defaultOrganicReportingDateHarness,
} from "@/lib/organic-dashboard/organic-dashboard-fetch-params";

export const ORGANIC_DASHBOARD_QUERY_STALE_MS = 60_000;

/** Warm Performance bundle cache before route paint (Reporting nav). */
export function prefetchOrganicDashboardBundle(
  queryClient: QueryClient,
  site: WordPressSite,
): void {
  const dateHarness = defaultOrganicReportingDateHarness();
  const ga4PropertyId = resolveGa4PropertyIdForReporting(site);
  const params = buildOrganicDashboardFetchParams(site, dateHarness, ga4PropertyId);
  if (!params) return;

  void queryClient.prefetchQuery({
    queryKey: ["organic-dashboard", site.id, params] as const,
    queryFn: () => fetchOrganicDashboardBundle(params),
    staleTime: ORGANIC_DASHBOARD_QUERY_STALE_MS,
  });
}
