import type { WordPressSite } from "@/components/integrations/types";

/** Prefer a child sitemap that looks like pages; otherwise first enabled child or main index. */
export function resolvePagesSitemapUrl(site: WordPressSite): string | null {
  const disabled = new Set(site.sitemaps?.disabledChildSitemapUrls ?? []);
  const childSitemaps = (site.sitemaps?.childSitemaps ?? []).filter((url) => !disabled.has(url));
  const tags = site.sitemaps?.childTagsByUrl ?? {};

  const taggedPages = childSitemaps.find((url) => tags[url]?.roles?.includes("pages"));
  if (taggedPages) return taggedPages;

  const pageLike =
    childSitemaps.find((url) => /page-sitemap|pages-sitemap|\/page/i.test(url)) ??
    childSitemaps.find((url) => !/post-sitemap|product-sitemap|category-sitemap/i.test(url));

  if (pageLike) return pageLike;

  const mainUrl = site.sitemaps?.mainSitemapUrl?.trim();
  return mainUrl || null;
}
