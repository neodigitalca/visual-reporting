const user = "sean@neodigital.ca";
const pass = process.env.KWB_APP_PASSWORD || "";
const auth = Buffer.from(`${user}:${pass.replace(/\s+/g, "")}`).toString("base64");

async function req(method, path, body) {
  const res = await fetch(`https://kwbllp.com/wp-json${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const plugin = "neo-pulse-wp/neo-pulse-wp";
const ping = await req("POST", "/neo-pulse/v1/tools/execute", {
  tool: "wp_ping",
  params: {},
});
console.log("ping", ping.status, JSON.stringify(ping.json).slice(0, 300));

const plugins = await req("GET", "/wp/v2/plugins?search=neo-pulse");
console.log("plugins", plugins.status, JSON.stringify(plugins.json).slice(0, 400));

const toggle = await req("PUT", `/wp/v2/plugins/${encodeURIComponent(plugin)}`, {
  status: "active",
});
console.log("activate", toggle.status, JSON.stringify(toggle.json).slice(0, 400));

const admin = await fetch("https://kwbllp.com/wp-admin/plugins.php", {
  headers: { Authorization: `Basic ${auth}` },
  redirect: "manual",
});
console.log("admin_plugins", admin.status, admin.headers.get("location") || "");
