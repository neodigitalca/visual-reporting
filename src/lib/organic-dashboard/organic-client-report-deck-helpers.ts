import type {
  OrganicDashboardViewModel,
  OrganicGscMetricDelta,
} from "@/lib/organic-dashboard/organic-dashboard-view-model";

export type DeckSummaryRow = {
  label: string;
  earlier: string;
  later: string;
  delta: OrganicGscMetricDelta;
};

export type DeckHighlightAccent = "primary" | "clicks" | "impressions";

export type DeckHighlightStat = {
  label: string;
  value: string;
  delta: OrganicGscMetricDelta;
  accent: DeckHighlightAccent;
};

export type DeckOpportunityComparisonRow = {
  metric: string;
  comparePeriodValue: string;
  primaryPeriodValue: string;
};

export type SanitizedDeckOpportunity = {
  rank: number;
  label: string;
  why: string;
  comparisonRows: DeckOpportunityComparisonRow[];
  /** @deprecated Legacy prose metrics; not shown when comparisonRows exist. */
  metrics: string;
  action: string;
  evidence?: string[];
};

/** GA4 rows shown on the client deck (organic channel only, no site-wide duplicates). */
export const ORGANIC_GA4_DECK_LABELS = new Set([
  "Organic Search sessions",
  "Engaged sessions",
  "Engagement rate",
  "Key events (Organic Search sessions)",
]);

const SITE_WIDE_GA4_METRIC_KEYS = new Set([
  "total users",
  "new users",
  "key events",
  "user key event rate",
]);

/** Sentence split that does not break on decimals (e.g. 40.6%). */
export function splitDeckSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    buf += c;
    if (c !== "." && c !== "!" && c !== "?") continue;
    const prev = text[i - 1] ?? "";
    if (c === "." && /\d/.test(prev)) continue;
    const next = text[i + 1];
    if (next != null && next !== " " && next !== "\n" && i !== text.length - 1) continue;
    const trimmed = buf.trim();
    if (trimmed) out.push(trimmed);
    buf = "";
    while (text[i + 1] === " ") i++;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out.length > 0 ? out : [text.trim()];
}

export function plainDeckText(raw: string): string {
  return raw
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/#+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** @deprecated use plainDeckText */
export const plainTextSummary = plainDeckText;

function comparisonRowDedupeKey(metric: string): string | null {
  const k = metric.trim().toLowerCase();
  if (SITE_WIDE_GA4_METRIC_KEYS.has(k)) return null;
  if (k === "key events (organic search sessions)" || k.includes("organic search") && k.includes("key event")) {
    return "organic_key_events";
  }
  if (k === "clicks" || k.startsWith("click")) return "gsc_clicks";
  if (k === "impressions" || k.startsWith("impression")) return "gsc_impressions";
  if (k.includes("avg position") || k === "position") return "gsc_position";
  if (k.includes("ctr")) return "gsc_ctr";
  return k;
}

/** Drop site-wide GA4 metrics and duplicate row types (e.g. Key events + organic key events). */
export function dedupeOrganicComparisonRows(rows: DeckOpportunityComparisonRow[]): DeckOpportunityComparisonRow[] {
  const seen = new Set<string>();
  const out: DeckOpportunityComparisonRow[] = [];
  for (const row of rows) {
    const key = comparisonRowDedupeKey(row.metric);
    if (key == null || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= 4) break;
  }
  return out;
}

export function sanitizeDeckOpportunityComparisonRows(raw: unknown): DeckOpportunityComparisonRow[] {
  if (!Array.isArray(raw)) return [];
  const out: DeckOpportunityComparisonRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.metric !== "string") continue;
    if (typeof r.comparePeriodValue !== "string" || typeof r.primaryPeriodValue !== "string") continue;
    const metric = plainDeckText(r.metric);
    const comparePeriodValue = plainDeckText(r.comparePeriodValue);
    const primaryPeriodValue = plainDeckText(r.primaryPeriodValue);
    if (!metric || !comparePeriodValue || !primaryPeriodValue) continue;
    out.push({ metric, comparePeriodValue, primaryPeriodValue });
    if (out.length >= 6) break;
  }
  return dedupeOrganicComparisonRows(out);
}

export function sanitizeDeckOpportunity(row: {
  rank: number;
  label: string;
  why: string;
  comparisonRows?: DeckOpportunityComparisonRow[];
  metrics?: string;
  action?: string;
  evidence?: string[];
}): SanitizedDeckOpportunity {
  return {
    rank: row.rank,
    label: plainDeckText(row.label),
    why: plainDeckText(row.why),
    comparisonRows: row.comparisonRows ?? [],
    metrics: plainDeckText(row.metrics ?? ""),
    action: plainDeckText(row.action ?? ""),
    evidence: row.evidence?.map((e) => plainDeckText(e)).filter(Boolean),
  };
}

/** Split legacy single-block executive copy into headline + bullets for deck hero. */
export function deriveKeyTakeawaysFromSummary(summary: string): {
  headline: string;
  takeaways: string[];
} {
  const cleaned = plainDeckText(summary);
  if (!cleaned) {
    return {
      headline: "Organic performance summary",
      takeaways: [
        "Period-over-period metrics are in the performance summary below.",
        "Traffic figures use GA4; search visibility uses Google Search Console.",
      ],
    };
  }
  const sentences = splitDeckSentences(cleaned);
  if (sentences.length >= 3) {
    return { headline: sentences[0]!, takeaways: sentences.slice(1, 5) };
  }
  if (sentences.length === 2) {
    return { headline: sentences[0]!, takeaways: [sentences[1]!] };
  }
  return {
    headline: cleaned,
    takeaways: [
      "See the performance summary below for website traffic and search visibility changes.",
      "Opportunity cards highlight queries and themes worth acting on next.",
    ],
  };
}

