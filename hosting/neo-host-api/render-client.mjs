const API = "https://api.render.com/v1";

function apiKey() {
  const key = (process.env.RENDER_API_KEY || "").trim();
  if (!key) throw new Error("RENDER_API_KEY is required for Render orchestration.");
  return key;
}

async function api(method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${route} failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
}

export async function getOwnerId() {
  const fromEnv = (process.env.RENDER_OWNER_ID || "").trim();
  if (fromEnv) return fromEnv;
  const data = await api("GET", "/owners?limit=20");
  const list = Array.isArray(data) ? data.map((row) => row.owner ?? row) : data?.owners ?? [];
  const preferred = list.find((o) => o.type === "team") ?? list[0];
  if (!preferred?.id) throw new Error("No Render owner found.");
  return preferred.id;
}

function repoConfig() {
  const repo = (process.env.PULSE_HOST_RENDER_REPO || process.env.NEO_HOST_RENDER_REPO || "").trim();
  const branch = (process.env.PULSE_HOST_RENDER_BRANCH || process.env.NEO_HOST_RENDER_BRANCH || "main").trim();
  if (!repo) throw new Error("PULSE_HOST_RENDER_REPO is required to provision WordPress services.");
  return { repo, branch };
}

/**
 * Create a Docker-based Render service from this repo.
 * @param {{ type: "web_service" | "private_service", name: string, dockerfilePath: string, plan: string, region: string, envVars: Array<{key:string,value:string}>, disk?: { name: string, mountPath: string, sizeGB: number } }} opts
 */
export async function createDockerService(ownerId, opts) {
  const { repo, branch } = repoConfig();
  const created = await api("POST", "/services", {
    type: opts.type,
    name: opts.name,
    ownerId,
    repo,
    branch,
    autoDeploy: "yes",
    envVars: opts.envVars.map((v) => ({ key: v.key, value: String(v.value) })),
    serviceDetails: {
      runtime: "docker",
      plan: opts.plan,
      region: opts.region,
      envSpecificDetails: { dockerfilePath: opts.dockerfilePath, dockerContext: "." },
      ...(opts.disk ? { disk: opts.disk } : {}),
    },
  });
  return created.service ?? created;
}

export async function addCustomDomain(serviceId, domain) {
  return api("POST", `/services/${serviceId}/custom-domains`, { name: domain });
}

export async function deleteService(serviceId) {
  await api("DELETE", `/services/${serviceId}`);
}

export async function triggerServiceDeploy(serviceId) {
  const data = await api("POST", `/services/${serviceId}/deploys`, { clearCache: "do_not_clear" });
  return data?.id || data?.deploy?.id || null;
}

async function metricSeries(kind, serviceId, { startTime, endTime, resolutionSeconds }) {
  const params = new URLSearchParams();
  params.append("resource", serviceId);
  params.set("startTime", startTime);
  params.set("endTime", endTime);
  params.set("resolutionSeconds", String(resolutionSeconds));
  const data = await api("GET", `/metrics/${kind}?${params.toString()}`);
  const series = Array.isArray(data) ? data : [];
  let total = 0;
  for (const s of series) {
    for (const point of s.values ?? []) {
      total += Number(point.value) || 0;
    }
  }
  return total;
}

/** Sum of bandwidth bytes and HTTP requests over the last 30 days. */
export async function fetchUsage30d(serviceId) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
  const window = {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    resolutionSeconds: 86400,
  };
  const [bandwidthBytes, httpRequests] = await Promise.all([
    metricSeries("bandwidth", serviceId, window),
    metricSeries("http-requests", serviceId, window),
  ]);
  return { bandwidthBytes, httpRequests };
}

export async function listServiceLogs(serviceId, { limit = 50 } = {}) {
  const data = await api("GET", `/logs?resource=${encodeURIComponent(serviceId)}&limit=${limit}`);
  return Array.isArray(data) ? data : data?.logs ?? [];
}

export { api };
