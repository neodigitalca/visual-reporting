import { getPool } from "../db/pool.mjs";
import { hostReportUrl } from "./health.mjs";

function payload(job) {
  const p = job.payload_json;
  return typeof p === "string" ? JSON.parse(p) : p || {};
}

/** Purge NEO Pulse Speed + WordPress object caches on one environment via host-report. */
export async function runCacheClearJob(job) {
  const siteId = job.site_id || payload(job).siteId;
  const siteRes = await getPool().query(`SELECT site_url, report_token FROM hosted_sites WHERE id = $1`, [siteId]);
  const site = siteRes.rows[0];
  if (!site?.site_url) return { ok: false, error: "Site URL not configured." };
  if (!site.report_token) return { ok: false, error: "No report token stored for this environment." };

  const res = await fetch(hostReportUrl(site.site_url, "/purge-cache"), {
    method: "POST",
    headers: { "X-Pulse-Host-Token": site.report_token, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return { ok: false, error: `purge-cache HTTP ${res.status}` };
  const data = await res.json();
  return { ok: true, result: data };
}
