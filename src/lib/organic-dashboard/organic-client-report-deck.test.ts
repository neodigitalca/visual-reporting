import { describe, expect, it } from "vitest";
import {
  buildHeadlineSummaryRows,
  dedupeOrganicComparisonRows,
  parseDeckCountDisplay,
  pickDeckHighlightStats,
  plainDeckText,
  plainTextSummary,
  splitDeckSentences,
} from "@/lib/organic-dashboard/organic-client-report-deck-helpers";
import type { OrganicDashboardViewModel } from "@/lib/organic-dashboard/organic-dashboard-view-model";

const emptyDelta = { deltaPercent: null, deltaPositive: null };

function minimalViewModel(overrides: Partial<OrganicDashboardViewModel> = {}): OrganicDashboardViewModel {
  return {
    ga4Table: [
      {
        label: "Total users",
        current: "1.2K",
        previous: "1.0K",
        delta: { deltaPercent: 20, deltaPositive: true },
      },
      {
        label: "Organic Search sessions",
        current: "900",
        previous: "800",
        delta: { deltaPercent: 12.5, deltaPositive: true },
      },
      { label: "New users", current: "500", previous: "400", delta: emptyDelta },
    ],
    ga4MonthlyChart: [],
    gscQueries: [],
    gscTrendDaily: [],
    gscTrendMonthly: [],
    gscSummary: {
      clicks: "881",
      impressions: "88.4K",
      ctr: "1.0%",
      avgPosition: "12.3",
      compareClicks: "800",
      compareImpressions: "80K",
      compareCtr: "0.9%",
      compareAvgPosition: "13.0",
      clicksDelta: { deltaPercent: 10, deltaPositive: true },
      impressionsDelta: { deltaPercent: 5, deltaPositive: true },
      ctrDelta: { deltaPercent: 1, deltaPositive: true },
      positionDelta: { deltaPercent: 2, deltaPositive: true },
    },
    periodLabels: { primary: "Feb 2026", compare: "Jan 2026" },
    hasGa4: true,
    hasGsc: true,
    ...overrides,
  };
}

describe("dedupeOrganicComparisonRows", () => {
  it("drops site-wide key events when organic key events present", () => {
    const rows = dedupeOrganicComparisonRows([
      { metric: "Key events", comparePeriodValue: "1", primaryPeriodValue: "13" },
      {
        metric: "Key events (Organic Search sessions)",
        comparePeriodValue: "1",
        primaryPeriodValue: "11",
      },
      { metric: "User key event rate", comparePeriodValue: "0.1%", primaryPeriodValue: "1.1%" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.metric).toContain("Organic Search");
  });
});

describe("splitDeckSentences", () => {
  it("does not split on decimal percentages", () => {
    const one =
      "Total users rose 40.6% to 1,056 and Organic Search sessions rose 22.1% to 1,200 in September.";
    expect(splitDeckSentences(one)).toEqual([one]);
  });
});

describe("plainDeckText", () => {
  it("strips markdown asterisks and collapses whitespace", () => {
    expect(plainDeckText("**Strong** growth in *organic*")).toBe("Strong growth in organic");
    expect(plainTextSummary("**Strong** growth in *organic*")).toBe("Strong growth in organic");
  });

  it("strips backticks and hash prefixes", () => {
    expect(plainDeckText("`code` and ## Heading")).toBe("code and Heading");
  });
});

describe("pickDeckHighlightStats", () => {
  it("returns up to three stats ordered by delta magnitude", () => {
    const stats = pickDeckHighlightStats(minimalViewModel(), true);
    expect(stats.length).toBeGreaterThan(0);
    expect(stats.length).toBeLessThanOrEqual(3);
    expect(stats[0]?.label).toBe("Organic Search sessions");
  });
});

describe("parseDeckCountDisplay", () => {
  it("parses K suffix and commas", () => {
    expect(parseDeckCountDisplay("88.4K")).toBe(88400);
    expect(parseDeckCountDisplay("1,234")).toBe(1234);
  });
});

describe("buildHeadlineSummaryRows", () => {
  it("includes only headline GA4 rows plus GSC totals", () => {
    const rows = buildHeadlineSummaryRows(minimalViewModel(), true);
    const labels = rows.map((r) => r.label);
    expect(labels).toEqual([
      "Organic Search sessions",
      "Total clicks",
      "Total impressions",
      "Average CTR",
      "Average position",
    ]);
    expect(rows[0]?.label).toBe("Organic Search sessions");
    expect(rows[0]?.earlier).toBe("800");
    expect(rows[0]?.later).toBe("900");
  });
});
