import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readOrganicClientReportDeckSession,
  writeOrganicClientReportDeckSession,
  type OrganicClientReportDeckPayload,
} from "@/lib/organic-dashboard/organic-client-report-deck-session";

const storage = new Map<string, string>();

const payload: OrganicClientReportDeckPayload = {
  siteId: "wp-1",
  siteName: "Example",
  siteUrl: "https://example.com",
  showCompare: true,
  preparedOn: "2026-10-11",
  highlights: {
    executiveSummary: "Plain headline.",
    keyTakeaways: ["First insight.", "Second insight."],
    performanceNarrative: ["GA4 traffic rose in the later period.", "GSC clicks improved with stronger CTR."],
    keywordNarrative: ["Top queries skewed toward brand terms in the primary period."],
    topOpportunities: [],
  },
  viewModel: {
    ga4Table: [],
    ga4MonthlyChart: [],
    gscQueries: [],
    gscTrendDaily: [],
    gscTrendMonthly: [],
    gscSummary: null,
    semrushSummary: null,
    semrushTrend: [],
    semrushKeywords: [],
    semrushOverviewUrl: "",
    semrushDomain: "",
    semrushDatabase: "us",
    periodLabels: { primary: "Sep", compare: "Aug" },
    hasGa4: false,
    hasGsc: false,
    hasSemrush: false,
  },
};

describe("organic client report deck session", () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes and reads payload for matching site", () => {
    writeOrganicClientReportDeckSession("deck-a", payload);
    expect(readOrganicClientReportDeckSession("deck-a", "wp-1")).toEqual(payload);
  });

  it("returns null when site id does not match", () => {
    writeOrganicClientReportDeckSession("deck-a", payload);
    expect(readOrganicClientReportDeckSession("deck-a", "other")).toBeNull();
  });

  it("backfills Semrush fields on older stored view models", () => {
    const stale = {
      ...payload,
      viewModel: {
        ga4Table: [],
        ga4MonthlyChart: [],
        gscQueries: [],
        gscTrendDaily: [],
        gscTrendMonthly: [],
        gscSummary: null,
        periodLabels: { primary: "Sep", compare: "Aug" },
        hasGa4: false,
        hasGsc: false,
      },
    };
    writeOrganicClientReportDeckSession("deck-stale", stale);
    const read = readOrganicClientReportDeckSession("deck-stale", "wp-1");
    expect(read?.viewModel.semrushKeywords).toEqual([]);
    expect(read?.viewModel.hasSemrush).toBe(false);
  });
});
