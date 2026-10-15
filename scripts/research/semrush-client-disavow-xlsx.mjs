/**
 * Build one .xlsx with a sheet per Semrush project (Backlink Audit clients).
 * Excludes Blind Magic and Lindsey Blinds.
 *
 * Uses Semrush Backlinks API (v4): low domain_score links as Google disavow candidates.
 * Semrush does not expose Backlink Audit "Disavow tab" via public API.
 */
import dotenv from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

dotenv.config();

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, "output");
const OUT_FILE = join(OUT_DIR, "semrush-client-disavow-lists.xlsx");

const EXCLUDE_NAMES = new Set(["blind magic", "lindsey blinds"]);
const DOMAIN_SCORE_MAX = 10;
const PAGE_SCORE_MAX = 25;
const LINKS_PAGE = 500;
const MAX_LINK_PAGES = 20;

const key = process.env.SEMRUSH_API_KEY || process.env.NEO_PULSE_APP_SEMRUSH_API_KEY;
if (!key) {
  console.error("Missing SEMRUSH_API_KEY");
  process.exit(1);
}

const auth = { Authorization: `Apikey ${key}` };

function normalizeTarget(domain) {
  let d = String(domain || "").trim().toLowerCase();
  if (d.startsWith("http://") || d.startsWith("https://")) {
    d = new URL(d).hostname;
  }
  if (d.startsWith("www.")) d = d.slice(4);
  return d;
}

function sheetName(projectName) {
  const base = String(projectName || "Client")
    .replace(/[\\/?*[\]:]/g, " ")
    .trim()
    .slice(0, 31);
  return base || "Client";
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

async function listProjects() {
  const url = `https://api.semrush.com/management/v1/projects?key=${encodeURIComponent(key)}&filter=all`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`list_projects HTTP ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("list_projects: unexpected response");
  return data;
}

async function fetchLowScoreLinks(targetDomain) {
  const scope = "ROOT_DOMAIN";
  const filter = `domain_score <= ${DOMAIN_SCORE_MAX} AND page_score <= ${PAGE_SCORE_MAX}`;
  const fields = [
    "source_url",
    "target_url",
    "anchor",
    "domain_score",
    "page_score",
    "is_nofollow",
    "external_links_count",
    "first_seen_at",
    "last_seen_at",
  ].join(",");

  const rows = [];
  for (let page = 0; page < MAX_LINK_PAGES; page += 1) {
    const offset = page * LINKS_PAGE;
    const qs = new URLSearchParams({
      url: targetDomain,
      scope,
      fields,
      filter,
      order_by: "domain_score",
      direction: "ASC",
      limit: String(LINKS_PAGE),
      offset: String(offset),
      format: "json",
    });
    const url = `https://api.semrush.com/apis/v4/backlinks/v1/links?${qs}`;
    const r = await fetch(url, { headers: auth });
    const text = await r.text();
    if (!r.ok) throw new Error(`links HTTP ${r.status}: ${text.slice(0, 200)}`);
    const json = JSON.parse(text);
    const batch = Array.isArray(json.data) ? json.data : [];
    rows.push(...batch);
    if (batch.length < LINKS_PAGE) break;
  }
  return rows;
}

function buildDisavowRows(links, projectName, domain) {
  const headerNote = `# ${projectName} (${domain}) — Semrush API low-score backlink candidates (domain_score<=${DOMAIN_SCORE_MAX}, page_score<=${PAGE_SCORE_MAX}). Review before uploading to Google.`;

  const byHost = new Map();
  for (const link of links) {
    const source = String(link.source_url || "").trim();
    const host = hostFromUrl(source);
    if (!host) continue;
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(link);
  }

  const disavowLines = [];
  const detailRows = [];

  for (const link of links) {
    const source = String(link.source_url || "").trim();
    detailRows.push({
      disavow_line: source,
      type: "url",
      source_url: source,
      target_url: String(link.target_url || ""),
      anchor: String(link.anchor || ""),
      domain_score: link.domain_score ?? "",
      page_score: link.page_score ?? "",
      nofollow: link.is_nofollow ?? "",
      external_links: link.external_links_count ?? "",
      first_seen: link.first_seen_at ?? "",
      last_seen: link.last_seen_at ?? "",
    });
  }

  for (const [host, hostLinks] of byHost) {
    const toxicish = hostLinks.filter(
      (l) => Number(l.domain_score) <= DOMAIN_SCORE_MAX && Number(l.page_score) <= PAGE_SCORE_MAX,
    );
    if (toxicish.length === 0) continue;
    const ratio = toxicish.length / hostLinks.length;
    if (ratio >= 0.8) {
      disavowLines.push({ disavow_line: `domain:${host}`, type: "domain", source_url: "", note: `${toxicish.length}/${hostLinks.length} low-score links` });
    }
  }

  const sheetRows = [
    { disavow_line: headerNote, type: "comment", source_url: "", target_url: "", anchor: "", domain_score: "", page_score: "", nofollow: "", external_links: "", first_seen: "", last_seen: "" },
    ...disavowLines.map((d) => ({
      disavow_line: d.disavow_line,
      type: d.type,
      source_url: d.source_url,
      target_url: "",
      anchor: d.note || "",
      domain_score: "",
      page_score: "",
      nofollow: "",
      external_links: "",
      first_seen: "",
      last_seen: "",
    })),
    { disavow_line: "", type: "", source_url: "", target_url: "", anchor: "", domain_score: "", page_score: "", nofollow: "", external_links: "", first_seen: "", last_seen: "" },
    ...detailRows,
  ];

  return sheetRows;
}

async function main() {
  const projects = await listProjects();
  const selected = projects.filter((p) => {
    const name = String(p.project_name || "").trim().toLowerCase();
    if (EXCLUDE_NAMES.has(name)) return false;
    const tools = Array.isArray(p.tools) ? p.tools : [];
    return tools.some((t) => String(t.tool || "").toLowerCase() === "backlinkaudit");
  });

  if (selected.length === 0) {
    console.error("No projects matched.");
    process.exit(1);
  }

  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  for (const project of selected) {
    const projectName = String(project.project_name || "Client");
    const domain = normalizeTarget(project.url || project.domain_unicode);
    console.log(`Fetching ${projectName} (${domain})…`);
    let links = [];
    try {
      links = await fetchLowScoreLinks(domain);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
      links = [];
    }
    console.log(`  ${links.length} low-score links`);

    let name = sheetName(projectName);
    let n = 2;
    while (usedNames.has(name)) {
      const suffix = ` ${n}`;
      name = sheetName(projectName).slice(0, 31 - suffix.length) + suffix;
      n += 1;
    }
    usedNames.add(name);

    const rows = buildDisavowRows(links, projectName, domain);
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: [
        "disavow_line",
        "type",
        "source_url",
        "target_url",
        "anchor",
        "domain_score",
        "page_score",
        "nofollow",
        "external_links",
        "first_seen",
        "last_seen",
      ],
    });
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  XLSX.writeFile(wb, OUT_FILE);
  writeFileSync(
    join(OUT_DIR, "README-disavow-export.txt"),
    [
      "semrush-client-disavow-lists.xlsx",
      "",
      "One worksheet per Semrush project with Backlink Audit enabled.",
      "Excluded: Blind Magic, Lindsey Blinds.",
      "",
      "Source: Semrush Backlinks API v4 (low domain_score / page_score links).",
      "This is NOT a direct export of the Backlink Audit > Disavow tab (no public API).",
      "Review every line before submitting to Google Disavow.",
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n"),
  );
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
