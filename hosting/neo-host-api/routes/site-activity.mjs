import { getPool } from "../db/pool.mjs";
import { sendJson } from "../lib/http.mjs";

const LIMIT = 50;

/** GET sites/:id/activity: recent backups, deploys, jobs, and audit entries for one environment. */
export async function handleSiteActivityRoute(res, site, method) {
  if (method !== "GET") {
    sendJson(res, 404, { ok: false, error: "Not found." });
    return;
  }
  const pool = getPool();
  const [backups, deploys, jobs, audit] = await Promise.all([
    pool.query(
      `SELECT id, storage_uri, size_bytes, status, error_message, created_at
       FROM hosted_backups WHERE site_id = $1 ORDER BY created_at DESC LIMIT ${LIMIT}`,
      [site.id],
    ),
    pool.query(
      `SELECT id, render_deploy_id, git_commit, status, created_at
       FROM hosted_deploys WHERE site_id = $1 ORDER BY created_at DESC LIMIT ${LIMIT}`,
      [site.id],
    ),
    pool.query(
      `SELECT id, job_type, status, error_message, created_at, updated_at
       FROM hosting_jobs WHERE site_id = $1 ORDER BY created_at DESC LIMIT ${LIMIT}`,
      [site.id],
    ),
    pool.query(
      `SELECT id, actor_user_id, action, payload_json, created_at
       FROM hosting_audit_log WHERE payload_json->>'siteId' = $1 ORDER BY created_at DESC LIMIT ${LIMIT}`,
      [site.id],
    ),
  ]);
  sendJson(res, 200, {
    ok: true,
    backups: backups.rows.map((r) => ({
      id: r.id,
      storageUri: r.storage_uri,
      sizeBytes: Number(r.size_bytes),
      status: r.status,
      errorMessage: r.error_message,
      createdAt: r.created_at,
    })),
    deploys: deploys.rows.map((r) => ({
      id: r.id,
      renderDeployId: r.render_deploy_id,
      gitCommit: r.git_commit,
      status: r.status,
      createdAt: r.created_at,
    })),
    jobs: jobs.rows.map((r) => ({
      id: r.id,
      jobType: r.job_type,
      status: r.status,
      errorMessage: r.error_message,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    audit: audit.rows.map((r) => ({
      id: r.id,
      actorUserId: r.actor_user_id === null ? null : Number(r.actor_user_id),
      action: r.action,
      payload: r.payload_json,
      createdAt: r.created_at,
    })),
  });
}
