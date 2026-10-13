import { describe, expect, it } from "vitest";
import type { HostedEnvironment, HostedSiteGroup } from "@/lib/hosting-api";
import {
  EMPTY_FILTERS,
  csvForGroups,
  envUpdateCount,
  filterGroups,
  formatBytes,
  inventoryRows,
  phpVersionOptions,
  tabCounts,
} from "../my-sites-view-model";

function env(partial: Partial<HostedEnvironment> & { id: string; environment: HostedEnvironment["environment"] }): HostedEnvironment {
  return {
    groupId: "g1",
    slug: partial.id,
    displayName: "Site",
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
    stats: null,
    ...partial,
  };
}

function group(id: string, name: string, environments: HostedEnvironment[], tags: HostedSiteGroup["tags"] = []): HostedSiteGroup {
  return { id, name, createdAt: "", updatedAt: "", tags, environments };
}

const stats = {
  phpVersion: "8.3.1",
  wpVersion: "6.7.2",
  wpUpdateAvailable: "6.8",
  storageBytes: 2 * 1024 * 1024 * 1024,
  bandwidthBytes30d: 512 * 1024 * 1024,
  visits30d: 1234,
  plugins: [{ slug: "a", name: "A", version: "1", updateVersion: "2", active: true }],
  themes: [{ slug: "t", name: "T", version: "1", updateVersion: null, active: true }],
  collectedAt: "now",
  errorMessage: null,
};

const groups: HostedSiteGroup[] = [
  group("g1", "Alpha", [env({ id: "alpha", environment: "production", stats }), env({ id: "alpha-stg", environment: "staging", status: "failed" })], [
    { id: 1, name: "client" },
  ]),
  group("g2", "Beta", [env({ id: "beta", environment: "production", primaryDomain: "beta.example.com" })]),
];

describe("my-sites view model", () => {
  it("counts updates from WP core, plugins, and themes", () => {
    expect(envUpdateCount(groups[0].environments[0])).toBe(2);
    expect(envUpdateCount(groups[1].environments[0])).toBe(0);
  });

  it("computes tab counts per site group", () => {
    expect(tabCounts(groups)).toEqual({ all: 2, attention: 1, updates: 1 });
  });

  it("filters by tab and keeps only matching environments", () => {
    const attention = filterGroups(groups, "attention", EMPTY_FILTERS);
    expect(attention).toHaveLength(1);
    expect(attention[0].environments.map((e) => e.slug)).toEqual(["alpha-stg"]);
    const updates = filterGroups(groups, "updates", EMPTY_FILTERS);
    expect(updates[0].environments.map((e) => e.slug)).toEqual(["alpha"]);
  });

  it("filters by query, tag, environment, and php version", () => {
    expect(filterGroups(groups, "all", { ...EMPTY_FILTERS, query: "beta.example" }).map((g) => g.name)).toEqual(["Beta"]);
    expect(filterGroups(groups, "all", { ...EMPTY_FILTERS, tagIds: [1] }).map((g) => g.name)).toEqual(["Alpha"]);
    expect(filterGroups(groups, "all", { ...EMPTY_FILTERS, environments: ["staging"] })[0].environments).toHaveLength(1);
    expect(filterGroups(groups, "all", { ...EMPTY_FILTERS, phpVersions: ["8.3.1"] }).map((g) => g.name)).toEqual(["Alpha"]);
    expect(phpVersionOptions(groups)).toEqual(["8.3.1"]);
  });

  it("flattens plugin inventory across environments", () => {
    const rows = inventoryRows(groups, "plugins");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "A", siteName: "Alpha", environment: "production", updateVersion: "2" });
  });

  it("formats bytes and builds CSV with one row per environment", () => {
    expect(formatBytes(null)).toBe("–");
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
    const csv = csvForGroups(groups);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"Alpha","production","alpha"');
    expect(lines[1]).toContain('"client"');
  });
});
