import { pickGa4OrganicAcquisition, type GA4ReportData } from "@/components/integrations/types";
import {
  formatCanadianCompactNumber,
  formatCanadianNumber,
} from "@/lib/gsc-reporting/gsc-number-format";
import type {
  OrganicDashboardBundleResponse,
  OrganicDashboardGscHistorical,
  OrganicDashboardGscStats,
  OrganicDashboardGscTimeseriesPoint,
  OrganicDashboardSemrushMetrics,
  OrganicDashboardSemrushStats,
} from "@/lib/organic-dashboard/organic-dashboard-types";
import { semrushDomainOverviewUrl } from "@/lib/competitor-research/semrush-domain-overview-url";
import { isOrganicSkippedBlock } from "@/lib/organic-dashboard/organic-dashboard-types";
import { formatComparePeriodLabel } from "@/lib/reporting/reporting-date-presets";

export type OrganicGa4TableRow = {
  label: string;
  current: string;
  previous: string;
  delta: OrganicGscMetricDelta;
};

export type OrganicGscQueryRow = {
  query: string;
  clicks: string;
  previousClicks: string;
  clicksDelta: OrganicGscMetricDelta;
  impressions: string;
  previousImpressions: string;
  impressionsDelta: OrganicGscMetricDelta;
  position: string;
};

export type OrganicChartPoint = {
  label: string;
  gaUsers?: number;
  gaSessions?: number;
  gscClicks?: number;
  gscImpressions?: number;
  gscAvgPosition?: number;
  semrushTraffic?: number;
  semrushKeywords?: number;
  semrushTrafficCost?: number;
};

export type OrganicGscMetricDelta = {
  deltaPercent: number | null;
  deltaPositive: boolean | null;
};

export type OrganicGscSummary = {
  clicks: string;
  impressions: string;
  ctr: string;
  avgPosition: string;
  compareClicks: string;
  compareImpressions: string;
  compareCtr: string;
  compareAvgPosition: string;
  clicksDelta: OrganicGscMetricDelta;
  impressionsDelta: OrganicGscMetricDelta;
  ctrDelta: OrganicGscMetricDelta;
  positionDelta: OrganicGscMetricDelta;
};

export type OrganicSemrushKeywordRow = {
  phrase: string;
  volume: string;
  traffic: string;
  position: string;
};

export type OrganicSemrushSummary = {
  keywords: string;
  traffic: string;
  trafficCost: string;
  brandedTraffic: string;
  nonBrandedTraffic: string;
  compareKeywords: string;
  compareTraffic: string;
  compareTrafficCost: string;
  compareBrandedTraffic: string;
  compareNonBrandedTraffic: string;
  keywordsDelta: OrganicGscMetricDelta;
  trafficDelta: OrganicGscMetricDelta;
  trafficCostDelta: OrganicGscMetricDelta;
  brandedDelta: OrganicGscMetricDelta;
  nonBrandedDelta: OrganicGscMetricDelta;
  hasBrandedMetrics: boolean;
};

export type OrganicDashboardPeriodLabels = {
  primary: string;
  compare: string;
};

export type OrganicDashboardViewModel = {
  ga4Table: OrganicGa4TableRow[];
  ga4MonthlyChart: OrganicChartPoint[];
  gscQueries: OrganicGscQueryRow[];
  gscTrendDaily: OrganicChartPoint[];
  gscTrendMonthly: OrganicChartPoint[];
  gscSummary: OrganicGscSummary | null;
  semrushSummary: OrganicSemrushSummary | null;
  semrushTrend: OrganicChartPoint[];
  semrushKeywords: OrganicSemrushKeywordRow[];
  semrushOverviewUrl: string;
  semrushDomain: string;
  semrushDatabase: string;
  periodLabels: OrganicDashboardPeriodLabels;
  hasGa4: boolean;
  hasGsc: boolean;
  hasSemrush: boolean;
};

const EM = "—";

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EM;
  return formatCanadianNumber(Math.round(n));
}

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EM;
  return formatCanadianCompactNumber(Math.round(n));
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EM;
  return `${n.toFixed(1)}%`;
}

function fmtPosition(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EM;
  return n.toFixed(1);
}

function fmtTrafficCost(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return EM;
  return `$${formatCanadianCompactNumber(Math.round(n))}`;
}

