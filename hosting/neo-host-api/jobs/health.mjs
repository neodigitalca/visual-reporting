import { getPool } from "../db/pool.mjs";
import { fetchUsage30d } from "../render-client.mjs";

function payload(job) {
  const p = job.payload_json;
  return typeof p === "string" ? JSON.parse(p) : p || {};
}

export function hostReportUrl(siteUrl, path = "") {
  return `${String(siteUrl).replace(/\/$/, "")}/wp-json/neo-pulse/v1/host-report${path}`;
}

async function fetchHostReport(site) {
  if (!site.report_token) {
    throw new Error("No report token stored for this environment.");
  }
  const res = await fetch(hostReportUrl(site.site_url), {
    headers: { "X-Pulse-Host-Token": site.report_token, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`host-report HTTP ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== "object" || typeof data.phpVersion !== "string") {
    throw new Error("host-report returned an unexpected shape.");
  }
  return data;
}

/**
 * Health + stats collection for one environment:
 * 1. wp-json reachability sets status active/degraded.
 * 2. neo-pulse-wp host-report supplies PHP/WP versions, storage, plugins, themes.
 * 3. Render metrics supply 30d bandwidth and HTTP request count.
 */
export async function runHealthJob(job) {
  const siteId = job.site_id || payload(job).siteId;
  const pool = getPool();
  const siteRes = await pool.query(`SELECT * FROM hosted_sites WHERE id = $1`, [siteId]);
  const site = siteRes.rows[0];
  if (!site?.site_url) {
    return { ok: false, error: "Site URL not configured." };
  }

  const url = `${String(site.site_url).replace(/\/$/, "")}/wp-json/`;
  let httpStatus = 0;
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15000) });
    httpStatus = res.status;
  } catch (err) {
    httpStatus = 0;
  }
  const reachable = httpStatus >= 200 && httpStatus < 400;
  await pool.query(`UPDATE hosted_sites SET status = $2, status_message = $3, updated_at = NOW() WHERE id = $1`, [
    siteId,
    reachable ? "active" : "degraded",
    reachable ? null : `wp-json HTTP ${httpStatus || "unreachable"}`,
  ]);

  const errors = [];
  let report = null;
  if (reachable) {
    try {
      report = await fetchHostReport(site);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  } else {
    errors.push(`wp-json HTTP ${httpStatus || "unreachable"}`);
  }

  let usage = null;
  if (site.render_service_id) {
    try {
      usage = await fetchUsage30d(site.render_service_id);
    } catch (err) {
      errors.push(`Render metrics: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    errors.push("No Render service id for metrics.");
  }

  await pool.query(
    `INSERT INTO hosted_env_stats (
       site_id, php_version, wp_version, wp_update_available, storage_bytes,
       bandwidth_bytes_30d, visits_30d, plugins_json, themes_json, collected_at, error_message
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10)
     ON CONFLICT (site_id) DO UPDATE SET
       php_version = COALESCE(EXCLUDED.php_version, hosted_env_stats.php_version),
       wp_version = COALESCE(EXCLUDED.wp_version, hosted_env_stats.wp_version),
       wp_update_available = CASE WHEN EXCLUDED.php_version IS NULL THEN hosted_env_stats.wp_update_available ELSE EXCLUDED.wp_update_available END,
       storage_bytes = COALESCE(EXCLUDED.storage_bytes, hosted_env_stats.storage_bytes),
       bandwidth_bytes_30d = COALESCE(EXCLUDED.bandwidth_bytes_30d, hosted_env_stats.bandwidth_bytes_30d),
       visits_30d = COALESCE(EXCLUDED.visits_30d, hosted_env_stats.visits_30d),
       plugins_json = CASE WHEN EXCLUDED.php_version IS NULL THEN hosted_env_stats.plugins_json ELSE EXCLUDED.plugins_json END,
       themes_json = CASE WHEN EXCLUDED.php_version IS NULL THEN hosted_env_stats.themes_json ELSE EXCLUDED.themes_json END,
       collected_at = NOW(),
       error_message = EXCLUDED.error_message`,
    [
      siteId,
      report?.phpVersion ?? null,
      report?.wpVersion ?? null,
      report?.wpUpdateAvailable ?? null,
      report?.storageBytes ?? null,
      usage?.bandwidthBytes ?? null,
      usage?.httpRequests ?? null,
      JSON.stringify(report?.plugins ?? []),
      JSON.stringify(report?.themes ?? []),
      errors.length ? errors.join("; ") : null,
    ],
  );

  return { ok: reachable && errors.length === 0, httpStatus, checkedUrl: url, errors };
}
