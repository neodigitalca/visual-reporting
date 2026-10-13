#!/usr/bin/env node
/**
 * Scan desktop-app paths for monolith line counts. Writes docs/audits/monolith-inventory.json
 * Run: node scripts/generate-monolith-inventory.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS_DIR = path.join(root, "scripts");
const SCAN_ROOTS = ["scripts", "src/lib", "src/components"];
const EXT = new Set([".ts", ".tsx", ".mjs", ".cjs", ".js", ".py"]);

/** Any file under scripts/ with >=500 lines (all extensions). See audit-scripts-tree.mjs */
function scriptsTree500Plus() {
  /** @type {Array<{ path: string, lines: number, ext: string }>} */
  const over = [];
  function walkScripts(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules") continue;
        walkScripts(full);
        continue;
      }
      const lines = lineCount(full);
      if (lines < 500) continue;
      over.push({
        path: path.relative(root, full).split(path.sep).join("/"),
        lines,
        ext: path.extname(ent.name) || "(none)",
      });
    }
  }
  walkScripts(SCRIPTS_DIR);
  over.sort((a, b) => b.lines - a.lines);
  return over;
}

function lineCount(filePath) {
  const buf = fs.readFileSync(filePath, "utf8");
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === "\n") n++;
  if (buf.length > 0 && !buf.endsWith("\n")) n++;
  return n;
}

function clusterFor(rel) {
  if (rel.startsWith("scripts/research/chatgpt-audit/")) return "scripts-research-chatgpt";
  if (rel.startsWith("scripts/research/local-dominator/")) return "scripts-research-local-dominator";
  if (rel.startsWith("scripts/research/browser-automation/")) return "scripts-browser-automation";
  if (rel.startsWith("scripts/")) return "scripts-other";
  if (rel.startsWith("src/lib/overview/")) return "lib-overview-harness";
  if (rel.startsWith("src/lib/workflow/")) return "lib-workflow";
  if (rel.startsWith("src/lib/bulk/") || rel === "src/lib/bulk-auto-generate.ts") return "lib-bulk";
  if (rel.startsWith("src/lib/content-generation/")) return "lib-content-generation";
  if (rel.startsWith("src/lib/gsc-reporting/")) return "lib-gsc-reporting";
  if (rel.startsWith("src/lib/")) return "lib-other";
  if (rel.startsWith("src/components/research/")) return "components-research";
  if (rel.startsWith("src/components/integrations/")) return "components-integrations";
  if (rel.startsWith("src/components/manager/")) return "components-manager";
  if (rel.startsWith("src/components/")) return "components-other";
  return "other";
}

function walk(dir, baseArea, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === "dist") continue;
      walk(full, baseArea, out);
      continue;
    }
    const ext = path.extname(name.name);
    if (!EXT.has(ext)) continue;
    const lines = lineCount(full);
    if (lines < 300) continue;
    const rel = path.relative(root, full).split(path.sep).join("/");
    out.push({
      path: rel,
      lines,
      tier: lines >= 500 ? "monolith" : "watch",
      cluster: clusterFor(rel),
      area: baseArea,
    });
  }
}

const files = [];
for (const area of SCAN_ROOTS) {
  walk(path.join(root, area), area.replace(/\\/g, "/"), files);
}
files.sort((a, b) => b.lines - a.lines);

const summary = {
  monolith: files.filter((f) => f.tier === "monolith").length,
  watch: files.filter((f) => f.tier === "watch").length,
  byArea: Object.fromEntries(
    SCAN_ROOTS.map((a) => [
      a,
      {
        monolith: files.filter((f) => f.area === a && f.tier === "monolith").length,
        watch: files.filter((f) => f.area === a && f.tier === "watch").length,
      },
    ]),
  ),
};

const scriptsTree500 = scriptsTree500Plus();

const payload = {
  generatedAt: new Date().toISOString(),
  repoRoot: root.replace(/\\/g, "/"),
  scope: "desktop-app",
  excludes: ["wordpress-plugins"],
  thresholds: { monolith: 500, watch: 300 },
  scriptsTree500Plus: scriptsTree500,
  summary: {
    ...summary,
    scriptsTree500Count: scriptsTree500.length,
  },
  files,
};

const outDir = path.join(root, "docs/audits");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "monolith-inventory.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${files.length} entries (${summary.monolith} monoliths)`);
