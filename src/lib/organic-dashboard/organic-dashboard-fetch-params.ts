import type { WordPressSite } from "@/components/integrations/types";
import type { Ga4ReportingDateHarness } from "@/components/research/reporting/Ga4ReportingDateRangePopover";
import { buildGa4ReportingRanges } from "@/lib/reporting/ga4-analytics-date-ranges";
import { getPublicSiteUrl } from "@/lib/wordpress-site-public-url";
import { resolveSemrushDatabaseForSite } from "@/lib/organic-dashboard/resolve-semrush-database-for-site";
import type { OrganicDashboardFetchParams } from "@/lib/organic-dashboard/organic-dashboard-types";
import {
  parseOrganicReportingShareParams,
  type OrganicReportingShareState,
} from "@/lib/organic-dashboard/organic-reporting-share-url";
import { readOrganicDashboardDateSession } from "@/lib/organic-dashboard/organic-dashboard-date-session";
import {
  validateReportingCompareFetchRanges,
  validateReportingPrimaryFetchRange,
} from "@/lib/reporting/reporting-date-presets";

function dateHarnessFromShare(parsed: OrganicReportingShareState): Ga4ReportingDateHarness {
  const { section: _section, ...harness } = parsed;
  return harness;
}

export function defaultOrganicReportingDateHarness(): Ga4ReportingDateHarness {
  if (typeof window !== "undefined") {
    const fromUrl = parseOrganicReportingShareParams(window.location.search);
    if (fromUrl) return dateHarnessFromShare(fromUrl);
  }
  const stored = readOrganicDashboardDateSession();
  if (stored) return stored;
  return {
    primaryPreset: "last_30",
    compareBaseline: "previous_period",
    compareEnabled: true,
    compareRangeDraft: buildGa4ReportingRanges({
      primaryPreset: "last_30",
      primaryCustom: { startDate: "", endDate: "" },
      compareEnabled: true,
      compareBaseline: "previous_period",
      compareCustom: { startDate: "", endDate: "" },
    }),
  };
}

export function buildOrganicDashboardFetchParams(
  site: WordPressSite,
  dateHarness: Ga4ReportingDateHarness,
  ga4PropertyId: string,
): OrganicDashboardFetchParams | null {
  const siteUrl = getPublicSiteUrl(site).trim() || site.siteUrl.trim();
  if (!siteUrl) return null;

  const { primary, compare } = dateHarness.compareRangeDraft;
  const showCompare = dateHarness.compareEnabled;
  const rangesValid = showCompare
    ? validateReportingCompareFetchRanges(primary, compare).ok
    : validateReportingPrimaryFetchRange(primary).ok;
  if (!rangesValid) return null;

  return {
    siteUrl,
    ga4PropertyId,
    semrushDatabase: resolveSemrushDatabaseForSite(site),
    reportStructure: showCompare ? "compare" : "period_progress",
    startDate: primary.startDate,
    endDate: primary.endDate,
    compareStartDate: showCompare ? compare.startDate : primary.startDate,
    compareEndDate: showCompare ? compare.endDate : primary.endDate,
  };
}
