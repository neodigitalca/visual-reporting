import { getPool } from "./pool.mjs";

export async function ensureTenant(pulseTeamId, name = "") {
  const pool = getPool();
  const existing = await pool.query(`SELECT id FROM hosting_tenants WHERE pulse_team_id = $1`, [pulseTeamId]);
  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }
  const inserted = await pool.query(
    `INSERT INTO hosting_tenants (pulse_team_id, name) VALUES ($1, $2) RETURNING id`,
    [pulseTeamId, name || `Team ${pulseTeamId}`],
  );
  return inserted.rows[0].id;
}

export async function auditLog({ tenantId, actorUserId, action, payload }) {
  await getPool().query(
    `INSERT INTO hosting_audit_log (tenant_id, actor_user_id, action, payload_json) VALUES ($1, $2, $3, $4)`,
    [tenantId, actorUserId ?? null, action, JSON.stringify(payload ?? {})],
  );
}

function jsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
}

function bigint(value) {
  return value === null || value === undefined ? null : Number(value);
}

/** Environment stats row (hosted_env_stats) joined onto a hosted_sites row. */
export function mapStatsRow(row) {
  if (!row.collected_at && !row.stats_error) return null;
  return {
    phpVersion: row.php_version ?? null,
    wpVersion: row.wp_version ?? null,
    wpUpdateAvailable: row.wp_update_available ?? null,
    storageBytes: bigint(row.storage_bytes),
    bandwidthBytes30d: bigint(row.bandwidth_bytes_30d),
    visits30d: bigint(row.visits_30d),
    plugins: jsonArray(row.plugins_json),
    themes: jsonArray(row.themes_json),
    collectedAt: row.collected_at ?? null,
    errorMessage: row.stats_error ?? null,
  };
}

export function mapSiteRow(row) {
  return {
    id: row.id,
    groupId: row.group_id ?? null,
    slug: row.slug,
    displayName: row.display_name,
    environment: row.environment,
    primaryDomain: row.primary_domain,
    region: row.region,
    renderServiceId: row.render_service_id,
    renderDbServiceId: row.render_db_service_id,
    diskGb: row.disk_gb,
    status: row.status,
    statusMessage: row.status_message,
    pulseIntegrationSiteId: row.pulse_integration_site_id,
    wpAdminUrl: row.wp_admin_url,
    siteUrl: row.site_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: mapStatsRow(row),
  };
}

export function mapGroupRow(row, environments, tags) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
    environments,
  };
}

/** SQL fragment: hosted_sites joined with hosted_env_stats (aliased for mapSiteRow). */
export const SITE_WITH_STATS_SQL = `
  SELECT s.*, st.php_version, st.wp_version, st.wp_update_available, st.storage_bytes,
         st.bandwidth_bytes_30d, st.visits_30d, st.plugins_json, st.themes_json,
         st.collected_at, st.error_message AS stats_error
  FROM hosted_sites s
  LEFT JOIN hosted_env_stats st ON st.site_id = s.id`;
