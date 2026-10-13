import type {
  HostedEnvironment,
  HostedEnvironmentKind,
  HostedInventoryItem,
  HostedSiteGroup,
  HostedSiteStatus,
} from "@/lib/hosting-api";

export type MySitesTab = "all" | "attention" | "updates" | "plugins" | "themes";

export type MySitesFilters = {
  query: string;
  environments: HostedEnvironmentKind[];
  statuses: HostedSiteStatus[];
  tagIds: number[];
  phpVersions: string[];
};

export const EMPTY_FILTERS: MySitesFilters = {
  query: "",
  environments: [],
  statuses: [],
  tagIds: [],
  phpVersions: [],
};

export const ENVIRONMENT_LABEL: Record<HostedEnvironmentKind, string> = {
  production: "Prd",
  staging: "Stg",
  development: "Dev",
};

export function envNeedsAttention(env: HostedEnvironment): boolean {
  return env.status === "failed" || env.status === "degraded";
}

export function envUpdateCount(env: HostedEnvironment): number {
  const s = env.stats;
  if (!s) return 0;
  const wp = s.wpUpdateAvailable ? 1 : 0;
  const plugins = s.plugins.filter((p) => p.updateVersion).length;
  const themes = s.themes.filter((t) => t.updateVersion).length;
  return wp + plugins + themes;
}

export function groupNeedsAttention(group: HostedSiteGroup): boolean {
  return group.environments.some(envNeedsAttention);
}

export function groupUpdateCount(group: HostedSiteGroup): number {
  return group.environments.reduce((sum, env) => sum + envUpdateCount(env), 0);
}

export function activeFilterCount(f: MySitesFilters): number {
  return f.environments.length + f.statuses.length + f.tagIds.length + f.phpVersions.length;
}

function envMatchesFilters(env: HostedEnvironment, f: MySitesFilters): boolean {
  if (f.environments.length && !f.environments.includes(env.environment)) return false;
  if (f.statuses.length && !f.statuses.includes(env.status)) return false;
  if (f.phpVersions.length && !f.phpVersions.includes(env.stats?.phpVersion ?? "")) return false;
  return true;
}

function groupMatchesQuery(group: HostedSiteGroup, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (group.name.toLowerCase().includes(q)) return true;
  return group.environments.some(
    (env) => env.slug.toLowerCase().includes(q) || env.primaryDomain.toLowerCase().includes(q) || (env.siteUrl ?? "").toLowerCase().includes(q),
  );
}

/** Groups with only the environments that pass the active tab and filters. */
export function filterGroups(groups: HostedSiteGroup[], tab: MySitesTab, f: MySitesFilters): HostedSiteGroup[] {
  const out: HostedSiteGroup[] = [];
  for (const group of groups) {
    if (!groupMatchesQuery(group, f.query)) continue;
    if (f.tagIds.length && !group.tags.some((t) => f.tagIds.includes(t.id))) continue;
    let envs = group.environments.filter((env) => envMatchesFilters(env, f));
    if (tab === "attention") envs = envs.filter(envNeedsAttention);
    if (tab === "updates") envs = envs.filter((env) => envUpdateCount(env) > 0);
    if (envs.length === 0) continue;
    out.push({ ...group, environments: envs });
  }
  return out;
}

export function tabCounts(groups: HostedSiteGroup[]): { all: number; attention: number; updates: number } {
  return {
    all: groups.length,
    attention: groups.filter(groupNeedsAttention).length,
    updates: groups.filter((g) => groupUpdateCount(g) > 0).length,
  };
}

export function phpVersionOptions(groups: HostedSiteGroup[]): string[] {
  const set = new Set<string>();
  for (const g of groups) for (const env of g.environments) if (env.stats?.phpVersion) set.add(env.stats.phpVersion);
  return Array.from(set).sort();
}

export type InventoryRow = HostedInventoryItem & {
  envId: string;
  siteName: string;
  environment: HostedEnvironmentKind;
};

export function inventoryRows(groups: HostedSiteGroup[], kind: "plugins" | "themes"): InventoryRow[] {
  const rows: InventoryRow[] = [];
  for (const g of groups) {
    for (const env of g.environments) {
      for (const item of env.stats?.[kind] ?? []) {
        rows.push({ ...item, envId: env.id, siteName: g.name, environment: env.environment });
      }
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.siteName.localeCompare(b.siteName));
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return "–";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatCount(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("en-US").format(n);
}

export function csvForGroups(groups: HostedSiteGroup[]): string {
  const header = ["Site", "Environment", "Install", "Domain", "Status", "PHP", "WordPress", "Storage bytes", "Bandwidth bytes 30d", "Visits 30d", "Tags"];
  const lines = [header.join(",")];
  const cell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  for (const g of groups) {
    for (const env of g.environments) {
      lines.push(
        [
          g.name,
          env.environment,
          env.slug,
          env.primaryDomain || env.siteUrl || "",
          env.status,
          env.stats?.phpVersion ?? "",
          env.stats?.wpVersion ?? "",
          env.stats?.storageBytes ?? "",
          env.stats?.bandwidthBytes30d ?? "",
          env.stats?.visits30d ?? "",
          g.tags.map((t) => t.name).join("; "),
        ]
          .map(cell)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}
