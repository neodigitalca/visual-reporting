#!/usr/bin/env node
/**
 * List every file under scripts/ with line count >= 500 (any extension).
 * Writes docs/audits/scripts-tree-500.json. Exit 1 if any remain.
 *
 * Run: node scripts/audit-scripts-tree.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THRESHOLD = 500;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptsRoot = path.join(root, "scripts");

function lineCount(filePath) {
  const buf = fs.readFileSync(filePath, "utf8");
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === "\n") n++;
  if (buf.length > 0 && !buf.endsWith("\n")) n++;
  return n;
}

/** @type {Array<{ path: string, lines: number, ext: string }>} */
const over = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue;
      walk(full);
      continue;
    }
    const lines = lineCount(full);
    if (lines < THRESHOLD) continue;
    const rel = path.relative(root, full).split(path.sep).join("/");
    over.push({ path: rel, lines, ext: path.extname(ent.name) || "(none)" });
  }
}

walk(scriptsRoot);
over.sort((a, b) => b.lines - a.lines);

const outDir = path.join(root, "docs/audits");
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  generatedAt: new Date().toISOString(),
  threshold: THRESHOLD,
  scriptsRoot: "scripts",
  count: over.length,
  files: over,
};
const outPath = path.join(outDir, "scripts-tree-500.json");
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`[audit-scripts-tree] ${over.length} file(s) >= ${THRESHOLD} lines under scripts/`);
for (const f of over) {
  console.log(`  ${f.lines}\t${f.path}`);
}
console.log(`[audit-scripts-tree] wrote ${outPath.replace(/\\/g, "/")}`);

if (over.length > 0) {
  process.exit(1);
}
