import { describe, expect, it } from "vitest";
import {
  ensureClusterGscQueries,
  gscQueryRowsFromInventoryBuckets,
  mergeGscQueriesWithInventoryFallback,
} from "@/lib/local-analysis/entity-gsc-inventory-fallback";
import type { PromptBulkSitemapInventoryBuckets } from "@/lib/bulk/prompt-bulk-sitemap-inventory";
import { stringifyContentBucketPostsJson } from "@/lib/bulk/inventory-json-slim";

function emptyBuckets(): PromptBulkSitemapInventoryBuckets {
  return {
    pages: { json: "", rowCount: 0 },
    posts: { json: "", rowCount: 0 },
    sap: { json: "", rowCount: 0 },
  };
}

describe("entity-gsc-inventory-fallback", () => {
  it("builds synthetic GSC rows from post titles when GSC is empty", () => {
    const buckets = emptyBuckets();
    buckets.posts = {
      rowCount: 2,
      json: stringifyContentBucketPostsJson("posts", [
        { id: 1, slug: "family-law-edmonton", title: "Family Law Edmonton", link: "https://example.com/family-law-edmonton/" },
        { id: 2, slug: "divorce-lawyer", title: "Divorce Lawyer", link: "https://example.com/divorce-lawyer/" },
      ]),
    };
    const rows = gscQueryRowsFromInventoryBuckets(buckets);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.query.toLowerCase().includes("family"))).toBe(true);
    expect(rows[0]).toMatchObject({ clicks: 0, impressions: 1 });
  });

  it("prefers real GSC queries when present", () => {
    const buckets = emptyBuckets();
    buckets.posts = {
      rowCount: 1,
      json: stringifyContentBucketPostsJson("posts", [
        { id: 1, slug: "ignored", title: "Ignored Title", link: "https://example.com/ignored/" },
      ]),
    };
    const gsc = [{ query: "real gsc query", clicks: 5, impressions: 100, ctr: 0.05, position: 3 }];
    expect(mergeGscQueriesWithInventoryFallback(gsc, buckets)).toEqual(gsc);
  });

  it("uses toolbar seeds when GSC and inventory are empty", () => {
    const buckets = emptyBuckets();
    const rows = ensureClusterGscQueries([], buckets, {
      focusKeyword: "family law",
      locationLabel: "Edmonton, AB",
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.query.toLowerCase().includes("family"))).toBe(true);
  });

  it("derives keywords from plain URL lines when bucket has no JSON posts", () => {
    const buckets = emptyBuckets();
    buckets.pages = {
      rowCount: 1,
      json: "https://example.com/criminal-defense-lawyer/\n",
    };
    const rows = gscQueryRowsFromInventoryBuckets(buckets);
    expect(rows.some((r) => r.query.includes("criminal defense"))).toBe(true);
  });
});
