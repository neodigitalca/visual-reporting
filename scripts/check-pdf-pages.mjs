#!/usr/bin/env node
/**
 * Usage: node scripts/check-pdf-pages.mjs path/to/file.pdf [minPages]
 * Prints page count; exits 1 if below minPages (default 3).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const filePath = process.argv[2];
const minPages = Number(process.argv[3] ?? 3);

if (!filePath) {
  console.error("Usage: node scripts/check-pdf-pages.mjs <file.pdf> [minPages]");
  process.exit(1);
}

const buffer = readFileSync(filePath);
const data = await pdfParse(buffer);
const pages = data.numpages ?? 0;

console.log(`Pages: ${pages}`);

if (pages < minPages) {
  console.error(`Expected at least ${minPages} pages, got ${pages}.`);
  process.exit(1);
}
