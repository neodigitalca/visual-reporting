import crypto from "node:crypto";
import { getPool } from "../db/pool.mjs";
import { getOwnerId, createDockerService, addCustomDomain, deleteService } from "../render-client.mjs";

function payload(job) {
  const p = job.payload_json;
  return typeof p === "string" ? JSON.parse(p) : p || {};
}

async function fail(pool, siteId, message) {
  await pool.query(`UPDATE hosted_sites SET status = 'failed', status_message = $2, updated_at = NOW() WHERE id = $1`, [
    siteId,
    message,
  ]);
  return { ok: false, error: message };
}

/**
 * Creates a MariaDB private service + WordPress web service (with persistent disk)
 * on Render for one environment, then records service ids and URLs.
 */
export async function runProvisionJob(job) {
  const siteId = job.site_id || payload(job).siteId;
  const pool = getPool();
  const siteRes = await pool.query(`SELECT * FROM hosted_sites WHERE id = $1`, [siteId]);
  const site = siteRes.rows[0];
  if (!site) return { ok: false, error: "Site not found." };
  if (site.render_service_id) return { ok: false, error: "Environment is already provisioned." };

  const adminEmail = (process.env.PULSE_HOST_ADMIN_EMAIL || "").trim();
  if (!adminEmail) return fail(pool, siteId, "PULSE_HOST_ADMIN_EMAIL is not set on pulse-host-api.");

  const dbName = `pulse-host-db-${site.slug}`;
  const wpName = `pulse-host-wp-${site.slug}`;
  const mariaPass = crypto.randomBytes(16).toString("hex");
  const wpAdminPass = crypto.randomBytes(16).toString("hex");
  const region = site.region || "ohio";

  let ownerId;
  try {
    ownerId = await getOwnerId();
  } catch (err) {
    return fail(pool, siteId, err instanceof Error ? err.message : String(err));
  }

  // Retry after a partial failure: the earlier DB service has a password we never stored, so replace it.
  if (site.render_db_service_id) {
    try {
      await deleteService(site.render_db_service_id);
    } catch (err) {
      return fail(pool, siteId, `Could not remove previous MariaDB service: ${err instanceof Error ? err.message : String(err)}`);
    }
    await pool.query(`UPDATE hosted_sites SET render_db_service_id = NULL, updated_at = NOW() WHERE id = $1`, [siteId]);
  }

  let dbSvc;
  try {
    dbSvc = await createDockerService(ownerId, {
      type: "private_service",
      name: dbName,
      dockerfilePath: "./hosting/docker/mariadb/Dockerfile",
      plan: "starter",
      region,
      disk: { name: `${dbName}-disk`, mountPath: "/var/lib/mysql", sizeGB: site.disk_gb || 10 },
      envVars: [
        { key: "MARIADB_ROOT_PASSWORD", value: mariaPass },
        { key: "MARIADB_PASSWORD", value: mariaPass },
        { key: "MARIADB_USER", value: "wordpress" },
        { key: "MARIADB_DATABASE", value: "wordpress" },
      ],
    });
  } catch (err) {
    return fail(pool, siteId, `MariaDB service: ${err instanceof Error ? err.message : String(err)}`);
  }
  await pool.query(`UPDATE hosted_sites SET render_db_service_id = $2, updated_at = NOW() WHERE id = $1`, [siteId, dbSvc.id]);

  const onrenderUrl = `https://${wpName}.onrender.com`;
  const siteUrl = site.primary_domain ? `https://${site.primary_domain}` : onrenderUrl;

  let wpSvc;
  try {
    wpSvc = await createDockerService(ownerId, {
      type: "web_service",
      name: wpName,
      dockerfilePath: "./hosting/docker/wordpress/Dockerfile",
      plan: "standard",
      region,
      disk: { name: `${wpName}-disk`, mountPath: "/var/www/html", sizeGB: site.disk_gb || 10 },
      envVars: [
        { key: "WORDPRESS_DB_HOST", value: `${dbName}:3306` },
        { key: "WORDPRESS_DB_USER", value: "wordpress" },
        { key: "WORDPRESS_DB_PASSWORD", value: mariaPass },
        { key: "WORDPRESS_DB_NAME", value: "wordpress" },
        { key: "WORDPRESS_SITE_URL", value: siteUrl },
        { key: "WORDPRESS_SITE_TITLE", value: site.display_name || site.slug },
        { key: "WORDPRESS_ADMIN_USER", value: "admin" },
        { key: "WORDPRESS_ADMIN_PASSWORD", value: wpAdminPass },
        { key: "WORDPRESS_ADMIN_EMAIL", value: adminEmail },
        { key: "PULSE_HOST_REPORT_TOKEN", value: site.report_token || "" },
      ],
    });
  } catch (err) {
    return fail(pool, siteId, `WordPress service: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (site.primary_domain) {
    try {
      await addCustomDomain(wpSvc.id, site.primary_domain);
    } catch (err) {
      await pool.query(`UPDATE hosted_sites SET status_message = $2 WHERE id = $1`, [
        siteId,
        `Custom domain not added: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    }
  }

  const resolvedUrl = wpSvc.serviceDetails?.url || onrenderUrl;
  const finalSiteUrl = site.primary_domain ? siteUrl : resolvedUrl;
  await pool.query(
    `UPDATE hosted_sites SET render_service_id = $2, site_url = $3, wp_admin_url = $4, status = 'active', updated_at = NOW()
     WHERE id = $1`,
    [siteId, wpSvc.id, finalSiteUrl, `${finalSiteUrl.replace(/\/$/, "")}/wp-admin/`],
  );

  return {
    ok: true,
    renderServiceId: wpSvc.id,
    renderDbServiceId: dbSvc.id,
    siteUrl: finalSiteUrl,
    wpAdminUser: "admin",
    wpAdminPassword: wpAdminPass,
  };
}
