#!/usr/bin/env node
/**
 * Provision Pulse Host control plane + staging WordPress on Render.
 * Requires RENDER_API_KEY env or .secrets/render-api-key.txt
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const API = "https://api.render.com/v1";
const REPO = (process.env.NEO_HOST_RENDER_REPO || process.env.NEO_PULSE_RENDER_REPO || "https://github.com/neodigitalca/Google-Ads").trim();
const BRANCH = (process.env.NEO_HOST_RENDER_BRANCH || process.env.NEO_PULSE_RENDER_BRANCH || "main").trim();
const REGION = (process.env.NEO_HOST_RENDER_REGION || "ohio").trim();

function loadApiKey() {
  const fromEnv = (process.env.RENDER_API_KEY || "").trim();
  if (fromEnv) return fromEnv;
  const candidates = [
    path.join(REPO_ROOT, ".secrets", "render-api-key.txt"),
    path.join(os.homedir(), "Downloads", "RENDER API KEY.txt"),
    path.join(os.homedir(), "Downloads", "Render API.txt"),
    path.join(os.homedir(), ".render", "api-key.txt"),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8").trim();
  }
  throw new Error("Set RENDER_API_KEY or place key in .secrets/render-api-key.txt");
}

async function api(method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${loadApiKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${route} failed (${res.status}): ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function listServices() {
  const data = await api("GET", "/services?limit=100");
  const rows = Array.isArray(data) ? data : data?.services ?? [];
  return rows.map((row) => row.service ?? row).filter(Boolean);
}

async function getOwnerId() {
  const data = await api("GET", "/owners?limit=20");
  const list = Array.isArray(data) ? data.map((row) => row.owner ?? row) : data?.owners ?? [];
  const preferred = list.find((o) => o.type === "team") ?? list[0];
  if (!preferred?.id) throw new Error("No Render owner found.");
  return preferred.id;
}

async function ensureWebService(
  ownerId,
  { name, type = "web_service", dockerfilePath, dockerContext, plan = "standard", envVars = [], disk, buildPaths },
) {
  const existing = (await listServices()).find((s) => s.name === name);
  let svc = existing;
  if (svc?.id && svc.type !== type) {
    throw new Error(`${name} exists as ${svc.type} but must be ${type}. Delete it in Render and re-run.`);
  }
  const buildFilter = { paths: buildPaths, ignoredPaths: [] };
  if (!svc?.id) {
    const created = await api("POST", "/services", {
      type,
      name,
      ownerId,
      repo: REPO,
      branch: BRANCH,
      autoDeploy: "yes",
      buildFilter,
      serviceDetails: {
        runtime: "docker",
        plan,
        region: REGION,
        envSpecificDetails: { dockerfilePath, dockerContext },
        ...(disk ? { disk } : {}),
      },
    });
    svc = created.service ?? created;
    console.log(`[created] ${name}:`, svc.id);
  } else {
    console.log(`[skip] ${name} exists:`, svc.id);
    await api("PATCH", `/services/${svc.id}`, { repo: REPO, branch: BRANCH, buildFilter });
  }
  if (envVars.length) {
    await api(
      "PUT",
      `/services/${svc.id}/env-vars`,
      envVars.filter((v) => v.value?.trim()).map((v) => ({ key: v.key, value: String(v.value) })),
    );
  }
  return svc;
}

/** Render only serves a hostname it knows about; the Cloudflare CNAME to *.onrender.com is a manual step. */
async function ensureCustomDomain(serviceId, domain) {
  const existing = await api("GET", `/services/${serviceId}/custom-domains`);
  const rows = (Array.isArray(existing) ? existing : []).map((row) => row.customDomain ?? row);
  if (rows.some((d) => d.name === domain)) {
    console.log(`[skip] custom domain ${domain} exists`);
    return;
  }
  await api("POST", `/services/${serviceId}/custom-domains`, { name: domain });
  console.log(`[created] custom domain ${domain}; add CNAME ${domain} -> pulse-host-wp-staging.onrender.com`);
}

async function listPostgres() {
  const data = await api("GET", "/postgres?limit=50");
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => row.postgres ?? row).filter(Boolean);
}

async function ensurePostgres(ownerId) {
  const name = "pulse-host-control-db";
  const existing = (await listPostgres()).find((p) => p.name === name);
  if (existing?.id) {
    console.log(`[skip] ${name} exists:`, existing.id);
    return existing;
  }
  const created = await api("POST", "/postgres", {
    name,
    ownerId,
    region: REGION,
    plan: "basic_256mb",
    version: "16",
    databaseName: "pulse_host",
    user: "pulse_host",
  });
  const pg = created.postgres ?? created;
  console.log(`[created] ${name}:`, pg.id);
  return pg;
}

