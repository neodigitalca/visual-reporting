import {
  normalizeOrganicReportingHighlights,
  type OrganicDeckOpportunity,
  type OrganicReportingHighlights,
} from "@/lib/organic-dashboard/organic-reporting-highlights";
import type { OrganicDashboardViewModel } from "@/lib/organic-dashboard/organic-dashboard-view-model";
import {
  buildHeadlineSummaryRows,
  buildSemrushDeckSummaryRows,
  pickDeckHighlightStats,
  splitHeadlineSummaryRows,
  type DeckHighlightStat,
  type DeckSummaryRow,
} from "@/lib/organic-dashboard/organic-client-report-deck-helpers";
import {
  formatClientReportPeriodLine,
  normalizeClientReportPeriodLabel,
  normalizeClientReportText,
  sanitizeClientReportMetricValue,
} from "@/lib/organic-dashboard/organic-client-report-copy";

export type OrganicClientReportDeckInput = {
  viewModel: OrganicDashboardViewModel;
  highlights: OrganicReportingHighlights;
  siteName: string;
  siteUrl: string;
  showCompare: boolean;
  preparedOn: string;
};

export type OrganicClientReportDocumentProps = OrganicClientReportDeckInput;

export type OrganicClientReportKeywordRow = { query: string; clicks: string };

export type OrganicClientReportSemrushKeywordRow = {
  phrase: string;
  traffic: string;
  volume: string;
};

export type OrganicClientReportContent = {
  siteName: string;
  siteUrl: string;
  showCompare: boolean;
  preparedOn: string;
  periodLine: string;
  comparePeriodLabel: string;
  primaryPeriodLabel: string;
  highlights: OrganicReportingHighlights;
  summaryRows: DeckSummaryRow[];
  traffic: DeckSummaryRow[];
  search: DeckSummaryRow[];
  highlightStats: DeckHighlightStat[];
  topQueries: OrganicClientReportKeywordRow[];
  semrushDeckRows: DeckSummaryRow[];
  topSemrushKeywords: OrganicClientReportSemrushKeywordRow[];
  opportunities: OrganicDeckOpportunity[];
  hasSemrush: boolean;
  semrushDatabase: string;
  semrushOverviewUrl: string;
  semrushDomain: string;
  performanceNarrative: string[];
  keywordNarrative: string[];
  showPerformanceSection: boolean;
  showSemrushSection: boolean;
  showKeywordSection: boolean;
  showHighlightsSection: boolean;
};

function sanitizeSummaryRows(rows: DeckSummaryRow[]): DeckSummaryRow[] {
  return rows.map((row) => ({
    ...row,
    label: normalizeClientReportText(row.label),
    earlier: sanitizeClientReportMetricValue(row.earlier),
    later: sanitizeClientReportMetricValue(row.later),
  }));
}

function sanitizeHighlightsForClientReport(
  highlights: OrganicReportingHighlights,
): OrganicReportingHighlights {
  return {
    ...highlights,
    executiveSummary: normalizeClientReportText(highlights.executiveSummary),
    keyTakeaways: highlights.keyTakeaways.map((line) => normalizeClientReportText(line)),
    performanceNarrative: (highlights.performanceNarrative ?? []).map((p) => normalizeClientReportText(p)),
    keywordNarrative: (highlights.keywordNarrative ?? []).map((p) => normalizeClientReportText(p)),
    topOpportunities: highlights.topOpportunities.map((item) => ({
      ...item,
      label: normalizeClientReportText(item.label),
      why: normalizeClientReportText(item.why),
      metrics: normalizeClientReportText(item.metrics),
      comparisonRows: item.comparisonRows.map((row) => ({
        ...row,
        metric: normalizeClientReportText(row.metric),
        comparePeriodValue: sanitizeClientReportMetricValue(row.comparePeriodValue),
        primaryPeriodValue: sanitizeClientReportMetricValue(row.primaryPeriodValue),
      })),
    })),
  };
}

export function buildOrganicClientReportContent(input: OrganicClientReportDeckInput): OrganicClientReportContent {
  const { viewModel, highlights, siteName, siteUrl, showCompare, preparedOn } = input;

  const normalized =
    normalizeOrganicReportingHighlights(highlights) ??
    normalizeOrganicReportingHighlights({
      executiveSummary: "Organic performance summary",
      topOpportunities: [],
    })!;

  const summaryRows = sanitizeSummaryRows(buildHeadlineSummaryRows(viewModel, showCompare));
  const { traffic, search } = splitHeadlineSummaryRows(summaryRows);
  const highlightStats = pickDeckHighlightStats(viewModel, showCompare).map((stat) => ({
    ...stat,
    label: normalizeClientReportText(stat.label),
    value: sanitizeClientReportMetricValue(stat.value),
  }));
  const topQueries = viewModel.gscQueries.slice(0, 5).map((q) => ({
    query: q.query,
    clicks: sanitizeClientReportMetricValue(q.clicks),
  }));
  const semrushDeckRows = sanitizeSummaryRows(buildSemrushDeckSummaryRows(viewModel, showCompare));
  const topSemrushKeywords = viewModel.semrushKeywords.slice(0, 5).map((k) => ({
    phrase: k.phrase,
    traffic: sanitizeClientReportMetricValue(k.traffic),
    volume: sanitizeClientReportMetricValue(k.volume),
  }));
  const clientHighlights = sanitizeHighlightsForClientReport(normalized);
  const opportunities = clientHighlights.topOpportunities.slice(0, 4);
  const comparePeriodLabel = normalizeClientReportPeriodLabel(viewModel.periodLabels.compare);
  const primaryPeriodLabel = normalizeClientReportPeriodLabel(viewModel.periodLabels.primary);
  const performanceNarrative = clientHighlights.performanceNarrative ?? [];
  const keywordNarrative = clientHighlights.keywordNarrative ?? [];

  const periodLine = formatClientReportPeriodLine(showCompare, comparePeriodLabel, primaryPeriodLabel);

  const showSemrushSection =
    viewModel.hasSemrush && (semrushDeckRows.length > 0 || topSemrushKeywords.length > 0);

  return {
    siteName,
    siteUrl,
    showCompare,
    preparedOn,
    periodLine,
    comparePeriodLabel,
    primaryPeriodLabel,
    highlights: clientHighlights,
    summaryRows,
    traffic,
    search,
    highlightStats,
    topQueries,
    semrushDeckRows,
    topSemrushKeywords,
    opportunities,
    hasSemrush: viewModel.hasSemrush,
    semrushDatabase: viewModel.semrushDatabase,
    semrushOverviewUrl: viewModel.semrushOverviewUrl,
    semrushDomain: viewModel.semrushDomain,
    performanceNarrative,
    keywordNarrative,
    showPerformanceSection: summaryRows.length > 0,
    showSemrushSection,
    showKeywordSection: topQueries.length > 0,
    showHighlightsSection: highlightStats.length > 0 || opportunities.length > 0,
  };
}
