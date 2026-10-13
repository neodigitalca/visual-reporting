import type { CSSProperties, ReactNode } from "react";
import { OrganicMetricDelta } from "@/components/organic-dashboard/OrganicMetricDelta";
import {
  DECK_BULLET_LIST_CLASS,
  DECK_FOOTER_CLASS,
  DECK_GRID_BACKDROP_CLASS,
  DECK_HERO_BODY_CLASS,
  DECK_HERO_SHELL_CLASS,
  DECK_HERO_TITLE_BAND_CLASS,
  DECK_KPI_TILE_BASE_CLASS,
  DECK_NARRATIVE_WELL_CLASS,
  DECK_OPPORTUNITY_CARD_CLASS,
  DECK_PAGE_CLASS,
  DECK_PANEL_SHELL_CLASS,
  DECK_BODY_CLASS,
  DECK_BODY_MUTED_CLASS,
  DECK_H2_INSIGHTS_CLASS,
  DECK_H3_CLASS,
  DECK_H4_CLASS,
  DECK_LABEL_CLASS,
  DECK_LEAD_CLASS,
  DECK_SECTION_BODY_CLASS,
  DECK_SECTION_CLASS,
  DECK_SECTION_HEAD_CLASS,
} from "@/components/organic-dashboard/organic-client-report-deck-theme";
import {
  ORGANIC_GSC_CLICKS_COLOR,
  ORGANIC_GSC_IMPRESSIONS_COLOR,
} from "@/components/organic-dashboard/organic-dashboard-styles";
import type { OrganicDeckOpportunity } from "@/lib/organic-dashboard/organic-reporting-highlights";
import type { OrganicClientReportDocumentProps } from "@/lib/organic-dashboard/organic-client-report-content";
import { buildOrganicClientReportContent } from "@/lib/organic-dashboard/organic-client-report-content";
import {
  parseDeckCountDisplay,
  type DeckHighlightAccent,
  type DeckHighlightStat,
  type DeckOpportunityComparisonRow,
  type DeckSummaryRow,
} from "@/lib/organic-dashboard/organic-client-report-deck-helpers";
import {
  formatClientReportSemrushKeywordMeta,
  formatClientReportTopQueryMeta,
} from "@/lib/organic-dashboard/organic-client-report-copy";
import { AGENCY_NAME } from "@/lib/report-planner";
import { cn } from "@/lib/utils";

export type { OrganicClientReportDocumentProps };

function DeckSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className={cn(DECK_SECTION_CLASS, "organic-deck-pdf-section-start")}
      aria-labelledby={`deck-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className={cn(DECK_PANEL_SHELL_CLASS, "organic-deck-section-panel")}>
        <h2 id={`deck-section-${title.replace(/\s+/g, "-").toLowerCase()}`} className={DECK_SECTION_HEAD_CLASS}>
          {title}
        </h2>
        <div className={DECK_SECTION_BODY_CLASS}>{children}</div>
      </div>
    </section>
  );
}

function kpiTileStyle(accent: DeckHighlightAccent): { className: string; style?: CSSProperties } {
  if (accent === "clicks") {
    return {
      className: DECK_KPI_TILE_BASE_CLASS,
      style: { backgroundColor: ORGANIC_GSC_CLICKS_COLOR },
    };
  }
  if (accent === "impressions") {
    return {
      className: DECK_KPI_TILE_BASE_CLASS,
      style: { backgroundColor: ORGANIC_GSC_IMPRESSIONS_COLOR },
    };
  }
  return {
    className: cn(DECK_KPI_TILE_BASE_CLASS, "border border-primary/40 bg-card"),
  };
}

function DeckHighlightStatStrip({ stats }: { stats: DeckHighlightStat[] }) {
  if (stats.length === 0) return null;
  return (
    <ul
      className={cn(
        "organic-deck-kpi-strip grid gap-3",
        stats.length === 1 && "grid-cols-1",
        stats.length === 2 && "grid-cols-1 sm:grid-cols-2",
        stats.length >= 3 && "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {stats.map((stat) => {
        const tile = kpiTileStyle(stat.accent);
        return (
          <li key={stat.label} className={tile.className} style={tile.style}>
            <p className={DECK_LABEL_CLASS}>{stat.label}</p>
            <p className="text-3xl font-semibold tabular-nums text-white md:text-4xl">{stat.value}</p>
            <div className="text-white [&_.text-primary]:text-white [&_.text-destructive]:text-red-200">
              <OrganicMetricDelta delta={stat.delta} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Client-friendly vertical metric blocks (Earlier / Change / Later under each label). */
function DeckMetricStack({
  groupTitle,
  rows,
  showCompare,
  comparePeriodLabel,
  primaryPeriodLabel,
}: {
  groupTitle: string;
  rows: DeckSummaryRow[];
  showCompare: boolean;
  comparePeriodLabel: string;
  primaryPeriodLabel: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="organic-deck-metric-stack">
      <h3 className={DECK_H3_CLASS}>{groupTitle}</h3>
      <ul className="mt-4 flex list-none flex-col divide-y divide-white/10 p-0">
        {rows.map((row) => (
          <li key={row.label} className="py-4 first:pt-0 last:pb-0">
            <h4 className={DECK_H4_CLASS}>{row.label}</h4>
            {showCompare ? (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                <div>
                  <p className={cn(DECK_LABEL_CLASS, "normal-case tracking-normal")}>{comparePeriodLabel}</p>
                  <p className="mt-1 text-base tabular-nums text-white">{row.earlier}</p>
                </div>
                <div>
                  <p className={DECK_LABEL_CLASS}>Change</p>
                  <div className="mt-1">
                    <OrganicMetricDelta delta={row.delta} />
                  </div>
                </div>
                <div>
                  <p className={cn(DECK_LABEL_CLASS, "normal-case tracking-normal")}>{primaryPeriodLabel}</p>
                  <p className="mt-1 text-base tabular-nums font-semibold text-white">{row.later}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-base tabular-nums font-semibold text-white">{row.later}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckSemrushKeywordList({
  keywords,
}: {
  keywords: Array<{ phrase: string; traffic: string; volume: string }>;
}) {
  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {keywords.map((k) => (
        <li key={k.phrase} className="rounded-none bg-zinc-900 p-4 md:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className={DECK_H4_CLASS}>{k.phrase}</h4>
            <p className="text-base tabular-nums text-primary">
              {formatClientReportSemrushKeywordMeta(k.traffic, k.volume)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DeckKeywordList({
  queries,
  primaryPeriodLabel,
}: {
  queries: Array<{ query: string; clicks: string }>;
  primaryPeriodLabel: string;
}) {
  const values = queries.map((q) => parseDeckCountDisplay(q.clicks));
  const max = Math.max(...values, 1);
  return (
    <ul className="organic-deck-query-list flex list-none flex-col gap-3 p-0">
      {queries.map((q, i) => {
        const wPct = Math.max(8, (values[i]! / max) * 100);
        return (
          <li key={q.query} className="rounded-none bg-zinc-900 p-4 md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h4 className={DECK_H4_CLASS}>{q.query}</h4>
              <p className="text-base tabular-nums text-primary">
                {formatClientReportTopQueryMeta(q.clicks, primaryPeriodLabel)}
              </p>
            </div>
            <div className="mt-3 h-2 w-full rounded-none bg-white/10" aria-hidden>
              <div className="h-full rounded-none bg-primary" style={{ width: `${wPct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DeckNarrativeBlock({
  title,
  paragraphs,
  emptyHint,
}: {
  title: string;
  paragraphs: string[];
  emptyHint?: string;
}) {
  return (
    <div className={DECK_NARRATIVE_WELL_CLASS}>
      <h3 className={DECK_H3_CLASS}>{title}</h3>
      {paragraphs.length > 0 ? (
        paragraphs.map((paragraph) => (
          <p key={paragraph} className={DECK_BODY_CLASS}>
            {paragraph}
          </p>
        ))
      ) : emptyHint ? (
        <p className={DECK_BODY_MUTED_CLASS}>{emptyHint}</p>
      ) : null}
    </div>
  );
}

function DeckOpportunityPeriodTable({
  rows,
  comparePeriodLabel,
  primaryPeriodLabel,
  legacyMetrics,
}: {
  rows: DeckOpportunityComparisonRow[];
  comparePeriodLabel: string;
  primaryPeriodLabel: string;
  legacyMetrics: string;
}) {
  if (rows.length === 0) {
    if (!legacyMetrics.trim()) return null;
    return <p className="mt-2 text-base tabular-nums text-white">{legacyMetrics}</p>;
  }
  return (
    <div className="mt-3 overflow-hidden rounded-none border border-white/10 bg-black/40">
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-zinc-950 px-3 py-2">
        <span className={DECK_LABEL_CLASS}>Metric</span>
        <span className={cn(DECK_LABEL_CLASS, "normal-case tracking-normal")}>{comparePeriodLabel}</span>
        <span className={cn(DECK_LABEL_CLASS, "normal-case tracking-normal")}>{primaryPeriodLabel}</span>
      </div>
      <ul className="m-0 list-none p-0">
        {rows.map((row) => (
          <li
            key={`${row.metric}-${row.comparePeriodValue}-${row.primaryPeriodValue}`}
            className="grid grid-cols-3 gap-2 border-b border-white/10 px-3 py-3 last:border-b-0"
          >
            <span className={DECK_H4_CLASS}>{row.metric}</span>
            <span className="text-base tabular-nums text-white">{row.comparePeriodValue}</span>
            <span className="text-base tabular-nums font-semibold text-primary">{row.primaryPeriodValue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckOpportunityCard({
  item,
  comparePeriodLabel,
  primaryPeriodLabel,
}: {
  item: OrganicDeckOpportunity;
  comparePeriodLabel: string;
  primaryPeriodLabel: string;
}) {
  return (
    <li
      className={cn(
        DECK_OPPORTUNITY_CARD_CLASS,
        "organic-deck-opportunity-card list-none border-l-4 border-primary pl-5 md:pl-6",
      )}
    >
      <h3 className={DECK_H3_CLASS}>{item.label}</h3>
      <div className="mt-5 flex flex-col gap-5">
        <section>
          <h4 className={DECK_LABEL_CLASS}>Period comparison</h4>
          <DeckOpportunityPeriodTable
            rows={item.comparisonRows}
            comparePeriodLabel={comparePeriodLabel}
            primaryPeriodLabel={primaryPeriodLabel}
            legacyMetrics={item.metrics}
          />
        </section>
        <section>
          <h4 className={DECK_LABEL_CLASS}>Why it matters</h4>
          <p className={cn("mt-2", DECK_BODY_CLASS)}>{item.why}</p>
        </section>
      </div>
    </li>
  );
}

export function OrganicClientReportDocument(props: OrganicClientReportDocumentProps) {
  const content = buildOrganicClientReportContent(props);
  const {
    siteName,
    siteUrl,
    showCompare,
    preparedOn,
    periodLine,
    highlights: normalized,
    comparePeriodLabel,
    primaryPeriodLabel,
    performanceNarrative,
    keywordNarrative,
    traffic,
    search,
    topQueries,
    semrushDeckRows,
    topSemrushKeywords,
    highlightStats,
    opportunities,
    showPerformanceSection,
    showSemrushSection,
    showKeywordSection,
    showHighlightsSection,
  } = content;
  const { viewModel } = props;
  const summaryRows = content.summaryRows;

  return (
    <article className={DECK_PAGE_CLASS}>
      <header className={cn(DECK_SECTION_CLASS, "pb-0 pt-5")}>
        <div className={cn(DECK_HERO_SHELL_CLASS, "organic-deck-hero-shell")}>
          <div className={cn(DECK_GRID_BACKDROP_CLASS, "organic-deck-grid-backdrop")} aria-hidden />
          <div className={cn(DECK_HERO_TITLE_BAND_CLASS, "relative z-[1]")}>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <span>{AGENCY_NAME}</span>
              <span className="opacity-80">·</span>
              <span>Organic performance report</span>
              <span className="opacity-80">·</span>
              <h1 className="inline text-inherit font-inherit tracking-tight">{siteName}</h1>
            </div>
            <p className="tabular-nums">
              <span>{periodLine}</span>
              <span className="mx-2 opacity-80">|</span>
              <span>Prepared {preparedOn}</span>
            </p>
          </div>
          <div className={cn(DECK_HERO_BODY_CLASS, "relative z-[1]")}>
            <h2 className={DECK_H2_INSIGHTS_CLASS}>Insights</h2>
            <p className={DECK_LEAD_CLASS}>{normalized.executiveSummary}</p>
            {normalized.keyTakeaways.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className={DECK_H3_CLASS}>Key takeaways</h3>
                <ul className={DECK_BULLET_LIST_CLASS}>
                  {normalized.keyTakeaways.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {showPerformanceSection ? (
        <DeckSection title="Performance summary">
          <div>
            <p className={DECK_BODY_MUTED_CLASS}>
              Headline metrics for the selected periods. Organic search traffic comes from GA4 (Organic Search channel);
              search visibility from Google Search Console.
            </p>
            {showCompare ? (
              <p className="mt-3 tabular-nums text-white/80">
                {comparePeriodLabel} vs {primaryPeriodLabel}
              </p>
            ) : null}
          </div>
          <DeckNarrativeBlock title="Performance breakdown" paragraphs={performanceNarrative} />
          <DeckMetricStack
            groupTitle="Website traffic (GA4)"
            rows={traffic}
            showCompare={showCompare}
            comparePeriodLabel={comparePeriodLabel}
            primaryPeriodLabel={primaryPeriodLabel}
          />
          <DeckMetricStack
            groupTitle="Search visibility (GSC)"
            rows={search}
            showCompare={showCompare}
            comparePeriodLabel={comparePeriodLabel}
            primaryPeriodLabel={primaryPeriodLabel}
          />
        </DeckSection>
      ) : null}

      {showSemrushSection ? (
        <DeckSection title="Semrush estimates">
          <p className={DECK_BODY_MUTED_CLASS}>
            Semrush domain overview estimates (not Google Search Console clicks). Regional database:{" "}
            {viewModel.semrushDatabase.toUpperCase()}.
            {viewModel.semrushOverviewUrl ? (
              <>
                {" "}
                Full report: {viewModel.semrushOverviewUrl}
              </>
            ) : null}
          </p>
          <DeckMetricStack
            groupTitle="Organic visibility (Semrush)"
            rows={semrushDeckRows}
            showCompare={showCompare}
            comparePeriodLabel={comparePeriodLabel}
            primaryPeriodLabel={primaryPeriodLabel}
          />
          {topSemrushKeywords.length > 0 ? (
            <>
              <p className={cn(DECK_BODY_MUTED_CLASS, "mt-4")}>
                Top organic keywords by estimated traffic for {viewModel.semrushDomain || siteUrl}.
              </p>
              <DeckSemrushKeywordList keywords={topSemrushKeywords} />
            </>
          ) : null}
        </DeckSection>
      ) : null}

      {showKeywordSection ? (
        <DeckSection title="Keyword performance">
          <DeckNarrativeBlock
            title="Keyword performance breakdown"
            paragraphs={keywordNarrative}
            emptyHint="Keyword analysis is generated when you export Client report (DeepSeek report agent). Refresh this tab if export was interrupted."
          />
          <p className={DECK_BODY_MUTED_CLASS}>
            Top queries by clicks in {primaryPeriodLabel}. Align titles, headings, and internal links with terms that
            already earn clicks.
          </p>
          <DeckKeywordList queries={topQueries} primaryPeriodLabel={primaryPeriodLabel} />
        </DeckSection>
      ) : null}

      {showHighlightsSection ? (
        <DeckSection title="Highlights">
          <DeckHighlightStatStrip stats={highlightStats} />
          {opportunities.length > 0 ? (
            <ul className="flex list-none flex-col gap-5 p-0">
              {opportunities.map((item) => (
                <DeckOpportunityCard
                  key={`${item.rank}-${item.label}`}
                  item={item}
                  comparePeriodLabel={comparePeriodLabel}
                  primaryPeriodLabel={primaryPeriodLabel}
                />
              ))}
            </ul>
          ) : null}
        </DeckSection>
      ) : null}

      <footer className={DECK_FOOTER_CLASS}>
        <span className="min-w-0 truncate text-muted-foreground">{siteUrl}</span>
        <span className="font-medium text-primary">{AGENCY_NAME}</span>
        <span className="tabular-nums text-muted-foreground">Prepared {preparedOn}</span>
      </footer>
    </article>
  );
}
