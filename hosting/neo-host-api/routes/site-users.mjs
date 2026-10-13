import { getPool } from "../db/pool.mjs";
import { auditLog } from "../db/tenants.mjs";
import { sendJson } from "../lib/http.mjs";
import { hostReportUrl } from "../jobs/health.mjs";

const USER_FIELDS = ["email", "login", "displayName", "role", "password", "passwordHash"];

/** Only the fields the hosted plugin understands are forwarded. */
function userPayload(body) {
  const out = {};
  for (const key of USER_FIELDS) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") out[key] = String(body[key]);
  }
  return out;
}

/** Calls the hosted site's users endpoint with its report token; returns { status, data }. */
async function callSite(site, method, path, payload) {
  if (!site.site_url || !site.report_token) {
    return { status: 400, data: { ok: false, error: "Environment has no site URL or report token yet." } };
  }
  let res;
  try {
    res = await fetch(hostReportUrl(site.site_url, `/users${path}`), {
      method,
      headers: {
        "X-Pulse-Host-Token": site.report_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    return { status: 502, data: { ok: false, error: `Site unreachable: ${err instanceof Error ? err.message : String(err)}` } };
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { status: 502, data: { ok: false, error: `Site returned HTTP ${res.status} without JSON.` } };
  }
  if (!res.ok) {
    // WP_Error shape is { code, message, data: { status } }.
    return { status: res.status, data: { ok: false, error: data.message || data.error || `HTTP ${res.status}` } };
  }
  return { status: res.status, data };
}

function requireWrite(res, auth) {
  if (auth.hostingWrite) return true;
  sendJson(res, 403, { ok: false, error: "Hosting admin required." });
  return false;
}

/**
 * /v1/hosting/sites/:id/users            GET, POST
 * /v1/hosting/sites/:id/users/:userId    PATCH, DELETE
 */
export async function handleSiteUsersRoute(res, site, parts, method, body, auth, tenantId) {
  const userId = parts[2] ? String(parts[2]) : "";

  if (!userId && method === "GET") {
    const result = await callSite(site, "GET", "");
    sendJson(res, result.status, result.data);
    return;
  }

  if (!userId && method === "POST") {
    if (!requireWrite(res, auth)) return;
    const payload = userPayload(body);
    if (!payload.email || !payload.role) {
      sendJson(res, 400, { ok: false, error: "email and role are required." });
      return;
    }
    const result = await callSite(site, "POST", "", payload);
    if (result.data.ok) {
      await auditLog({
        tenantId,
        actorUserId: auth.userId,
        action: "site.user.create",
        payload: { siteId: site.id, slug: site.slug, email: payload.email, role: payload.role },
      });
    }
    sendJson(res, result.status, result.data);
    return;
  }

  if (userId && method === "PATCH") {
    if (!requireWrite(res, auth)) return;
    const payload = userPayload(body);
    const result = await callSite(site, "PATCH", `/${encodeURIComponent(userId)}`, payload);
    if (result.data.ok) {
      await auditLog({
        tenantId,
        actorUserId: auth.userId,
        action: "site.user.update",
        payload: { siteId: site.id, slug: site.slug, userId, fields: Object.keys(payload).filter((k) => !k.startsWith("password")) },
      });
    }
    sendJson(res, result.status, result.data);
    return;
  }

  if (userId && method === "DELETE") {
    if (!requireWrite(res, auth)) return;
    const result = await callSite(site, "DELETE", `/${encodeURIComponent(userId)}`);
    if (result.data.ok) {
      await auditLog({ tenantId, actorUserId: auth.userId, action: "site.user.delete", payload: { siteId: site.id, slug: site.slug, userId } });
    }
    sendJson(res, result.status, result.data);
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found." });
}

/** POST /v1/hosting/sites/users-bulk: add one user to every provisioned environment of the tenant. */
export async function handleBulkUsersRoute(res, method, body, auth, tenantId) {
  if (method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }
  if (!requireWrite(res, auth)) return;
  const payload = userPayload(body);
  if (!payload.email || !payload.role) {
    sendJson(res, 400, { ok: false, error: "email and role are required." });
    return;
  }
  const sites = await getPool().query(
    `SELECT id, slug, environment, site_url, report_token FROM hosted_sites
     WHERE tenant_id = $1 AND render_service_id IS NOT NULL ORDER BY slug ASC`,
    [tenantId],
  );
  const results = await Promise.all(
    sites.rows.map(async (site) => {
      const result = await callSite(site, "POST", "", payload);
      return {
        siteId: site.id,
        slug: site.slug,
        environment: site.environment,
        ok: Boolean(result.data.ok),
        error: result.data.ok ? null : String(result.data.error || `HTTP ${result.status}`),
      };
    }),
  );
  await auditLog({
    tenantId,
    actorUserId: auth.userId,
    action: "site.user.create_all",
    payload: { email: payload.email, role: payload.role, ok: results.filter((r) => r.ok).length, total: results.length },
  });
  sendJson(res, 200, { ok: true, results });
}
