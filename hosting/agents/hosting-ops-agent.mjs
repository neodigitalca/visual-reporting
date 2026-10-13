import { getPool } from "../neo-host-api/db/pool.mjs";
import { mapSiteRow } from "../neo-host-api/db/tenants.mjs";
import { fetchUsage30d, listServiceLogs, triggerServiceDeploy } from "../neo-host-api/render-client.mjs";
import { HOSTING_OPS_RESPONSE_SCHEMA, parseHostingOpsResponse } from "./hosting-ops-schema.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = (process.env.NEO_HOST_OPS_MODEL || "google/gemini-2.5-flash").trim();

function jobPayload(job) {
  const p = job.payload_json;
  return typeof p === "string" ? JSON.parse(p) : p || {};
}

async function listHostedSitesForJob(siteId) {
  const pool = getPool();
  if (siteId) {
    const one = await pool.query(`SELECT * FROM hosted_sites WHERE id = $1`, [siteId]);
    return one.rows.map(mapSiteRow);
  }
  const all = await pool.query(`SELECT * FROM hosted_sites ORDER BY display_name ASC LIMIT 20`);
  return all.rows.map(mapSiteRow);
}

async function getSiteHealth(site) {
  const url = site.siteUrl ? `${site.siteUrl.replace(/\/$/, "")}/wp-json/` : null;
  let httpStatus = null;
  if (url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    httpStatus = res.status;
  }
  let metrics = null;
  if (site.renderServiceId) {
    try {
      metrics = await fetchUsage30d(site.renderServiceId);
    } catch {
      metrics = null;
    }
  }
  return { httpStatus, metrics, checkedUrl: url };
}

async function summarizeRenderLogs(serviceId) {
  const logs = await listServiceLogs(serviceId, { limit: 20 });
  return logs.slice(0, 20);
}

export async function runOpsAgentJob(job) {
  const payload = jobPayload(job);
  const siteId = payload.siteId || job.site_id;
  const sites = await listHostedSitesForJob(siteId);
  const site = sites[0];
  if (!site) {
    return { ok: false, error: "No hosted site for ops agent." };
  }

  const health = await getSiteHealth(site);
  let logLines = [];
  if (site.renderServiceId) {
    try {
      logLines = await summarizeRenderLogs(site.renderServiceId);
    } catch (err) {
      logLines = [{ error: err instanceof Error ? err.message : String(err) }];
    }
  }

  if (payload.execute && payload.confirmed !== true) {
    return { ok: false, error: "execute requires confirmed: true in job payload." };
  }

  if (payload.execute && payload.confirmed === true && site.renderServiceId) {
    const deployId = await triggerServiceDeploy(site.renderServiceId);
    return {
      ok: true,
      executed: true,
      action: "trigger_deploy",
      deployId,
      summary: `Triggered deploy for ${site.displayName}.`,
      severity: "info",
      recommended_actions: [],
      tools_used: ["trigger_deploy"],
    };
  }

  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || "").trim();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is required for ops agent." };
  }

  const system = `You are Pulse Host ops agent. Never invent Render service IDs. Use only IDs from the site context.
Return JSON matching the schema. recommended_actions must be safe; destructive actions must set requires_confirmation true.
Do not claim you executed an action unless execute mode is on.`;

  const userContent = JSON.stringify({
    site,
    health,
    logSample: logLines,
    userPrompt: payload.prompt || "",
    execute: Boolean(payload.execute),
  });

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hosting_ops_report",
          strict: true,
          schema: HOSTING_OPS_RESPONSE_SCHEMA,
        },
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}` };
  }
  const parsed = JSON.parse(text);
  const content = parsed?.choices?.[0]?.message?.content;
  const report = parseHostingOpsResponse(content);
  return { ok: true, executed: false, ...report };
}
