import { formatDateTime } from "@/components/hosting/site-profile/site-profile-view-model";
import type { WordPressSite } from "../types";

export type PropertyConnectionTone = { label: string; dot: string; text: string };

export function propertyConnectionTone(site: WordPressSite): PropertyConnectionTone {
  if (site.enabled === false) return { label: "Disabled", dot: "bg-zinc-500", text: "text-muted-foreground" };
  switch (site.connectionStatus) {
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
