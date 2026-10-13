export const REPORTING_SECTION_IDS = ["performance", "speed"] as const;

export type ReportingSectionId = (typeof REPORTING_SECTION_IDS)[number];

export const REPORTING_SECTION_LABELS: Record<ReportingSectionId, string> = {
  performance: "Performance",
  speed: "Speed scores",
};

export const REPORTING_GSC_INDEXING_LABEL = "Page indexing";

const SESSION_KEY = "neo-pulse-reporting-section";

export function readReportingSectionSession(): ReportingSectionId | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === "indexing") {
      return "performance";
    }
    if (raw && REPORTING_SECTION_IDS.includes(raw as ReportingSectionId)) {
      return raw as ReportingSectionId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function normalizeReportingSectionId(raw: string | null | undefined): ReportingSectionId {
  if (raw === "indexing") return "performance";
  if (raw && REPORTING_SECTION_IDS.includes(raw as ReportingSectionId)) {
    return raw as ReportingSectionId;
  }
  return "performance";
}

export function writeReportingSectionSession(section: ReportingSectionId): void {
  try {
    sessionStorage.setItem(SESSION_KEY, section);
  } catch {
    /* ignore */
  }
}