export function parseDeckCountDisplay(value: string): number {
  const t = value.trim().replace(/,/g, "");
  if (t.endsWith("K") || t.endsWith("k")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isFinite(n) ? n * 1_000 : 0;
  }
  if (t.endsWith("M") || t.endsWith("m")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isFinite(n) ? n * 1_000_000 : 0;
  }
  const n = Number.parseFloat(t.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function buildHeadlineSummaryRows(
  viewModel: OrganicDashboardViewModel,
  showCompare: boolean,
): DeckSummaryRow[] {
  const emptyDelta = { deltaPercent: null, deltaPositive: null };
  const rows: DeckSummaryRow[] = [];

  for (const r of viewModel.ga4Table) {
    if (!ORGANIC_GA4_DECK_LABELS.has(r.label)) continue;
    rows.push({
      label: r.label,
      earlier: r.previous,
      later: r.current,
      delta: showCompare ? r.delta : emptyDelta,
    });
  }

  const gsc = viewModel.gscSummary;
  if (gsc) {
    rows.push(
      {
        label: "Total clicks",
        earlier: gsc.compareClicks,
        later: gsc.clicks,
        delta: showCompare ? gsc.clicksDelta : emptyDelta,
      },
      {
        label: "Total impressions",
        earlier: gsc.compareImpressions,
        later: gsc.impressions,
        delta: showCompare ? gsc.impressionsDelta : emptyDelta,
      },
      {
        label: "Average CTR",
        earlier: gsc.compareCtr,
        later: gsc.ctr,
        delta: showCompare ? gsc.ctrDelta : emptyDelta,
      },
      {
        label: "Average position",
        earlier: gsc.compareAvgPosition,
        later: gsc.avgPosition,
        delta: showCompare ? gsc.positionDelta : emptyDelta,
      },
    );
  }

  return rows;
}

export function buildSemrushDeckSummaryRows(
  viewModel: OrganicDashboardViewModel,
  showCompare: boolean,
): DeckSummaryRow[] {
  const s = viewModel.semrushSummary;
  if (!s) return [];
  const emptyDelta = { deltaPercent: null, deltaPositive: null };
  const rows: DeckSummaryRow[] = [
    {
      label: "Keywords",
      earlier: s.compareKeywords,
      later: s.keywords,
      delta: showCompare ? s.keywordsDelta : emptyDelta,
    },
    {
      label: "Est. organic traffic",
      earlier: s.compareTraffic,
      later: s.traffic,
      delta: showCompare ? s.trafficDelta : emptyDelta,
    },
    {
      label: "Traffic cost",
      earlier: s.compareTrafficCost,
      later: s.trafficCost,
      delta: showCompare ? s.trafficCostDelta : emptyDelta,
    },
  ];
  if (s.hasBrandedMetrics) {
    rows.push(
      {
        label: "Branded traffic",
        earlier: s.compareBrandedTraffic,
        later: s.brandedTraffic,
        delta: showCompare ? s.brandedDelta : emptyDelta,
      },
      {
        label: "Non-branded traffic",
        earlier: s.compareNonBrandedTraffic,
        later: s.nonBrandedTraffic,
        delta: showCompare ? s.nonBrandedDelta : emptyDelta,
      },
    );
  }
  return rows;
}

export function splitHeadlineSummaryRows(rows: DeckSummaryRow[]): {
  traffic: DeckSummaryRow[];
  search: DeckSummaryRow[];
} {
  const searchLabels = new Set([
    "Total clicks",
    "Total impressions",
    "Average CTR",
    "Average position",
  ]);
  const traffic: DeckSummaryRow[] = [];
  const search: DeckSummaryRow[] = [];
  for (const row of rows) {
    if (searchLabels.has(row.label)) search.push(row);
    else traffic.push(row);
  }
  return { traffic, search };
}

function accentForLabel(label: string): DeckHighlightAccent {
  if (label === "Total clicks") return "clicks";
  if (label === "Total impressions") return "impressions";
  return "primary";
}

/** Up to 3 headline KPIs with largest period change (for Highlights strip). */
export function pickDeckHighlightStats(
  viewModel: OrganicDashboardViewModel,
  showCompare: boolean,
): DeckHighlightStat[] {
  if (!showCompare) return [];

  const candidates: DeckHighlightStat[] = [];

  for (const r of viewModel.ga4Table) {
    if (r.delta.deltaPercent == null) continue;
    if (
      r.label === "Organic Search sessions" ||
      r.label === "Key events (Organic Search sessions)" ||
      r.label === "Engaged sessions"
    ) {
      candidates.push({
        label: r.label,
        value: r.current,
        delta: r.delta,
        accent: "primary",
      });
    }
  }

  const gsc = viewModel.gscSummary;
  if (gsc) {
    if (gsc.clicksDelta.deltaPercent != null) {
      candidates.push({
        label: "Total clicks",
        value: gsc.clicks,
        delta: gsc.clicksDelta,
        accent: "clicks",
      });
    }
    if (gsc.impressionsDelta.deltaPercent != null) {
      candidates.push({
        label: "Total impressions",
        value: gsc.impressions,
        delta: gsc.impressionsDelta,
        accent: "impressions",
      });
    }
  }

  const ranked = [...candidates].sort(
    (a, b) => (b.delta.deltaPercent ?? 0) - (a.delta.deltaPercent ?? 0),
  );

  const picked: DeckHighlightStat[] = [];
  const seenLabels = new Set<string>();
  for (const c of ranked) {
    if (picked.length >= 3) break;
    if (seenLabels.has(c.label)) continue;
    seenLabels.add(c.label);
    picked.push({ ...c, accent: accentForLabel(c.label) });
  }
  return picked;
}