function deltaFromPercent(changePercent: number | null | undefined): {
  deltaPercent: number | null;
  deltaPositive: boolean | null;
} {
  if (changePercent == null || !Number.isFinite(changePercent)) {
    return { deltaPercent: null, deltaPositive: null };
  }
  return {
    deltaPercent: Math.abs(changePercent),
    deltaPositive: changePercent >= 0,
  };
}

function deltaFromPair(current: number | undefined, previous: number | undefined): {
  deltaPercent: number | null;
  deltaPositive: boolean | null;
} {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return { deltaPercent: null, deltaPositive: null };
  }
  return deltaFromPercent(((current - previous) / previous) * 100);
}

function monthInRange(monthKey: string, startYmd: string, endYmd: string): boolean {
  const start = startYmd.slice(0, 7);
  const end = endYmd.slice(0, 7);
  return monthKey >= start && monthKey <= end;
}

function buildGa4Table(ga: GA4ReportData | undefined, showCompare: boolean): OrganicGa4TableRow[] {
  const acq = ga ? pickGa4OrganicAcquisition(ga) : undefined;
  const users = ga?.organicUsers;
  if (!acq && !users) {
    return [];
  }
  const rows: Array<{ label: string; cur: number; prev: number; format: "int" | "pct" | "sec" }> = [];
  if (users) {
    rows.push(
      { label: "Total users", cur: users.current.totalUsers, prev: users.previous.totalUsers, format: "int" },
      { label: "New users", cur: users.current.newUsers, prev: users.previous.newUsers, format: "int" },
      {
        label: "User key event rate",
        cur: users.current.userKeyEventRate,
        prev: users.previous.userKeyEventRate,
        format: "pct",
      },
      { label: "Key events", cur: users.current.keyEvents, prev: users.previous.keyEvents, format: "int" },
    );
  }
  if (acq) {
    rows.push(
      { label: "Organic Search sessions", cur: acq.current.sessions, prev: acq.previous.sessions, format: "int" },
      {
        label: "Engaged sessions",
        cur: acq.current.engagedSessions,
        prev: acq.previous.engagedSessions,
        format: "int",
      },
      { label: "Engagement rate", cur: acq.current.engagementRate, prev: acq.previous.engagementRate, format: "pct" },
      {
        label: "Avg session duration",
        cur: acq.current.averageSessionDurationSec,
        prev: acq.previous.averageSessionDurationSec,
        format: "sec",
      },
      {
        label: "Key events (Organic Search sessions)",
        cur: acq.current.keyEvents,
        prev: acq.previous.keyEvents,
        format: "int",
      },
    );
  }
  return rows.map((r) => {
    const delta = showCompare ? deltaFromPair(r.cur, r.prev) : { deltaPercent: null, deltaPositive: null };
    return {
      label: r.label,
      current:
        r.format === "pct"
          ? fmtPct(r.cur * 100)
          : r.format === "sec"
            ? `${Math.round(r.cur)}s`
            : fmtInt(r.cur),
      previous:
        r.format === "pct"
          ? fmtPct(r.prev * 100)
          : r.format === "sec"
            ? `${Math.round(r.prev)}s`
            : fmtInt(r.prev),
      delta,
    };
  });
}

function buildGa4MonthlyChart(
  ga: GA4ReportData | undefined,
  primary: { startDate: string; endDate: string },
): OrganicChartPoint[] {
  const userMonths = ga?.organicUsersMonthly?.months ?? [];
  if (userMonths.length > 0) {
    return userMonths
      .filter((m) => monthInRange(m.yearMonth, primary.startDate, primary.endDate))
      .map((m) => ({
        label: m.label || m.yearMonth,
        gaUsers: m.totalUsers,
      }));
  }
  const months = ga?.organicTrafficAcquisitionMonthly?.months ?? [];
  return months
    .filter((m) => monthInRange(m.yearMonth, primary.startDate, primary.endDate))
    .map((m) => ({
      label: m.label || m.yearMonth,
      gaSessions: m.sessions,
    }));
}

function formatGscChartDateLabel(ymd: string): string {
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return ymd;
  return `${m}/${d}`;
}

function buildGscTrendFromDaily(gsc: OrganicDashboardGscStats | undefined): OrganicChartPoint[] {
  const daily = gsc?.timeseries ?? [];
  return daily.map((row) => ({
    label: formatGscChartDateLabel(row.date),
    gscClicks: row.clicks,
    gscImpressions: row.impressions,
    gscAvgPosition: row.avgPosition,
  }));
}

