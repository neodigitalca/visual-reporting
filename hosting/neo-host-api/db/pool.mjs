import pg from "pg";

const { Pool } = pg;

/** @type {import("pg").Pool | null} */
let pool = null;

export function getPool() {
  const url = (
    process.env.PULSE_HOST_DB_URL ||
    process.env.NEO_HOST_DB_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
  if (!url) {
    throw new Error("PULSE_HOST_DB_URL or DATABASE_URL is required for pulse-host-api.");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url, ssl: url.includes("render.com") ? { rejectUnauthorized: false } : undefined });
  }
  return pool;
}

export async function runSchema() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const sql = fs.readFileSync(path.join(dir, "schema.sql"), "utf8");
  await getPool().query(sql);
}
