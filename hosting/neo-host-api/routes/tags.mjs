import { getPool } from "../db/pool.mjs";
import { ensureTenant } from "../db/tenants.mjs";
import { sendJson } from "../lib/http.mjs";

function requireWrite(res, auth) {
  if (auth.hostingWrite) return true;
  sendJson(res, 403, { ok: false, error: "Hosting admin required." });
  return false;
}

/**
 * GET    tags                 list
 * POST   tags                 { name }
 * POST   tags/assign          { groupId, tagIds: number[] } replaces the group's tag set
 * PATCH  tags/:id             { name }
 * DELETE tags/:id
 */
export async function handleTagsRoute(req, res, subpath, method, body, auth) {
  const parts = subpath.split("/").filter(Boolean);
  const pool = getPool();
  const tenantId = await ensureTenant(auth.teamId);

  if (parts.length === 0 && method === "GET") {
    const result = await pool.query(`SELECT id, name FROM hosted_tags WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]);
    sendJson(res, 200, { ok: true, tags: result.rows });
    return;
  }

  if (!requireWrite(res, auth)) return;

  if (parts.length === 0 && method === "POST") {
    const name = String(body.name || "").trim();
    if (!name) {
      sendJson(res, 400, { ok: false, error: "name is required." });
      return;
    }
    const inserted = await pool.query(
      `INSERT INTO hosted_tags (tenant_id, name) VALUES ($1, $2) ON CONFLICT (tenant_id, name) DO NOTHING RETURNING id, name`,
      [tenantId, name],
    );
    if (!inserted.rows[0]) {
      sendJson(res, 409, { ok: false, error: "Tag already exists." });
      return;
    }
    sendJson(res, 201, { ok: true, tag: inserted.rows[0] });
    return;
  }

  if (parts[0] === "assign" && method === "POST") {
    const groupId = String(body.groupId || "");
    const tagIds = Array.isArray(body.tagIds) ? body.tagIds.map(Number).filter((n) => Number.isInteger(n)) : [];
    const group = await pool.query(`SELECT id FROM hosted_site_groups WHERE id = $1 AND tenant_id = $2`, [groupId, tenantId]);
    if (!group.rows[0]) {
      sendJson(res, 404, { ok: false, error: "Site group not found." });
      return;
    }
    await pool.query(`DELETE FROM hosted_group_tags WHERE group_id = $1`, [groupId]);
    if (tagIds.length) {
      await pool.query(
        `INSERT INTO hosted_group_tags (group_id, tag_id)
         SELECT $1, t.id FROM hosted_tags t WHERE t.tenant_id = $2 AND t.id = ANY($3::int[])`,
        [groupId, tenantId, tagIds],
      );
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  const tagId = Number(parts[0]);
  if (!Number.isInteger(tagId)) {
    sendJson(res, 404, { ok: false, error: "Not found." });
    return;
  }

  if (method === "PATCH") {
    const name = String(body.name || "").trim();
    if (!name) {
      sendJson(res, 400, { ok: false, error: "name is required." });
      return;
    }
    const exists = await pool.query(`SELECT id FROM hosted_tags WHERE tenant_id = $1 AND name = $2 AND id <> $3`, [
      tenantId,
      name,
      tagId,
    ]);
    if (exists.rows[0]) {
      sendJson(res, 409, { ok: false, error: "Tag already exists." });
      return;
    }
    const updated = await pool.query(
      `UPDATE hosted_tags SET name = $3 WHERE id = $1 AND tenant_id = $2 RETURNING id, name`,
      [tagId, tenantId, name],
    );
    if (!updated.rows[0]) {
      sendJson(res, 404, { ok: false, error: "Tag not found." });
      return;
    }
    sendJson(res, 200, { ok: true, tag: updated.rows[0] });
    return;
  }

  if (method === "DELETE") {
    await pool.query(`DELETE FROM hosted_tags WHERE id = $1 AND tenant_id = $2`, [tagId, tenantId]);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found." });
}
