import { sendJson } from "../lib/http.mjs";
import { cronAuth } from "../lib/auth.mjs";
import { runCronJob } from "./jobs.mjs";

export async function handleCronRoute(req, res, subpath, method) {
  const auth = cronAuth(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error });
    return;
  }
  if (method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }
  const kind = subpath.split("/").filter(Boolean)[0];
  if (kind === "backup") {
    const jobs = await runCronJob("backup");
    sendJson(res, 200, { ok: true, jobs: jobs.map((j) => j.id) });
    return;
  }
  if (kind === "health") {
    const jobs = await runCronJob("health");
    sendJson(res, 200, { ok: true, jobs: jobs.map((j) => j.id) });
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found." });
}
