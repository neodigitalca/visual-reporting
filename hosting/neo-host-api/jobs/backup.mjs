import { getPool } from "../db/pool.mjs";

/** Records a backup job; durable export to Drive is phase 2 (URI placeholder). */
function payload(job) {
  const p = job.payload_json;
  return typeof p === "string" ? JSON.parse(p) : p || {};
}

export async function runBackupJob(job) {
  const siteId = job.site_id || payload(job).siteId;
  if (!siteId) {
    return { ok: false, error: "Missing site id for backup." };
  }
  const pool = getPool();
  const siteRes = await pool.query(`SELECT slug, primary_domain FROM hosted_sites WHERE id = $1`, [siteId]);
  const site = siteRes.rows[0];
  if (!site) {
    return { ok: false, error: "Site not found." };
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uri = `neo-host-backups://${site.slug}/${stamp}.tar.gz`;
  const inserted = await pool.query(
    `INSERT INTO hosted_backups (site_id, storage_uri, size_bytes, status)
     VALUES ($1, $2, 0, 'completed') RETURNING id`,
    [siteId, uri],
  );
  return {
    ok: true,
    backupId: inserted.rows[0].id,
    storageUri: uri,
    note: "Metadata recorded; configure export worker for binary archive upload.",
  };
}
