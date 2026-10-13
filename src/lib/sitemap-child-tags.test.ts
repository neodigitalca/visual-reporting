import { describe, expect, it } from "vitest";
import type { WordPressSite } from "@/components/integrations/types";
import {
  applyChildTagPatch,
  customScopeIdFromLabel,
  inferSystemRolesFromChildUrl,
  mergeAutoChildTagsOnDetect,
  normalizeCustomSitemapTagLabel,
  restCollectionsForCustomTag,
  toggleChildSystemRole,
} from "@/lib/sitemap-child-tags";

function baseSite(overrides: Partial<WordPressSite> = {}): WordPressSite {
  return {
    id: "1",
    name: "Test",
    siteUrl: "https://example.com",
    username: "u",
    appPassword: "p",
    connectedAt: 0,
    sitemaps: {
      mainSitemapUrl: "https://example.com/sitemap_index.xml",
      detectedAt: 0,
      type: "index",
      childSitemaps: [
        "https://example.com/page-sitemap.xml",
        "https://example.com/post-sitemap.xml",
        "https://example.com/service-areas-sitemap.xml",
      ],
      endpoints: {
        "https://example.com/service-areas-sitemap.xml": "service-areas",
      },
    },
    ...overrides,
  };
}

describe("sitemap-child-tags", () => {
  it("infers pages and posts from filenames", () => {
    expect(inferSystemRolesFromChildUrl("https://x.com/page-sitemap.xml")).toEqual(["pages"]);
    expect(inferSystemRolesFromChildUrl("https://x.com/post-sitemap.xml")).toEqual(["posts"]);
  });

  it("mergeAutoChildTagsOnDetect preserves manual entries", () => {
    const site = baseSite({
      sitemaps: {
        ...baseSite().sitemaps!,
        childTagsByUrl: {
          "https://example.com/page-sitemap.xml": { roles: ["posts"], custom: [] },
        },
      },
    });
    const merged = mergeAutoChildTagsOnDetect(site, site.sitemaps!);
    expect(merged.childTagsByUrl?.["https://example.com/page-sitemap.xml"]?.roles).toEqual([
      "posts",
    ]);
    expect(merged.childTagsByUrl?.["https://example.com/post-sitemap.xml"]?.roles).toEqual([
      "posts",
    ]);
  });

  it("syncs entitySitemapUrl when entity role toggled", () => {
    const site = baseSite();
    const url = "https://example.com/service-areas-sitemap.xml";
    const next = toggleChildSystemRole(site, url, "entity");
    expect(next.entitySitemapUrl).toBe(url);
    const cleared = toggleChildSystemRole(next, url, "entity");
    expect(cleared.entitySitemapUrl).toBeUndefined();
  });

  it("custom tag scope id is stable", () => {
    expect(customScopeIdFromLabel("Service Areas")).toBe("custom:service-areas");
  });

  it("restCollectionsForCustomTag uses endpoints map", () => {
    const site = applyChildTagPatch(baseSite(), "https://example.com/service-areas-sitemap.xml", {
      roles: [],
      custom: [normalizeCustomSitemapTagLabel("Locations")],
    });
    const withVocab = {
      ...site,
      customSitemapTagLabels: ["Locations"],
    };
    expect(restCollectionsForCustomTag(withVocab, "Locations")).toEqual(["service-areas"]);
  });
});
