import { LayoutDashboard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { openOrganicReporting } from "@/lib/organic-dashboard/organic-reporting-nav";
import { cn } from "@/lib/utils";
import {
  getPropertyListRowBlackIconButtonClass,
  getPropertyListRowIconButtonHoverGlowClass,
} from "./cyberpunk-theme";
import type { WordPressPropertyRowDisplay } from "@/lib/wordpress-properties-row-display";
import type { WordPressSite } from "../types";
import { PROPERTY_REPORTING_SHORTCUT_SLOT_CLASS } from "./PropertyReportingShortcutPill";

type PropertyOrganicDashboardShortcutPillProps = {
  site: WordPressSite;
  rowDisplay?: WordPressPropertyRowDisplay;
  onBeforeNavigate?: (site: WordPressSite) => void;
};

export function PropertyOrganicDashboardShortcutPill({
  site,
  rowDisplay = "compact",
  onBeforeNavigate,
}: PropertyOrganicDashboardShortcutPillProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const compact = rowDisplay === "compact";
  const iconClass = cn("shrink-0 text-primary", compact ? "h-4 w-4" : "h-5 w-5");

  return (
    <div
      className={cn(
        PROPERTY_REPORTING_SHORTCUT_SLOT_CLASS,
        compact ? "min-h-8 w-8 sm:min-h-9 sm:w-9" : "min-h-9 w-9",
      )}
    >
      <button
        type="button"
        className={cn(
          getPropertyListRowBlackIconButtonClass(compact),
          getPropertyListRowIconButtonHoverGlowClass("powerOn"),
          "[&_svg]:!text-primary",
        )}
        title="Organic performance dashboard"
        aria-label={`Open organic dashboard for ${site.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onBeforeNavigate?.(site);
          openOrganicReporting(navigate, location.pathname, site.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <LayoutDashboard className={iconClass} aria-hidden />
      </button>
    </div>
  );
}
