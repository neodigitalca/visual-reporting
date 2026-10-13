import { backendApiUrl } from "@/lib/wordpress-api/connection";
import { neoPulseApiHeaders } from "@/lib/neo-pulse-api-headers";

export type HostedSiteStatus = "pending" | "provisioning" | "active" | "degraded" | "failed";
export type HostedEnvironmentKind = "production" | "staging" | "development";

export type HostedInventoryItem = {
  slug: string;
  name: string;
  version: string;
  updateVersion: string | null;
  active: boolean;
};

export type HostedEnvStats = {
  phpVersion: string | null;
  wpVersion: string | null;
  wpUpdateAvailable: string | null;
  storageBytes: number | null;
  bandwidthBytes30d: number | null;
  visits30d: number | null;
  plugins: HostedInventoryItem[];
  themes: HostedInventoryItem[];
  collectedAt: string | null;
  errorMessage: string | null;
};

/** One environment / install (a `hosted_sites` row). */
export type HostedEnvironment = {
  id: string;
  groupId: string | null;
  slug: string;
  displayName: string;
  environment: HostedEnvironmentKind;
  primaryDomain: string;
  region: string;
  renderServiceId: string | null;
  renderDbServiceId: string | null;
  diskGb: number;
  status: HostedSiteStatus;
  statusMessage: string | null;
  pulseIntegrationSiteId: string | null;
  wpAdminUrl: string | null;
  siteUrl: string | null;
  createdAt: string;
  updatedAt: string;
  stats: HostedEnvStats | null;
};

export type HostedTag = { id: number; name: string };

/** Site group: a named site with one or more environments. */
export type HostedSiteGroup = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tags: HostedTag[];
  environments: HostedEnvironment[];
};

export type HostingJob = {
  id: string;
  siteId: string | null;
  jobType: string;
  status: string;
  payload?: unknown;
  result?: unknown;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Flatten<T> = { [K in keyof T]: T[K] };
type ApiResult<T> = Flatten<{ ok: true } & T> | { ok: false; error: string };

async function api<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(backendApiUrl(p), {
    ...options,
    headers: neoPulseApiHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string>) }),
    credentials: "include",
    cache: "no-store",
  });
  const text = await res.text();
  let data: ({ ok?: boolean; error?: string } & Partial<T>) | null = null;
  try {
    data = text ? (JSON.parse(text) as { ok?: boolean; error?: string } & Partial<T>) : null;
  } catch {
    data = null;
  }
  if (!data) {
    return { ok: false, error: `Pulse Host API returned HTTP ${res.status} with no JSON body.` };
  }
  if (!data.ok) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }
  return data as Flatten<{ ok: true } & T>;
}

export function fetchHostedSiteGroups() {
  return api<{ groups: HostedSiteGroup[]; tags: HostedTag[] }>("/hosting/sites");
}

export function createHostedEnvironment(payload: {
  name?: string;
  groupId?: string;
  environment: HostedEnvironmentKind;
  primaryDomain?: string;
}) {
  return api<{ site: HostedEnvironment; groupId: string; jobId: string }>("/hosting/sites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteHostedEnvironment(siteId: string) {
  return api<unknown>(`/hosting/sites/${siteId}`, { method: "DELETE" });
}

export function triggerHostedSiteDeploy(siteId: string) {
  return api<{ deployId?: string }>(`/hosting/sites/${siteId}/deploy`, { method: "POST" });
}

export function triggerHostedSiteBackup(siteId: string) {
  return api<{ jobId: string }>(`/hosting/sites/${siteId}/backups`, { method: "POST" });
}

export function clearHostedSiteCache(siteId: string) {
  return api<{ jobId: string }>(`/hosting/sites/${siteId}/cache-clear`, { method: "POST" });
}

export function retryHostedSiteProvision(siteId: string) {
  return api<{ jobId: string }>(`/hosting/sites/${siteId}/retry-provision`, { method: "POST" });
}

export function runHostingOpsAgent(siteId: string, payload: { prompt?: string; execute?: boolean; confirmed?: boolean }) {
  return api<{ jobId: string }>(`/hosting/sites/${siteId}/ops-agent`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchHostingJob(jobId: string) {
  return api<{ job: HostingJob }>(`/hosting/jobs/${jobId}`);
}

export function createHostedTag(name: string) {
  return api<{ tag: HostedTag }>("/hosting/tags", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameHostedTag(tagId: number, name: string) {
  return api<{ tag: HostedTag }>(`/hosting/tags/${tagId}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export function deleteHostedTag(tagId: number) {
  return api<unknown>(`/hosting/tags/${tagId}`, { method: "DELETE" });
}

export function assignHostedGroupTags(groupId: string, tagIds: number[]) {
  return api<unknown>("/hosting/tags/assign", {
    method: "POST",
    body: JSON.stringify({ groupId, tagIds }),
  });
}

/** A WordPress user on one hosted environment. */
export type HostedSiteUser = {
  id: number;
  login: string;
  email: string;
  displayName: string;
  roles: string[];
  registered: string;
};

export type HostedSiteRole = "administrator" | "editor" | "author" | "contributor" | "subscriber";

/** Either a Pulse team member (same password as Pulse) or a manual email + password. */
export type HostedUserInput =
  | { pulseUserId: number; role: HostedSiteRole }
  | { email: string; displayName?: string; password: string; role: HostedSiteRole };

export type HostedBulkUserResult = {
  siteId: string;
  slug: string;
  environment: HostedEnvironmentKind;
  ok: boolean;
  error: string | null;
};

export function fetchHostedSiteUsers(siteId: string) {
  return api<{ users: HostedSiteUser[] }>(`/hosting/sites/${siteId}/users`);
}

export function createHostedSiteUser(siteId: string, input: HostedUserInput) {
  return api<{ user: HostedSiteUser }>(`/hosting/sites/${siteId}/users`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateHostedSiteUser(siteId: string, userId: number, patch: { role?: HostedSiteRole; password?: string }) {
  return api<{ user: HostedSiteUser }>(`/hosting/sites/${siteId}/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteHostedSiteUser(siteId: string, userId: number) {
  return api<unknown>(`/hosting/sites/${siteId}/users/${userId}`, { method: "DELETE" });
}

export function addUserToAllSites(input: HostedUserInput) {
  return api<{ results: HostedBulkUserResult[] }>("/hosting/sites/users-bulk", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type HostedBackup = {
  id: number;
  storageUri: string;
  sizeBytes: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

export type HostedDeploy = {
  id: number;
  renderDeployId: string | null;
  gitCommit: string | null;
  status: string;
  createdAt: string;
};

export type HostedAuditEntry = {
  id: number;
  actorUserId: number | null;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type HostedSiteActivity = {
  backups: HostedBackup[];
  deploys: HostedDeploy[];
  jobs: HostingJob[];
  audit: HostedAuditEntry[];
};

export function fetchHostedSiteActivity(siteId: string) {
  return api<HostedSiteActivity>(`/hosting/sites/${siteId}/activity`);
}

/** Re-runs the health job: PHP/WP versions, storage, plugins, themes, and Render 30d usage. */
export function refreshHostedSiteStats(siteId: string) {
  return api<{ jobId: string }>(`/hosting/sites/${siteId}/health`, { method: "POST" });
}
