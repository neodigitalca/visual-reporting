#!/usr/bin/env node
const kind = process.argv[2];
if (kind !== "backup" && kind !== "health") {
  console.error("Usage: node scripts/neo-host-cron-trigger.mjs backup|health");
  process.exit(1);
}
const base = (process.env.PULSE_HOST_API_BASE || process.env.NEO_HOST_API_BASE || "").replace(/\/$/, "");
const token = (process.env.PULSE_HOST_API_TOKEN || process.env.NEO_HOST_API_TOKEN || "").trim();
if (!base || !token) {
  console.error("PULSE_HOST_API_BASE and PULSE_HOST_API_TOKEN are required.");
  process.exit(1);
}
const res = await fetch(`${base}/internal/cron/${kind}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
const text = await res.text();
if (!res.ok) {
  console.error(text);
  process.exit(1);
}
console.log(text);
