import type { HostedEnvironmentKind, HostedSiteStatus } from "@/lib/hosting-api";

/** Flat dark surfaces for the Pulse Host My Sites page. */
export const MY_SITES_HEADER_BAND = "flex h-14 shrink-0 items-center justify-between gap-3";
export const MY_SITES_TABS_BAND = "flex h-10 shrink-0 items-end gap-1 border-b border-white/10";
export const MY_SITES_TOOLBAR_BAND = "flex h-10 shrink-0 items-center gap-2";
export const MY_SITES_STATUS_LINE = "flex h-6 shrink-0 items-center text-muted-foreground";

export const MY_SITES_CARD = "flex flex-col bg-zinc-900/60";
export const MY_SITES_CARD_HEADER = "flex h-12 shrink-0 items-center justify-between gap-3 bg-zinc-900 px-4";
export const MY_SITES_ENV_ROW = "flex min-h-[4.5rem] flex-col justify-center gap-1 px-4 py-2";

export const MY_SITES_TAB_BTN =
  "relative flex h-10 items-center gap-2 px-3 text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:absolute data-[active=true]:after:inset-x-0 data-[active=true]:after:bottom-0 data-[active=true]:after:h-0.5 data-[active=true]:after:bg-primary";
export const MY_SITES_COUNT_BADGE = "inline-flex h-5 min-w-[1.5rem] items-center justify-center bg-zinc-800 px-1.5 tabular-nums text-foreground";
export const MY_SITES_ATTENTION_BADGE = "inline-flex h-5 min-w-[1.5rem] items-center justify-center bg-red-500/20 px-1.5 tabular-nums text-red-300";
export const MY_SITES_UPDATES_BADGE = "inline-flex h-5 min-w-[1.5rem] items-center justify-center bg-amber-500/20 px-1.5 tabular-nums text-amber-200";

export const MY_SITES_TOOL_BTN = "h-8 shrink-0 gap-1.5 rounded-none border-0 bg-zinc-900 px-2.5 text-foreground shadow-none hover:bg-zinc-800";
export const MY_SITES_PRIMARY_BTN = "h-8 shrink-0 gap-1.5 rounded-none border-0 bg-primary px-3 text-black shadow-none hover:bg-primary/90";
export const MY_SITES_FIELD = "h-8 rounded-none border-0 bg-zinc-900 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0";

export const MY_SITES_LINK = "text-primary hover:underline";
export const MY_SITES_STAT_LABEL = "text-muted-foreground";
export const MY_SITES_STAT_VALUE = "tabular-nums text-primary";

export const ENV_PILL_CLASS: Record<HostedEnvironmentKind, string> = {
  production: "inline-flex h-6 w-10 items-center justify-center bg-primary/20 font-semibold text-primary",
  staging: "inline-flex h-6 w-10 items-center justify-center bg-sky-500/20 font-semibold text-sky-300",
  development: "inline-flex h-6 w-10 items-center justify-center bg-amber-500/20 font-semibold text-amber-200",
};

export const STATUS_TEXT_CLASS: Record<HostedSiteStatus, string> = {
  active: "text-primary",
  provisioning: "text-sky-300",
  pending: "text-muted-foreground",
  degraded: "text-amber-200",
  failed: "text-red-300",
};
