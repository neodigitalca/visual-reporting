#!/usr/bin/env node
/**
 * Store GitHub CLI credentials from .env.local PAT (not sean796 keyring).
 * GitHub password from master sheet cannot be used; GH_TOKEN must be a PAT.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

function parseEnvFile(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(t.slice(0, eq).trim(), val);
  }
  return map;
}

if (!fs.existsSync(ENV_LOCAL)) {
  console.error("Missing .env.local. Run: node scripts/sync-neo-master-env.mjs <Neo Passwords.csv>");
  process.exit(1);
}

const envMap = parseEnvFile(fs.readFileSync(ENV_LOCAL, "utf8"));
const token =
  envMap.get("GH_TOKEN") || envMap.get("GITHUB_TOKEN") || envMap.get("NEO_GITHUB_PAT") || "";
const githubUser = envMap.get("NEO_GITHUB_USERNAME") || envMap.get("NEO_MASTER_GITHUB_USERNAME") || "";

if (!token.trim()) {
  console.error(
    "No GH_TOKEN, GITHUB_TOKEN, or NEO_GITHUB_PAT in .env.local. Add a PAT for matt@neodigital.ca (org repos).",
  );
  process.exit(1);
}

console.log(`[gh-auth-from-env] master sheet GitHub user: ${githubUser || "(unset)"}`);

const cleanEnv = { ...process.env };
delete cleanEnv.GH_TOKEN;
delete cleanEnv.GITHUB_TOKEN;

const login = spawnSync("gh", ["auth", "login", "--with-token", "-h", "github.com"], {
  input: token,
  encoding: "utf8",
  env: cleanEnv,
  cwd: ROOT,
});
if (login.status !== 0) {
  process.stderr.write(login.stderr || login.stdout || "gh auth login failed\n");
  const who = spawnSync("gh", ["api", "user", "--jq", ".login"], {
    encoding: "utf8",
    env: { ...cleanEnv, GH_TOKEN: token },
  });
  const loginName = (who.stdout || "").trim();
  if (loginName) {
    console.error(
      `[gh-auth-from-env] GH_TOKEN is valid for GitHub user "${loginName}" but gh CLI wants a PAT with read:org to save to keyring.`,
    );
  }
  console.error(
    "[gh-auth-from-env] Master sheet password is in NEO_GITHUB_PASSWORD; git/gh need a PAT in GH_TOKEN (classic: repo + read:org).",
  );
  process.exit(login.status || 1);
}

const status = spawnSync("gh", ["auth", "status", "-h", "github.com"], {
  encoding: "utf8",
  env: cleanEnv,
});
process.stdout.write(status.stdout || "");
process.stderr.write(status.stderr || "");
process.exit(status.status === 0 ? 0 : status.status || 1);
