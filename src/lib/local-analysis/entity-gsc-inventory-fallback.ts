import type { GscSiteQueryRow } from "@/lib/competitor-research/types";
import type { PromptBulkSitemapInventoryBuckets } from "@/lib/bulk/prompt-bulk-sitemap-inventory";
import {
  compactInventoryKeywordsForJson,
  parseCompactInventoryUrls,
  parseContentBucketRichRows,
} from "@/lib/bulk/inventory-json-slim";
import { isOffensiveGscQuery } from "@/lib/gsc-offensive-word-blocklist";
import type { OverviewSitemapSource } from "@/lib/overview/overview-sitemap-source";

const INVENTORY_SOURCES: OverviewSitemapSource[] = ["pages", "posts", "sap"];

function slugKeywordFromInventoryUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const pathname = new URL(trimmed).pathname;
    const segment = pathname.split("/").filter(Boolean).pop() ?? "";
    if (!segment) return "";
    return decodeURIComponent(segment).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function inventoryKeywordCandidatesFromBucketJson(json: string): string[] {
  const block = json.trim();
  if (!block) return [];
  const rich = parseContentBucketRichRows(block);
  if (rich.length > 0) {
    return compactInventoryKeywordsForJson(rich);
  }
  const urls = parseCompactInventoryUrls(block);
  const fromSlugs: string[] = [];
  for (const url of urls) {
    const kw = slugKeywordFromInventoryUrl(url);
    if (kw) fromSlugs.push(kw);
  }
  return fromSlugs;
}

/** Synthetic GSC-shaped rows from sitemap inventory when Search Console has no queries yet. */
export function gscQueryRowsFromInventoryBuckets(
  buckets: PromptBulkSitemapInventoryBuckets,
  limit = 500,
): GscSiteQueryRow[] {
  const seen = new Set<string>();
  const out: GscSiteQueryRow[] = [];
  for (const source of INVENTORY_SOURCES) {
    const json = buckets[source]?.json ?? "";
    for (const keyword of inventoryKeywordCandidatesFromBucketJson(json)) {
      const q = keyword.trim().replace(/\s+/g, " ");
      if (q.length < 2 || isOffensiveGscQuery(q)) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        query: q,
        clicks: 0,
        impressions: 1,
        ctr: 0,
        position: 50,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function mergeGscQueriesWithInventoryFallback(
  gscQueries: GscSiteQueryRow[],
  buckets: PromptBulkSitemapInventoryBuckets,
): GscSiteQueryRow[] {
  if (gscQueries.length > 0) return gscQueries;
  return gscQueryRowsFromInventoryBuckets(buckets);
}

export type EntityClusterKeywordSeedArgs = {
  focusKeyword?: string;
  businessName?: string;
  locationLabel?: string;
  siteName?: string;
};

function pushSeedPhrase(seen: Set<string>, phrases: string[], raw: string): void {
  const q = raw.trim().replace(/\s+/g, " ");
  if (q.length < 2 || isOffensiveGscQuery(q)) return;
  const key = q.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  phrases.push(q);
}

/** Last-resort GSC-shaped queries from toolbar focus, business name, and location. */
export function gscQueryRowsFromClusterSeeds(
  args: EntityClusterKeywordSeedArgs,
  limit = 48,
): GscSiteQueryRow[] {
  const seen = new Set<string>();
  const phrases: string[] = [];
  const focus = args.focusKeyword?.trim() ?? "";
  const business = args.businessName?.trim() ?? "";
  const location = args.locationLabel?.trim() ?? "";
  const siteName = args.siteName?.trim() ?? "";

  pushSeedPhrase(seen, phrases, focus);
  pushSeedPhrase(seen, phrases, business);
  pushSeedPhrase(seen, phrases, siteName);
  if (focus && location) pushSeedPhrase(seen, phrases, `${focus} ${location}`);
  if (business && location) pushSeedPhrase(seen, phrases, `${business} ${location}`);
  if (location) pushSeedPhrase(seen, phrases, location);
  pushSeedPhrase(seen, phrases, "local services");
  pushSeedPhrase(seen, phrases, "professional services");

  return phrases.slice(0, limit).map((query) => ({
    query,
    clicks: 0,
    impressions: 1,
    ctr: 0,
    position: 50,
  }));
}

/** GSC queries for Clusters: real GSC, then inventory titles/slugs, then toolbar seeds. */
export function ensureClusterGscQueries(
  gscQueries: GscSiteQueryRow[],
  buckets: PromptBulkSitemapInventoryBuckets,
  seeds: EntityClusterKeywordSeedArgs,
): GscSiteQueryRow[] {
  const fromInventory = mergeGscQueriesWithInventoryFallback(gscQueries, buckets);
  if (fromInventory.length > 0) return fromInventory;
  return gscQueryRowsFromClusterSeeds(seeds);
}
