import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "neo-pulse-wp");
const main = readFileSync(join(dir, "neo-pulse-wp.php"), "utf8");
const requires = [...main.matchAll(/require_once\s+NEO_PULSE_WP_PLUGIN_DIR\s+\.\s+'([^']+)'/g)].map(
  (m) => m[1]
);

const base = "https://kwbllp.com/wp-content/plugins/neo-pulse-wp/";
let missing = 0;
for (const rel of requires) {
  const url = base + rel;
  const res = await fetch(url, { method: "HEAD" });
  if (res.status === 404) {
    console.log("MISSING", rel);
    missing++;
  }
}
console.log("checked", requires.length, "missing", missing);
