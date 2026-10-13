import { useEffect, useState } from "react";

export const SITE_PROFILE_SECTIONS = ["overview", "plugins-themes", "backups", "users", "usage", "activity"] as const;
export type SiteProfileSection = (typeof SITE_PROFILE_SECTIONS)[number];

export const SITE_PROFILE_SECTION_LABEL: Record<SiteProfileSection, string> = {
  overview: "Overview",
  "plugins-themes": "Plugins and themes",
  backups: "Backups",
  users: "Users",
  usage: "Usage",
  activity: "Activity",
};

const SECTION_SET = new Set<string>(SITE_PROFILE_SECTIONS);
const ROOT = "pulse-host";

/** `#pulse-host` is the My Sites list; `#pulse-host/sites/<groupId>[/<envId>[/<section>]]` is a site profile. */
export type PulseHostRoute =
  | { view: "list" }
  | { view: "site"; groupId: string; envId: string | null; section: SiteProfileSection };

function hashBody(rawHash?: string): string {
  return (rawHash ?? (typeof window !== "undefined" ? window.location.hash : "")).replace(/^#/, "").trim();
}

export function isPulseHostHash(rawHash?: string): boolean {
  const raw = hashBody(rawHash);
  return raw === ROOT || raw.startsWith(`${ROOT}/`);
}

export function parsePulseHostRouteFromHash(rawHash?: string): PulseHostRoute {
  const parts = hashBody(rawHash).split("/").filter(Boolean);
  if (parts[0] !== ROOT || parts[1] !== "sites" || !parts[2]) return { view: "list" };
  const section = parts[4] && SECTION_SET.has(parts[4]) ? (parts[4] as SiteProfileSection) : "overview";
  return { view: "site", groupId: decodeURIComponent(parts[2]), envId: parts[3] ? decodeURIComponent(parts[3]) : null, section };
}

export function buildPulseHostHash(route: PulseHostRoute): string {
  if (route.view === "list") return ROOT;
  const base = `${ROOT}/sites/${encodeURIComponent(route.groupId)}`;
  if (!route.envId) return base;
  return `${base}/${encodeURIComponent(route.envId)}/${route.section}`;
}

export function setPulseHostHash(route: PulseHostRoute): void {
  const hash = buildPulseHostHash(route);
  if (window.location.hash.replace(/^#/, "") === hash) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function usePulseHostRoute(): PulseHostRoute {
  const [route, setRoute] = useState<PulseHostRoute>(() => parsePulseHostRouteFromHash());
  useEffect(() => {
    const onHash = () => setRoute(parsePulseHostRouteFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