function buildGscTrendMonthly(
  hist: OrganicDashboardGscHistorical | undefined,
  primary: { startDate: string; endDate: string },
): OrganicChartPoint[] {
  const stats = hist?.monthlyStats ?? [];
  return stats
    .filter((m) => monthInRange(m.month, primary.startDate, primary.endDate))
    .map((m) => ({
      label: m.month,
      gscClicks: m.clicks ?? 0,
      gscImpressions: m.impressions,
      gscAvgPosition: m.avgPosition,
    }));
}

function aggregateTimeseriesToMonthly(
  daily: OrganicDashboardGscTimeseriesPoint[],
): OrganicChartPoint[] {
  const buckets = new Map<string, { clicks: number; impressions: number; pos: number; posW: number }>();
  for (const row of daily) {
    const mk = row.date.slice(0, 7);
    const b = buckets.get(mk) ?? { clicks: 0, impressions: 0, pos: 0, posW: 0 };
    b.clicks += row.clicks;
    b.impressions += row.impressions;
    const w = Math.max(1, row.impressions);
    b.pos += row.avgPosition * w;
    b.posW += w;
    buckets.set(mk, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, b]) => ({
      label: month,
      gscClicks: b.clicks,
      gscImpressions: b.impressions,
      gscAvgPosition: b.posW > 0 ? b.pos / b.posW : 0,
    }));
}

function buildGscSummary(gsc: OrganicDashboardGscStats | undefined): OrganicGscSummary | null {
  const stats = gsc?.stats;
  const cur = stats?.currentPeriod;
  if (!cur) return null;
  const cmp = stats.comparisons;
  const clicksDelta = deltaFromPercent(cmp?.clicksChangePercent);
  const impressionsDelta = deltaFromPercent(cmp?.impressionsChangePercent);
  const ctrDelta = deltaFromPercent(cmp?.ctrChangePercent);
  const posChange = cmp?.avgPositionChange;
  const positionDelta =
    posChange != null && Number.isFinite(posChange)
      ? {
          deltaPercent: Math.abs(cmp.avgPositionChangePercent ?? 0),
          deltaPositive: posChange <= 0,
        }
      : { deltaPercent: null, deltaPositive: null };
  const prev = stats.comparisonPeriod;
  return {
    clicks: fmtCount(cur.clicks),
    impressions: fmtCount(cur.impressions),
    ctr: fmtPct(cur.ctr * 100),
    avgPosition: fmtPosition(cur.avgPosition),
    compareClicks: fmtCount(prev?.clicks),
    compareImpressions: fmtCount(prev?.impressions),
    compareCtr: fmtPct((prev?.ctr ?? 0) * 100),
    compareAvgPosition: fmtPosition(prev?.avgPosition),
    clicksDelta,
    impressionsDelta,
    ctrDelta,
    positionDelta,
  };
}

