import type { HostedEnvironment, HostedSiteActivity, HostedSiteGroup } from "@/lib/hosting-api";

/** Environment for the profile: the requested id, else production, else the first one. */
export function pickEnvironment(group: HostedSiteGroup, envId: string | null): HostedEnvironment | null {
  const byId = envId ? group.environments.find((e) => e.id === envId) : undefined;
  return byId ?? group.environments.find((e) => e.environment === "production") ?? group.environments[0] ?? null;
}

export type ProfileUpdateCounts = { wordpress: string | null; plugins: number; themes: number };

export function profileUpdateCounts(env: HostedEnvironment): ProfileUpdateCounts {
  const s = env.stats;
  return {
    wordpress: s?.wpUpdateAvailable ?? null,
    plugins: s?.plugins.filter((p) => p.updateVersion).length ?? 0,
    themes: s?.themes.filter((t) => t.updateVersion).length ?? 0,
  };
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export type ActivityKind = "job" | "deploy" | "backup" | "audit";

export type ActivityEntry = {
  key: string;
  at: string;
  kind: ActivityKind;
  label: string;
  status: string;
  detail: string;
};

const JOB_LABEL: Record<string, string> = {
  provision: "Provision",
  health: "Stats refresh",
  backup: "Backup",
  cache_clear: "Clear cache",
  ops_agent: "Ops agent",
};

function payloadDetail(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of ["slug", "email", "role", "userId", "environment"]) {
    const v = payload[key];
    if (typeof v === "string" || typeof v === "number") parts.push(`${key} ${v}`);
  }
  return parts.join(", ");
}

/** Jobs, deploys, backups, and audit entries merged newest first. */
export function activityTimeline(activity: HostedSiteActivity): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    ...activity.jobs.map((j) => ({
      key: `job-${j.id}`,
      at: j.createdAt,
      kind: "job" as const,
      label: JOB_LABEL[j.jobType] ?? j.jobType,
      status: j.status,
      detail: j.errorMessage ?? "",
    })),
    ...activity.deploys.map((d) => ({
      key: `deploy-${d.id}`,
      at: d.createdAt,
      kind: "deploy" as const,
      label: "Redeploy",
      status: d.status,
      detail: d.renderDeployId ?? "",
    })),
    ...activity.backups.map((b) => ({
      key: `backup-${b.id}`,
      at: b.createdAt,
      kind: "backup" as const,
      label: "Backup",
      status: b.status,
      detail: b.errorMessage ?? b.storageUri,
    })),
    ...activity.audit.map((a) => ({
      key: `audit-${a.id}`,
      at: a.createdAt,
      kind: "audit" as const,
      label: a.action,
      status: a.actorUserId === null ? "system" : `user ${a.actorUserId}`,
      detail: payloadDetail(a.payload ?? {}),
    })),
  ];
  return entries.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
}
