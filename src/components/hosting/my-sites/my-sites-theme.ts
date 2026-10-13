import type { HostedEnvironmentKind, HostedSiteStatus } from "@/lib/hosting-api";

/** Square, hairline-outlined dark surfaces for the Pulse Host pages. */
export const MY_SITES_HEADER_BAND = "flex h-14 shrink-0 items-center justify-between gap-3";
export const MY_SITES_TABS_BAND = "flex h-10 shrink-0 items-end gap-1 border-b border-white/[0.08]";
export const MY_SITES_TOOLBAR_BAND = "flex h-10 shrink-0 items-center gap-2";
export const MY_SITES_STATUS_LINE = "flex h-6 shrink-0 items-center text-muted-foreground";

export const HOST_SURFACE = "border border-white/[0.08] bg-zinc-900/40";
export const HOST_DIVIDER = "border-white/[0.06]";

export const MY_SITES_CARD = `flex flex-col ${HOST_SURFACE}`;
export const MY_SITES_CARD_HEADER = "flex h-12 shrink-0 items-center justify-between gap-3 px-5";
/** Each row draws its own top hairline, so header, rows and the show-more band separate cleanly. */
export const MY_SITES_ENV_ROW = `flex min-h-[4.5rem] flex-col justify-center gap-1 border-t ${HOST_DIVIDER} px-5 py-3`;

export const MY_SITES_TAB_BTN =
  "relative flex h-10 items-center gap-2 px-3 text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:absolute data-[active=true]:after:inset-x-0 data-[active=true]:after:-bottom-px data-[active=true]:after:h-0.5 data-[active=true]:after:bg-primary";
const BADGE = "inline-flex h-5 min-w-[1.5rem] items-center justify-center border px-1.5 tabular-nums";
export const MY_SITES_COUNT_BADGE = `${BADGE} border-white/10 text-muted-foreground`;
export const MY_SITES_ATTENTION_BADGE = `${BADGE} border-red-400/30 bg-red-500/10 text-red-300`;
export const MY_SITES_UPDATES_BADGE = `${BADGE} border-amber-400/30 bg-amber-500/10 text-amber-200`;

export const MY_SITES_TOOL_BTN =
  "h-8 shrink-0 gap-1.5 rounded-none border border-white/10 bg-transparent px-2.5 text-foreground shadow-none hover:bg-white/[0.06] hover:text-foreground";
export const MY_SITES_ICON_BTN = "h-8 w-8 shrink-0 rounded-none p-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground";
export const MY_SITES_PRIMARY_BTN = "h-8 shrink-0 gap-1.5 rounded-none border-0 bg-primary px-3 font-medium text-black shadow-none hover:bg-primary/90";
export const MY_SITES_FIELD = "h-8 rounded-none border-0 bg-zinc-900 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-0";
export const MY_SITES_POPOVER = "rounded-none border border-white/10 bg-zinc-950 text-base shadow-none";

export const MY_SITES_LINK = "text-primary hover:underline";
export const MY_SITES_STAT_LABEL = "text-muted-foreground";
export const MY_SITES_STAT_VALUE = "tabular-nums text-white";

export const HOST_TH = `h-11 border-b border-white/[0.08] px-5 text-left font-medium text-muted-foreground`;
export const HOST_TD = "h-11 px-5";
export const HOST_TR = "border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]";

const CHIP = "inline-flex h-6 shrink-0 items-center justify-center border px-2 font-medium tracking-wide";
export const ENV_PILL_CLASS: Record<HostedEnvironmentKind, string> = {
  production: `${CHIP} border-primary/30 bg-primary/10 text-primary`,
  staging: `${CHIP} border-sky-400/30 bg-sky-500/10 text-sky-300`,
  development: `${CHIP} border-amber-400/30 bg-amber-500/10 text-amber-200`,
};

export const STATUS_TEXT_CLASS: Record<HostedSiteStatus, string> = {
  active: "text-primary",
  provisioning: "text-sky-300",
  pending: "text-muted-foreground",
  degraded: "text-amber-200",
  failed: "text-red-300",
};

export const STATUS_DOT_CLASS: Record<HostedSiteStatus, string> = {
  active: "bg-primary",
  provisioning: "bg-sky-300",
  pending: "bg-zinc-500",
  degraded: "bg-amber-300",
  failed: "bg-red-400",
};
