import { formatDateTime } from "@/components/hosting/site-profile/site-profile-view-model";
import type { WordPressSite } from "../types";

export type PropertyConnectionTone = { label: string; dot: string; text: string };

export function propertyConnectionTone(site: WordPressSite): PropertyConnectionTone {
  if (site.enabled === false) return { label: "Disabled", dot: "bg-zinc-500", text: "text-muted-foreground" };
  return propertyConnectionStatusTone(site.connectionStatus);
}

/** WP Engine account ID present means the site is hosted on WP Engine; otherwise it runs on Pulse Host. */
export function propertyHostingLabel(site: WordPressSite): "WP Engine" | "Pulse Host" {
  return site.wpEngineAccountId?.trim() ? "WP Engine" : "Pulse Host";
}

export function propertyConnectionStatusTone(status: WordPressSite["connectionStatus"]): PropertyConnectionTone {
  switch (status) {
    case "success":
      return { label: "Connected", dot: "bg-primary", text: "text-primary" };
    case "failed":
      return { label: "Connection failed", dot: "bg-red-400", text: "text-red-300" };
    case "testing":
      return { label: "Testing", dot: "bg-sky-300", text: "text-sky-300" };
    default:
      return { label: "Not tested", dot: "bg-zinc-500", text: "text-muted-foreground" };
  }
}

export function formatLastTested(ts: number | undefined): string {
  return ts ? formatDateTime(new Date(ts).toISOString()) : "Not tested";
}

/** WP Engine install name: explicit field, else the first label of the site hostname (blindmagic.com -> blindmagic). */
export function propertyWpEngineInstall(site: WordPressSite): string {
  const explicit = site.wpEngineInstall?.trim() ?? "";
  if (explicit) return explicit;
  try {
    return new URL(site.siteUrl?.trim() ?? "").hostname.replace(/^www\./, "").split(".")[0] ?? "";
  } catch {
    return "";
  }
}

/** WP Engine portal "Launch WP Admin" URL when an account id is set; otherwise the site's own /wp-admin/. */
export function propertyWpAdminUrl(site: WordPressSite): string {
  const accountId = site.wpEngineAccountId?.trim() ?? "";
  const install = accountId ? propertyWpEngineInstall(site) : "";
  if (install && accountId) {
    return `https://my.wpengine.com/installs/${encodeURIComponent(install)}/launch_wp_admin?account_id=${encodeURIComponent(accountId)}`;
  }
  const siteUrl = site.siteUrl?.trim() ?? "";
  return siteUrl ? `${siteUrl.replace(/\/$/, "")}/wp-admin/` : "";
}
