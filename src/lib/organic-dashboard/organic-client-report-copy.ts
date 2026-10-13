/** Client report / export copy: no em or en dashes; SEO-friendly labels. */

export const CLIENT_REPORT_DELTA_EMPTY = "n/a";

const EM_DASH = /\u2014/g;
const EN_DASH = /\u2013/g;
const UNICODE_DASH = /[\u2010-\u2015\u2212]/g;

export function normalizeClientReportText(value: string): string {
  return value
    .replace(EM_DASH, ", ")
    .replace(EN_DASH, "-")
    .replace(UNICODE_DASH, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeClientReportPeriodLabel(label: string): string {
  return label.replace(EN_DASH, "-").replace(EM_DASH, "-").replace(/\s*→\s*/g, " vs ").trim();
}

export function formatClientReportPeriodLine(
  showCompare: boolean,
  comparePeriodLabel: string,
  primaryPeriodLabel: string,
): string {
  const primary = normalizeClientReportPeriodLabel(primaryPeriodLabel);
  if (!showCompare) return primary;
  const compare = normalizeClientReportPeriodLabel(comparePeriodLabel);
  return `${compare} vs ${primary}`;
}

export function sanitizeClientReportMetricValue(value: string): string {
  if (value.trim() === "\u2014" || value.trim() === "-") return CLIENT_REPORT_DELTA_EMPTY;
  return normalizeClientReportText(value);
}

export function formatClientReportTopQueryMeta(clicks: string, primaryPeriodLabel: string): string {
  const period = normalizeClientReportPeriodLabel(primaryPeriodLabel);
  return `${sanitizeClientReportMetricValue(clicks)} clicks (${period})`;
}

export function formatClientReportSemrushKeywordMeta(traffic: string, volume: string): string {
  return `${sanitizeClientReportMetricValue(traffic)} est. traffic, vol. ${sanitizeClientReportMetricValue(volume)}`;
}

export function formatClientReportCoverTitle(agencyName: string, siteName: string): string {
  return `${agencyName} | Organic performance report | ${siteName}`;
}