function chartMetricNumber(value: number | null | undefined): number | undefined {
  if (value == null || typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function buildSemrushTrend(semrush: OrganicDashboardSemrushStats | undefined): OrganicChartPoint[] {
  const history = [...(semrush?.history ?? [])].sort((a, b) => a.month.localeCompare(b.month));
  return history.map((row) => ({
    label: row.month,
    semrushTraffic: chartMetricNumber(row.organicTraffic),
    semrushKeywords: chartMetricNumber(row.organicKeywords),
    semrushTrafficCost: chartMetricNumber(row.trafficCost),
  }));
}

function metricStrings(m: OrganicDashboardSemrushMetrics | null | undefined): {
  keywords: string;
  traffic: string;
  trafficCost: string;
  branded: string;
  nonBranded: string;
} {
  return {
    keywords: fmtCount(m?.organicKeywords),
    traffic: fmtCount(m?.organicTraffic),
    trafficCost: fmtTrafficCost(m?.trafficCost),
    branded: fmtCount(m?.brandedTraffic),
    nonBranded: fmtCount(m?.nonBrandedTraffic),
  };
}

function buildSemrushSummary(
  semrush: OrganicDashboardSemrushStats | undefined,
  showCompare: boolean,
): OrganicSemrushSummary | null {
  const cur = semrush?.current;
  if (!cur) return null;
  const cmp = semrush?.compare;
  const comparisons = semrush?.comparisons;
  const curFmt = metricStrings(cur);
  const cmpFmt = metricStrings(cmp);
  const hasBranded =
    cur.brandedTraffic != null &&
    Number.isFinite(cur.brandedTraffic) &&
    cur.nonBrandedTraffic != null &&
    Number.isFinite(cur.nonBrandedTraffic);

  const keywordsDelta = showCompare
    ? deltaFromPercent(comparisons?.keywordsChangePercent)
    : { deltaPercent: null, deltaPositive: null };
  const trafficDelta = showCompare
    ? deltaFromPercent(comparisons?.trafficChangePercent)
    : { deltaPercent: null, deltaPositive: null };
  const trafficCostDelta = showCompare
    ? deltaFromPercent(comparisons?.trafficCostChangePercent)
    : { deltaPercent: null, deltaPositive: null };
  const brandedDelta = showCompare
    ? deltaFromPair(cur.brandedTraffic ?? undefined, cmp?.brandedTraffic ?? undefined)
    : { deltaPercent: null, deltaPositive: null };
  const nonBrandedDelta = showCompare
    ? deltaFromPair(cur.nonBrandedTraffic ?? undefined, cmp?.nonBrandedTraffic ?? undefined)
    : { deltaPercent: null, deltaPositive: null };

  return {
    keywords: curFmt.keywords,
    traffic: curFmt.traffic,
    trafficCost: curFmt.trafficCost,
    brandedTraffic: curFmt.branded,
    nonBrandedTraffic: curFmt.nonBranded,
    compareKeywords: cmpFmt.keywords,
    compareTraffic: cmpFmt.traffic,
    compareTrafficCost: cmpFmt.trafficCost,
    compareBrandedTraffic: cmpFmt.branded,
    compareNonBrandedTraffic: cmpFmt.nonBranded,
    keywordsDelta,
    trafficDelta,
    trafficCostDelta,
    brandedDelta,
    nonBrandedDelta,
    hasBrandedMetrics: hasBranded,
  };
}

function buildSemrushKeywords(semrush: OrganicDashboardSemrushStats | undefined): OrganicSemrushKeywordRow[] {
  const top = semrush?.topKeywords ?? [];
  return top.slice(0, 25).map((row) => ({
    phrase: row.phrase,
    volume: fmtCount(row.volume),
    traffic: fmtCount(row.traffic),
    position: fmtPosition(row.position),
  }));
}

function buildGscQueries(
  gsc: OrganicDashboardGscStats | undefined,
  showCompare: boolean,
): OrganicGscQueryRow[] {
  const emptyDelta = { deltaPercent: null, deltaPositive: null };
  const top = [...(gsc?.stats?.topKeywords ?? [])].sort(
    (a, b) => (b.currentClicks ?? 0) - (a.currentClicks ?? 0),
  );
  return top.slice(0, 25).map((row) => {
    const clicksDelta = showCompare
      ? deltaFromPair(row.currentClicks, row.previousClicks)
      : emptyDelta;
    const impressionsDelta = showCompare
      ? deltaFromPair(row.currentImpressions, row.previousImpressions)
      : emptyDelta;
    return {
      query: row.query,
      clicks: fmtCount(row.currentClicks),
      previousClicks: fmtCount(row.previousClicks),
      clicksDelta,
      impressions: fmtCount(row.currentImpressions),
      previousImpressions: fmtCount(row.previousImpressions),
      impressionsDelta,
      position: fmtPosition(row.currentRanking),
    };
  });
}

export type OrganicDashboardViewModelOptions = {
  showCompare?: boolean;
};

export function buildOrganicDashboardViewModel(
  data: OrganicDashboardBundleResponse | undefined,
  options?: OrganicDashboardViewModelOptions,
): OrganicDashboardViewModel {
  const showCompare = options?.showCompare !== false;
  const primary = data?.meta?.primary ?? { startDate: "", endDate: "" };
  const compare = data?.meta?.compare ?? { startDate: "", endDate: "" };
  const ga4 = data?.ga4 && !isOrganicSkippedBlock(data.ga4) ? data.ga4 : undefined;
  const gsc = data?.gsc && !isOrganicSkippedBlock(data.gsc) ? data.gsc : undefined;
  const hist =
    data?.gscHistorical && !isOrganicSkippedBlock(data.gscHistorical) ? data.gscHistorical : undefined;
  const semrush =
    data?.semrush && !isOrganicSkippedBlock(data.semrush) ? data.semrush : undefined;
  const semrushDomain = semrush?.domain?.trim() ?? "";
  const semrushDatabase = semrush?.database?.trim() || "us";
  const semrushOverviewUrl =
    semrush?.overviewUrl?.trim() ||
    (semrushDomain ? semrushDomainOverviewUrl(semrushDomain, semrushDatabase) : "");

  const periodLabels: OrganicDashboardPeriodLabels = {
    primary:
      primary.startDate && primary.endDate
        ? formatComparePeriodLabel(primary.startDate, primary.endDate)
        : "Current period",
    compare:
      compare.startDate && compare.endDate
        ? formatComparePeriodLabel(compare.startDate, compare.endDate)
        : "Compare period",
  };

  return {
    ga4Table: buildGa4Table(ga4, showCompare),
    ga4MonthlyChart: buildGa4MonthlyChart(ga4, primary),
    gscQueries: buildGscQueries(gsc, showCompare),
    gscTrendDaily: buildGscTrendFromDaily(gsc),
    gscTrendMonthly: (() => {
      const series = gsc?.timeseries ?? [];
      return series.length > 0
        ? aggregateTimeseriesToMonthly(series)
        : buildGscTrendMonthly(hist, primary);
    })(),
    gscSummary: buildGscSummary(gsc),
    semrushSummary: buildSemrushSummary(semrush, showCompare),
    semrushTrend: buildSemrushTrend(semrush),
    semrushKeywords: buildSemrushKeywords(semrush),
    semrushOverviewUrl,
    semrushDomain,
    semrushDatabase,
    periodLabels,
    hasGa4: !!ga4,
    hasGsc: !!gsc?.stats,
    hasSemrush: !!semrush?.current || (semrush?.history?.length ?? 0) > 0,
  };
}

/** Backfill arrays and Semrush fields on deck payloads saved before view-model shape grew. */
export function normalizeOrganicDashboardViewModelForDeck(raw: unknown): OrganicDashboardViewModel {
  const defaults = buildOrganicDashboardViewModel(undefined);
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Partial<OrganicDashboardViewModel>;
  return {
    ...defaults,
    ...r,
    ga4Table: Array.isArray(r.ga4Table) ? r.ga4Table : defaults.ga4Table,
    ga4MonthlyChart: Array.isArray(r.ga4MonthlyChart) ? r.ga4MonthlyChart : defaults.ga4MonthlyChart,
    gscQueries: Array.isArray(r.gscQueries) ? r.gscQueries : defaults.gscQueries,
    gscTrendDaily: Array.isArray(r.gscTrendDaily) ? r.gscTrendDaily : defaults.gscTrendDaily,
    gscTrendMonthly: Array.isArray(r.gscTrendMonthly) ? r.gscTrendMonthly : defaults.gscTrendMonthly,
    semrushKeywords: Array.isArray(r.semrushKeywords) ? r.semrushKeywords : defaults.semrushKeywords,
    semrushTrend: Array.isArray(r.semrushTrend) ? r.semrushTrend : defaults.semrushTrend,
    periodLabels:
      r.periodLabels && typeof r.periodLabels === "object"
        ? {
            primary:
              typeof r.periodLabels.primary === "string"
                ? r.periodLabels.primary
                : defaults.periodLabels.primary,
            compare:
              typeof r.periodLabels.compare === "string"
                ? r.periodLabels.compare
                : defaults.periodLabels.compare,
          }
        : defaults.periodLabels,
    gscSummary: r.gscSummary !== undefined ? r.gscSummary : defaults.gscSummary,
    semrushSummary: r.semrushSummary !== undefined ? r.semrushSummary : defaults.semrushSummary,
    semrushOverviewUrl:
      typeof r.semrushOverviewUrl === "string" ? r.semrushOverviewUrl : defaults.semrushOverviewUrl,
    semrushDomain: typeof r.semrushDomain === "string" ? r.semrushDomain : defaults.semrushDomain,
    semrushDatabase: typeof r.semrushDatabase === "string" ? r.semrushDatabase : defaults.semrushDatabase,
    hasGa4: typeof r.hasGa4 === "boolean" ? r.hasGa4 : defaults.hasGa4,
    hasGsc: typeof r.hasGsc === "boolean" ? r.hasGsc : defaults.hasGsc,
    hasSemrush: typeof r.hasSemrush === "boolean" ? r.hasSemrush : defaults.hasSemrush,
  };
}
