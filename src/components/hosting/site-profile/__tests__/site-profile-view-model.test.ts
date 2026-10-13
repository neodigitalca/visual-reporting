import { describe, expect, it } from "vitest";
import type { HostedEnvironment, HostedSiteActivity, HostedSiteGroup } from "@/lib/hosting-api";
import { activityTimeline, pickEnvironment, profileUpdateCounts } from "../site-profile-view-model";

function env(id: string, environment: HostedEnvironment["environment"], stats: HostedEnvironment["stats"] = null): HostedEnvironment {
  return {
    id,
    groupId: "g1",
    slug: id,
    displayName: "Site",
    environment,
    primaryDomain: "",
    region: "ohio",
    renderServiceId: "srv",
    renderDbServiceId: "srv-db",
    diskGb: 10,
    status: "active",
    statusMessage: null,
    pulseIntegrationSiteId: null,
    wpAdminUrl: null,
    siteUrl: null,
    createdAt: "",
    updatedAt: "",
    stats,
  };
}

const group: HostedSiteGroup = {
  id: "g1",
  name: "Site",
  createdAt: "",
  updatedAt: "",
  tags: [],
  environments: [env("stg", "staging"), env("prd", "production")],
};

describe("pickEnvironment", () => {
  it("prefers the requested id, then production, then the first", () => {
    expect(pickEnvironment(group, "stg")?.id).toBe("stg");
    expect(pickEnvironment(group, "missing")?.id).toBe("prd");
    expect(pickEnvironment(group, null)?.id).toBe("prd");
    expect(pickEnvironment({ ...group, environments: [env("dev", "development")] }, null)?.id).toBe("dev");
    expect(pickEnvironment({ ...group, environments: [] }, null)).toBeNull();
  });
});

describe("profileUpdateCounts", () => {
  it("counts plugin and theme updates and reports the WordPress update", () => {
    const stats: NonNullable<HostedEnvironment["stats"]> = {
      phpVersion: "8.3",
      wpVersion: "6.7",
      wpUpdateAvailable: "6.8",
      storageBytes: 0,
      bandwidthBytes30d: 0,
      visits30d: 0,
      plugins: [
        { slug: "a", name: "A", version: "1", updateVersion: "2", active: true },
        { slug: "b", name: "B", version: "1", updateVersion: null, active: true },
      ],
      themes: [{ slug: "t", name: "T", version: "1", updateVersion: "1.1", active: true }],
      collectedAt: null,
      errorMessage: null,
    };
    expect(profileUpdateCounts(env("prd", "production", stats))).toEqual({ wordpress: "6.8", plugins: 1, themes: 1 });
    expect(profileUpdateCounts(env("prd", "production"))).toEqual({ wordpress: null, plugins: 0, themes: 0 });
  });
});

describe("activityTimeline", () => {
  it("merges all sources newest first", () => {
    const activity: HostedSiteActivity = {
      backups: [{ id: 1, storageUri: "u", sizeBytes: 0, status: "completed", errorMessage: null, createdAt: "2026-10-01T00:00:00Z" }],
      deploys: [{ id: 2, renderDeployId: "dep-1", gitCommit: null, status: "triggered", createdAt: "2026-10-03T00:00:00Z" }],
      jobs: [{ id: "j", siteId: "s", jobType: "health", status: "failed", errorMessage: "boom", createdAt: "2026-10-02T00:00:00Z", updatedAt: "" }],
      audit: [{ id: 3, actorUserId: 2, action: "site.user.create", payload: { email: "a@b.c" }, createdAt: "2026-10-04T00:00:00Z" }],
    };
    const rows = activityTimeline(activity);
    expect(rows.map((r) => r.kind)).toEqual(["audit", "deploy", "job", "backup"]);
    expect(rows[2]).toMatchObject({ label: "Stats refresh", status: "failed", detail: "boom" });
    expect(rows[0].detail).toBe("email a@b.c");
    expect(activityTimeline({ backups: [], deploys: [], jobs: [], audit: [] })).toEqual([]);
  });
});
