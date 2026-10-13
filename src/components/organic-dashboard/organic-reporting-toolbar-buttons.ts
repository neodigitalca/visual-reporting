import { cn } from "@/lib/utils";
import { BULK_HEADER_TOOL_BTN } from "@/components/keyword-research/bulk/bulk-workspace-header-styles";

/** Zinc flat actions on the black reporting toolbar (fixed width, zero CLS). */
export const REPORTING_TOOLBAR_ACTION_BTN = cn(
  BULK_HEADER_TOOL_BTN,
  "inline-flex h-8 min-h-8 items-center justify-center gap-2 px-3 text-white hover:bg-zinc-800",
);

export const REPORTING_TOOLBAR_SHARE_BTN_CLASS = cn(REPORTING_TOOLBAR_ACTION_BTN, "min-w-[7.5rem]");
export const REPORTING_TOOLBAR_CLIENT_REPORT_BTN_CLASS = cn(
  REPORTING_TOOLBAR_ACTION_BTN,
  "min-w-[8.5rem]",
);
export const REPORTING_TOOLBAR_REFRESH_BTN_CLASS = cn(REPORTING_TOOLBAR_ACTION_BTN, "min-w-[6rem]");
export const REPORTING_TOOLBAR_DOWNLOAD_PDF_BTN_CLASS = cn(
  REPORTING_TOOLBAR_ACTION_BTN,
  "min-w-[10rem]",
);

export const REPORTING_TOOLBAR_DOWNLOAD_MARKDOWN_BTN_CLASS = cn(
  REPORTING_TOOLBAR_ACTION_BTN,
  "min-w-[11rem]",
);

/** Reserve width for longest label; visible text stays centered without shifting layout. */
export const REPORTING_TOOLBAR_LABEL_SLOT_CLASS =
  "relative inline-flex min-h-[1.25rem] min-w-full items-center justify-center";

export const REPORTING_TOOLBAR_LABEL_VISIBLE_CLASS = "relative z-[1]";

export const REPORTING_TOOLBAR_LABEL_RESERVE_CLASS =
  "pointer-events-none invisible absolute inset-0 flex items-center justify-center whitespace-nowrap";

export const REPORTING_SECTION_TAB_BTN = cn(
  "inline-flex h-8 min-h-8 items-center justify-center rounded-none border-0 px-3 text-base font-medium shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
);

export const REPORTING_SECTION_TAB_INACTIVE = cn(
  REPORTING_SECTION_TAB_BTN,
  "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
);

export const REPORTING_SECTION_TAB_ACTIVE = cn(
  REPORTING_SECTION_TAB_BTN,
  "bg-primary text-black hover:bg-primary/90",
);
