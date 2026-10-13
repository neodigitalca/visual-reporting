import type { OrganicClientReportContent } from "@/lib/organic-dashboard/organic-client-report-content";
import { organicClientReportPdfFileName } from "@/lib/organic-dashboard/organic-client-report-pdf-filename";
import type { DeckSummaryRow } from "@/lib/organic-dashboard/organic-client-report-deck-helpers";
import type { OrganicDeckOpportunity } from "@/lib/organic-dashboard/organic-reporting-highlights";
import {
  CLIENT_REPORT_DELTA_EMPTY,
  formatClientReportSemrushKeywordMeta,
  formatClientReportTopQueryMeta,
  normalizeClientReportText,
} from "@/lib/organic-dashboard/organic-client-report-copy";
import { AGENCY_NAME } from "@/lib/report-planner";

function escapeMdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function metricRowsMarkdown(
  rows: DeckSummaryRow[],
  showCompare: boolean,
  compareLabel: string,
  primaryLabel: string,
): string {
  if (rows.length === 0) return "";
  if (!showCompare) {
    return rows.map((r) => `- **${r.label}:** ${r.later}`).join("\n");
  }
  const lines = [
    "| Metric | " + escapeMdCell(compareLabel) + " | Change | " + escapeMdCell(primaryLabel) + " |",
    "| --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    const change =
      row.delta.deltaPercent == null
        ? CLIENT_REPORT_DELTA_EMPTY
        : `${row.delta.deltaPositive ? "+" : ""}${row.delta.deltaPercent.toFixed(1)}%`;
    lines.push(
      `| ${escapeMdCell(row.label)} | ${escapeMdCell(row.earlier)} | ${change} | ${escapeMdCell(row.later)} |`,
    );
  }
  return lines.join("\n");
}

function opportunityMarkdown(
  item: OrganicDeckOpportunity,
  compareLabel: string,
  primaryLabel: string,
): string {
  const parts = [`### ${item.label}`, "", "**Why it matters**", "", item.why, ""];
  if (item.comparisonRows.length > 0) {
    parts.push("**Period comparison**", "");
    parts.push(
      "| Metric | " + escapeMdCell(compareLabel) + " | " + escapeMdCell(primaryLabel) + " |",
      "| --- | --- | --- |",
    );
    for (const row of item.comparisonRows) {
      parts.push(
        `| ${escapeMdCell(row.metric)} | ${escapeMdCell(row.comparePeriodValue)} | ${escapeMdCell(row.primaryPeriodValue)} |`,
      );
    }
    parts.push("");
  } else if (item.metrics.trim()) {
    parts.push(item.metrics, "");
  }
  return parts.join("\n");
}

export function serializeOrganicClientReportMarkdown(content: OrganicClientReportContent): string {
  const {
    siteName,
    siteUrl,
    showCompare,
    preparedOn,
    periodLine,
    highlights,
    comparePeriodLabel,
    primaryPeriodLabel,
    traffic,
    search,
    topQueries,
    semrushDeckRows,
    topSemrushKeywords,
    highlightStats,
    opportunities,
    semrushDatabase,
    semrushOverviewUrl,
    semrushDomain,
    performanceNarrative,
    keywordNarrative,
    showPerformanceSection,
    showSemrushSection,
    showKeywordSection,
    showHighlightsSection,
  } = content;

  const blocks: string[] = [
    `# ${siteName} Organic Performance`,
    "",
    `- **Agency:** ${AGENCY_NAME}`,
    `- **Site:** ${siteUrl}`,
    `- **Periods:** ${periodLine}`,
    `- **Prepared:** ${preparedOn}`,
    "",
    "## Insights",
    "",
    normalizeClientReportText(highlights.executiveSummary),
    "",
  ];

  if (highlights.keyTakeaways.length > 0) {
    blocks.push("### Key takeaways", "");
    for (const line of highlights.keyTakeaways) {
      blocks.push(`- ${line}`);
    }
    blocks.push("");
  }

  if (showPerformanceSection) {
    blocks.push("## Performance summary", "");
    blocks.push(
      "Headline metrics for the selected periods. Organic search traffic comes from GA4 (Organic Search channel); search visibility from Google Search Console.",
      "",
    );
    if (performanceNarrative.length > 0) {
      blocks.push("### Performance breakdown", "");
      for (const p of performanceNarrative) {
        blocks.push(p, "");
      }
    }
    blocks.push("### Website traffic (GA4)", "");
    blocks.push(metricRowsMarkdown(traffic, showCompare, comparePeriodLabel, primaryPeriodLabel), "");
    blocks.push("### Search visibility (GSC)", "");
    blocks.push(metricRowsMarkdown(search, showCompare, comparePeriodLabel, primaryPeriodLabel), "");
  }

  if (showSemrushSection) {
    blocks.push("## Semrush estimates", "");
    blocks.push(
      `Semrush domain overview estimates (not Google Search Console clicks). Regional database: ${semrushDatabase.toUpperCase()}.` +
        (semrushOverviewUrl ? ` Full report: ${semrushOverviewUrl}` : ""),
      "",
    );
    blocks.push("### Organic visibility (Semrush)", "");
    blocks.push(metricRowsMarkdown(semrushDeckRows, showCompare, comparePeriodLabel, primaryPeriodLabel), "");
    if (topSemrushKeywords.length > 0) {
      blocks.push(
        `Top organic keywords by estimated traffic for ${semrushDomain || siteUrl}:`,
        "",
      );
      for (const k of topSemrushKeywords) {
        blocks.push(
          `- **${k.phrase}:** ${formatClientReportSemrushKeywordMeta(k.traffic, k.volume)}`,
        );
      }
      blocks.push("");
    }
  }

  if (showKeywordSection) {
    blocks.push("## Keyword performance", "");
    if (keywordNarrative.length > 0) {
      blocks.push("### Keyword performance breakdown", "");
      for (const p of keywordNarrative) {
        blocks.push(p, "");
      }
    }
    blocks.push(`Top queries by clicks in ${primaryPeriodLabel}:`, "");
    for (const q of topQueries) {
      blocks.push(`- **${q.query}:** ${formatClientReportTopQueryMeta(q.clicks, primaryPeriodLabel)}`);
    }
    blocks.push("");
  }

  if (showHighlightsSection) {
    blocks.push("## Highlights", "");
    if (highlightStats.length > 0) {
      for (const stat of highlightStats) {
        const change =
          stat.delta.deltaPercent == null
            ? ""
            : ` (${stat.delta.deltaPositive ? "+" : ""}${stat.delta.deltaPercent.toFixed(1)}%)`;
        blocks.push(`- **${stat.label}:** ${stat.value}${change}`);
      }
      blocks.push("");
    }
    for (const item of opportunities) {
      blocks.push(opportunityMarkdown(item, comparePeriodLabel, primaryPeriodLabel));
    }
  }

  blocks.push("---", "", `*${AGENCY_NAME} | Prepared ${preparedOn}*`);

  return blocks.join("\n").trim() + "\n";
}

export function organicClientReportMarkdownFileName(siteName: string): string {
  return organicClientReportPdfFileName(siteName).replace(/\.pdf$/i, ".md");
}

export function downloadOrganicClientReportMarkdown(content: OrganicClientReportContent): void {
  const markdown = serializeOrganicClientReportMarkdown(content);
  const fileName = organicClientReportMarkdownFileName(content.siteName);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
