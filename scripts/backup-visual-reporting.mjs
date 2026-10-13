#!/usr/bin/env node
/**
 * Push the Neo Pulse repo (Google-Ads / pulse) to github.com/neodigitalca/visual-reporting.
 *
 * Usage (from repo root):
 *   node scripts/backup-visual-reporting.mjs
 *   node scripts/backup-visual-reporting.mjs --skip-push
 *
 * Auth: matt@neodigital.ca via .env.local (NEO_GITHUB_USERNAME + GH_TOKEN / NEO_GITHUB_PAT).
 * GitHub account passwords are not used for git push; a PAT is required.
 *
 * Env:
 *   VISUAL_REPORTING_REMOTE  Default: https://github.com/neodigitalca/visual-reporting.git
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadRepoEnv,
  githubPushToken,
  githubAuthUsername,
  withGitHubTokenRemote,
} from "./load-repo-env.mjs";

loadRepoEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REMOTE_NAME = "visual-reporting";
const DEFAULT_REMOTE = "https://github.com/neodigitalca/visual-reporting.git";
const REMOTE_URL = process.env.VISUAL_REPORTING_REMOTE || DEFAULT_REMOTE;

const skipPush = process.argv.includes("--skip-push");

function runGit(cwd, gitArgs, { allowFail = false, env = process.env } = {}) {
  const r = spawnSync("git", gitArgs, { cwd, encoding: "utf8", env });
  if (r.status !== 0 && !allowFail) {
    const msg = (r.stderr || r.stdout || "").trim() || `git ${gitArgs.join(" ")} failed`;
    throw new Error(msg);
  }
  return (r.stdout || "").trim();
}

function ensureRemote() {
  const remotes = runGit(REPO_ROOT, ["remote"]);
  if (!remotes.split(/\r?\n/).includes(REMOTE_NAME)) {
    runGit(REPO_ROOT, ["remote", "add", REMOTE_NAME, REMOTE_URL]);
    console.log(`[backup-visual-reporting] added remote ${REMOTE_NAME}`);
    return;
  }
  const url = runGit(REPO_ROOT, ["remote", "get-url", REMOTE_NAME], { allowFail: true });
  if (url && url !== REMOTE_URL && !url.includes("@github.com")) {
    runGit(REPO_ROOT, ["remote", "set-url", REMOTE_NAME, REMOTE_URL]);
    console.log(`[backup-visual-reporting] updated ${REMOTE_NAME} URL`);
  }
}

function pushToVisualReporting() {
  const token = githubPushToken();
  const user = githubAuthUsername();
  if (!token.trim()) {
    throw new Error(
      "No GH_TOKEN, GITHUB_TOKEN, or NEO_GITHUB_PAT in .env.local. Add a GitHub PAT for matt@neodigital.ca.",
    );
  }

  console.log(`[backup-visual-reporting] GitHub user: ${user || "(unset)"}`);

  const authRemote = withGitHubTokenRemote(REMOTE_URL, token, user);
  runGit(REPO_ROOT, ["remote", "set-url", REMOTE_NAME, authRemote]);
  try {
    const branch = runGit(REPO_ROOT, ["rev-parse", "--abbrev-ref", "HEAD"]);
    const head = runGit(REPO_ROOT, ["rev-parse", "--short", "HEAD"]);
    console.log(`[backup-visual-reporting] pushing ${branch} @ ${head} -> ${REMOTE_NAME}`);
    runGit(REPO_ROOT, ["push", "-u", REMOTE_NAME, branch]);
    runGit(REPO_ROOT, ["push", REMOTE_NAME, "--tags"], { allowFail: true });
    console.log(`[backup-visual-reporting] pushed to ${DEFAULT_REMOTE}`);
  } finally {
    runGit(REPO_ROOT, ["remote", "set-url", REMOTE_NAME, REMOTE_URL], { allowFail: true });
  }
}

function main() {
  console.log(`[backup-visual-reporting] source: ${REPO_ROOT}`);
  ensureRemote();

  const dirty = runGit(REPO_ROOT, ["status", "--porcelain"]);
  if (dirty) {
    console.warn(
      "[backup-visual-reporting] working tree has uncommitted changes; push includes committed history only.",
    );
  }

  const ahead = runGit(REPO_ROOT, ["rev-list", "--count", "origin/main..HEAD"], { allowFail: true });
  if (ahead && ahead !== "0") {
    console.log(`[backup-visual-reporting] ${ahead} commit(s) on HEAD not yet on origin (Google-Ads).`);
  }

  if (skipPush) {
    console.log("[backup-visual-reporting] --skip-push; remote configured only.");
    return;
  }

  pushToVisualReporting();
  console.log("[backup-visual-reporting] done");
}

try {
  main();
} catch (err) {
  console.error("[backup-visual-reporting] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