async function main() {
  const ownerId = await getOwnerId();
  const pg = await ensurePostgres(ownerId);
  const hostToken =
    process.env.PULSE_HOST_API_TOKEN || process.env.NEO_HOST_API_TOKEN || crypto.randomBytes(24).toString("hex");
  const mariaPass = process.env.NEO_HOST_MARIADB_PASSWORD || crypto.randomBytes(16).toString("hex");
  const wpAdminPass = process.env.NEO_HOST_WP_ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");

  // MariaDB must be a private service: Render only health-checks web services over HTTP.
  const dbSvc = await ensureWebService(ownerId, {
    name: "pulse-host-db-staging",
    type: "private_service",
    dockerfilePath: "./hosting/docker/mariadb/Dockerfile",
    dockerContext: ".",
    plan: "starter",
    disk: { name: "pulse-host-db-staging-disk", mountPath: "/var/lib/mysql", sizeGB: 10 },
    buildPaths: ["hosting/docker/mariadb/**"],
    envVars: [
      { key: "MARIADB_ROOT_PASSWORD", value: mariaPass },
      { key: "MARIADB_PASSWORD", value: mariaPass },
      { key: "MARIADB_USER", value: "wordpress" },
      { key: "MARIADB_DATABASE", value: "wordpress" },
    ],
  });

  const wpSvc = await ensureWebService(ownerId, {
    name: "pulse-host-wp-staging",
    dockerfilePath: "./hosting/docker/wordpress/Dockerfile",
    dockerContext: ".",
    plan: "standard",
    buildPaths: ["hosting/docker/wordpress/**", "wordpress-plugins/neo-pulse-wp/**", "wordpress-plugins/neo-pulse-app/**"],
    envVars: [
      { key: "WORDPRESS_DB_HOST", value: `${dbSvc.name}:${dbSvc.serviceDetails?.port || 3306}` },
      { key: "WORDPRESS_DB_USER", value: "wordpress" },
      { key: "WORDPRESS_DB_PASSWORD", value: mariaPass },
      { key: "WORDPRESS_DB_NAME", value: "wordpress" },
      { key: "WORDPRESS_SITE_URL", value: "https://host-staging.neodigital.ca" },
      { key: "WORDPRESS_SITE_TITLE", value: "Pulse Host Staging" },
      { key: "WORDPRESS_ADMIN_PASSWORD", value: wpAdminPass },
      { key: "WORDPRESS_ADMIN_USER", value: "admin" },
      { key: "WORDPRESS_ADMIN_EMAIL", value: "sean@neodigital.ca" },
    ],
  });

  await ensureCustomDomain(wpSvc.id, "host-staging.neodigital.ca");

  const dbUrl = (process.env.PULSE_HOST_DB_URL || process.env.NEO_HOST_DB_URL || pg?.connectionInfo?.internalConnectionString || "").trim();

  const apiSvc = await ensureWebService(ownerId, {
    name: "pulse-host-api",
    dockerfilePath: "./Dockerfile.neo-host-api",
    dockerContext: ".",
    plan: "standard",
    buildPaths: ["hosting/neo-host-api/**", "hosting/agents/**", "Dockerfile.neo-host-api", "package.json", "package-lock.json"],
    envVars: [
      { key: "PULSE_HOST_API_TOKEN", value: hostToken },
      { key: "NEO_HOST_API_TOKEN", value: hostToken },
      { key: "PULSE_HOST_DB_URL", value: dbUrl },
      { key: "NEO_HOST_DB_URL", value: dbUrl },
      { key: "RENDER_API_KEY", value: loadApiKey() },
      { key: "NEO_HOST_BOOTSTRAP_STAGING", value: "1" },
      { key: "NEO_HOST_STAGING_DOMAIN", value: "host-staging.neodigital.ca" },
      { key: "NEO_HOST_STAGING_WP_SERVICE_ID", value: wpSvc.id },
      { key: "NEO_HOST_STAGING_DB_SERVICE_ID", value: dbSvc.id },
      { key: "NEO_HOST_STAGING_SITE_URL", value: "https://host-staging.neodigital.ca" },
      { key: "NEO_HOST_DEFAULT_REGION", value: REGION },
    ],
  });

  console.log("\nPulse Host Render services:");
  console.log("- API:", apiSvc.serviceDetails?.url || `https://${apiSvc.name}.onrender.com`);
  console.log("- WP staging:", wpSvc.serviceDetails?.url || `https://${wpSvc.name}.onrender.com`);
  console.log("- MariaDB staging:", dbSvc.id);
  console.log("- Postgres control:", pg?.id || "(see dashboard for connection string)");
  console.log("- PULSE_HOST_API_TOKEN:", hostToken);
  console.log("- WP admin password (staging):", wpAdminPass);
  if (!dbUrl) {
    console.log("\nSet PULSE_HOST_DB_URL on pulse-host-api from Render Postgres connection string.");
  }
  console.log("\nSet on neodigital.ca (neo-pulse-app-secrets.php):");
  console.log("define('PULSE_HOST_API_BASE', '<API URL above>');");
  console.log("define('PULSE_HOST_API_TOKEN', '<token above>');");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
