import { useQuery } from "@tanstack/react-query";
import type { OrganicDashboardFetchParams } from "@/lib/organic-dashboard/organic-dashboard-types";
import type { OrganicDashboardBundleResponse } from "@/lib/organic-dashboard/organic-dashboard-types";
import { ORGANIC_DASHBOARD_QUERY_STALE_MS } from "@/lib/organic-dashboard/organic-dashboard-prefetch";
import { buildOrganicDashboardViewModel } from "@/lib/organic-dashboard/organic-dashboard-view-model";
import {
  buildOrganicReportingHighlightsSnapshot,
  fetchOrganicReportingHighlights,
} from "@/lib/organic-dashboard/organic-reporting-highlights";

export type UseOrganicReportingHighlightsQueryArgs = {
  siteId: string;
  bundle: OrganicDashboardBundleResponse | undefined;
  fetchParams: OrganicDashboardFetchParams | null;
  showCompare: boolean;
  siteDisplayName: string;
  sitePublicUrl: string;
  enabled: boolean;
};

export function organicReportingHighlightsQueryKey(
  siteId: string,
  fetchParams: OrganicDashboardFetchParams | null,
) {
  return ["organic-reporting-highlights", siteId, fetchParams] as const;
}

export function useOrganicReportingHighlightsQuery(args: UseOrganicReportingHighlightsQueryArgs) {
  const {
    siteId,
    bundle,
    fetchParams,
    showCompare,
    siteDisplayName,
    sitePublicUrl,
    enabled,
  } = args;

  return useQuery({
    queryKey: organicReportingHighlightsQueryKey(siteId, fetchParams),
    queryFn: async ({ signal }) => {
      if (!bundle) {
        throw new Error("Performance data is missing.");
      }
      const viewModel = buildOrganicDashboardViewModel(bundle, { showCompare });
      const snapshot = buildOrganicReportingHighlightsSnapshot(
        viewModel,
        siteDisplayName,
        sitePublicUrl,
        showCompare,
      );
      return fetchOrganicReportingHighlights(snapshot, siteId, signal);
    },
    enabled: enabled && fetchParams != null && bundle != null,
    staleTime: ORGANIC_DASHBOARD_QUERY_STALE_MS,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}
