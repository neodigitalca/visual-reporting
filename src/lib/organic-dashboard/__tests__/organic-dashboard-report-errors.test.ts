import { describe, expect, it, vi } from "vitest";
import { reportOrganicDashboardSourceErrors } from "@/lib/organic-dashboard/organic-dashboard-report-errors";
import type { OrganicDashboardBundleResponse } from "@/lib/organic-dashboard/organic-dashboard-types";

describe("reportOrganicDashboardSourceErrors", () => {
  it("does not log when GA4 property ID is missing (skipped config)", () => {
    const reportError = vi.fn();
    const data: OrganicDashboardBundleResponse = {
      success: true,
      ga4: {
        skipped: true,
        reason: "missing_ga4_property_id",
        error: "GA4 Property ID is not set for this site.",
      },
      sources: { ga4: "skipped", gsc: "ok", semrush: "ok" },
    };
    reportOrganicDashboardSourceErrors(data, reportError);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("does not log GSC service account property list errors", () => {
    const reportError = vi.fn();
    const data: OrganicDashboardBundleResponse = {
      success: true,
      gsc: {
        skipped: true,
        reason: "site_not_in_list",
        error:
          "This site is not in the list of properties the service account can access. Add neopulse@neopulse-505422.iam.gserviceaccount.com as a user in GSC.",
        serviceAccountEmail: "neopulse@neopulse-505422.iam.gserviceaccount.com",
      },
      sources: { ga4: "ok", gsc: "error", semrush: "ok" },
    };
    reportOrganicDashboardSourceErrors(data, reportError);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("logs when GA4 API returns an error status", () => {
    const reportError = vi.fn();
    const data: OrganicDashboardBundleResponse = {
      success: true,
      ga4: {
        skipped: true,
        reason: "ga4_error",
        error: "Permission denied",
      },
      sources: { ga4: "error", gsc: "ok", semrush: "ok" },
    };
    reportOrganicDashboardSourceErrors(data, reportError);
    expect(reportError).toHaveBeenCalledWith("Organic dashboard · GA4: Permission denied");
  });
});
