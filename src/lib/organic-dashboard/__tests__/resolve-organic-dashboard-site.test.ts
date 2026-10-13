import { describe, expect, it } from "vitest";
import { resolveOrganicDashboardSite } from "@/lib/organic-dashboard/resolve-organic-dashboard-site";
import type { WordPressSite } from "@/components/integrations/types";

function site(id: string, enabled = true): WordPressSite {
  return {
    id,
    name: id,
    siteUrl: `https://${id}.example/`,
    enabled,
  } as WordPressSite;
}

describe("resolveOrganicDashboardSite", () => {
  it("uses URL id when it matches an enabled property", () => {
    const sites = [site("a"), site("b")];
    expect(resolveOrganicDashboardSite(sites, "b", "a")?.id).toBe("b");
  });

  it("falls back to active property when URL id is stale", () => {
    const sites = [site("blind"), site("dm")];
    expect(resolveOrganicDashboardSite(sites, "wp-old-id", "dm")?.id).toBe("dm");
  });

  it("falls back to first enabled property when URL and active are missing", () => {
    const sites = [site("first"), site("second")];
    expect(resolveOrganicDashboardSite(sites, "missing", null)?.id).toBe("first");
  });

  it("skips disabled properties and falls back to another enabled site", () => {
    const sites = [site("off", false), site("on")];
    expect(resolveOrganicDashboardSite(sites, "off", "off")?.id).toBe("on");
    expect(resolveOrganicDashboardSite(sites, "missing", "off")?.id).toBe("on");
  });
});
