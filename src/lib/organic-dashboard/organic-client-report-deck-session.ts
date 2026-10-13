import { normalizeOrganicReportingHighlights } from "@/lib/organic-dashboard/organic-reporting-highlights";
import {
  normalizeOrganicDashboardViewModelForDeck,
  type OrganicDashboardViewModel,
} from "@/lib/organic-dashboard/organic-dashboard-view-model";

export type OrganicClientReportDeckPayload = {
  siteId: string;
  highlights: OrganicReportingHighlights;
  viewModel: OrganicDashboardViewModel;
  siteName: string;
  siteUrl: string;
  showCompare: boolean;
  preparedOn: string;
};

const STORAGE_PREFIX = "neo-pulse:organic-client-report:";

function storageKey(deckId: string): string {
  return `${STORAGE_PREFIX}${deckId}`;
}

/** localStorage so a tab opened via window.open can read the payload (sessionStorage is per-tab). */
export function writeOrganicClientReportDeckSession(
  deckId: string,
  payload: OrganicClientReportDeckPayload,
): void {
  localStorage.setItem(storageKey(deckId), JSON.stringify(payload));
}

export function deckHighlightsNeedsAgentNarratives(
  highlights: OrganicClientReportDeckPayload["highlights"],
): boolean {
  const staleOpportunities = highlights.topOpportunities.some(
    (o) => o.comparisonRows.length < 1,
  );
  return (
    highlights.performanceNarrative.length < 2 ||
    highlights.keywordNarrative.length < 1 ||
    staleOpportunities
  );
}

export function readOrganicClientReportDeckSession(
  deckId: string,
  siteId: string,
): OrganicClientReportDeckPayload | null {
  const raw = localStorage.getItem(storageKey(deckId));
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.siteId !== siteId) return null;
  if (typeof o.siteName !== "string" || typeof o.siteUrl !== "string") return null;
  if (typeof o.showCompare !== "boolean" || typeof o.preparedOn !== "string") return null;
  if (!o.highlights || typeof o.highlights !== "object") return null;
  if (!o.viewModel || typeof o.viewModel !== "object") return null;
  const highlights = normalizeOrganicReportingHighlights(o.highlights);
  if (!highlights) return null;
  return {
    siteId,
    siteName: o.siteName,
    siteUrl: o.siteUrl,
    showCompare: o.showCompare,
    preparedOn: o.preparedOn,
    viewModel: normalizeOrganicDashboardViewModelForDeck(o.viewModel),
    highlights,
  };
}
