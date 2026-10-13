import type { NavigateFunction } from "react-router-dom";

export const ORGANIC_REPORTING_MANAGER_TAB = "organic-reporting";

export const NEO_PULSE_OPEN_ORGANIC_REPORTING_EVENT = "neo-pulse-open-organic-reporting";

export type OpenOrganicReportingDetail = { siteId: string };

function isIndexAppPath(pathname: string): boolean {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (base && pathname === base) return true;
  return pathname === "/" || pathname === "";
}

/** Shareable deep link (cold open, bookmarks). */
export function navigateToOrganicReporting(navigate: NavigateFunction, siteId: string): void {
  navigate(`/sites/${siteId}/organic`, { flushSync: true });
}

/**
 * From the main app shell (`/`), switch the Reporting tab instantly (no route unmount).
 * From elsewhere, use the dedicated reporting route.
 */
export function openOrganicReporting(
  navigate: NavigateFunction,
  pathname: string,
  siteId: string,
): void {
  if (isIndexAppPath(pathname)) {
    window.dispatchEvent(
      new CustomEvent(NEO_PULSE_OPEN_ORGANIC_REPORTING_EVENT, {
        detail: { siteId } satisfies OpenOrganicReportingDetail,
      }),
    );
    return;
  }
  navigateToOrganicReporting(navigate, siteId);
}
