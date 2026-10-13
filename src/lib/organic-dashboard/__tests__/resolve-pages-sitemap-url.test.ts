import { describe, expect, it } from "vitest";
import { resolvePagesSitemapUrl } from "@/lib/organic-dashboard/resolve-pages-sitemap-url";
import type { WordPressSite } from "@/components/integrations/types";

function baseSite(overrides: Partial<WordPressSite> = {}): WordPressSite {
  return {
    id: "1",
    name: "Test",
    siteUrl: "https://example.com",
    username: "u",
    appPassword: "p",
    connectedAt: 0,
    ...overrides,
  };
}

describe("resolvePagesSitemapUrl", () => {
  it("prefers child sitemap tagged as pages", () => {
    const site = baseSite({
      sitemaps: {
        mainSitemapUrl: "https://example.com/sitemap_index.xml",
        detectedAt: 0,
        type: "index",
        childSitemaps: [
          "https://example.com/post-sitemap.xml",
          "https://example.com/page-sitemap.xml",
        ],
        childTagsByUrl: {
          "https://example.com/page-sitemap.xml": { roles: ["pages"], custom: [] },
        },
      },
    });
    expect(resolvePagesSitemapUrl(site)).toBe("https://example.com/page-sitemap.xml");
  });

  it("falls back to main sitemap when no children", () => {
    const site = baseSite({
      sitemaps: {
        mainSitemapUrl: "https://example.com/sitemap.xml",
        detectedAt: 0,
        type: "urlset",
      },
    });
    expect(resolvePagesSitemapUrl(site)).toBe("https://example.com/sitemap.xml");
  });
});
