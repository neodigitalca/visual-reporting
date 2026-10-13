import type { WordPressSite } from "@/components/integrations/types";
import { extractEndpointFromEntitySitemapUrl } from "@/lib/entity-endpoint-extractor";
import { sitemapOptimizerEntityCollectionLabel } from "@/lib/sitemap-optimizer/sitemap-optimizer-toolbar-copy";
import type { SitemapOptimizerCollectionKey } from "@/lib/sitemap-optimizer/types";
import {
  customScopeIdFromLabel,
  restCollectionsForCustomTag,
} from "@/lib/sitemap-child-tags";

export type SitemapOptimizerCollectionOption = {
  key: SitemapOptimizerCollectionKey;
  label: string;
  restCollection: string;
  restCollections?: string[];
  enabled: boolean;
};

export function buildSitemapOptimizerCollectionOptions(
  site: WordPressSite | null | undefined,
): SitemapOptimizerCollectionOption[] {
  const entityUrl = site?.entitySitemapUrl?.trim() ?? "";
  const entityEndpoint = entityUrl ? extractEndpointFromEntitySitemapUrl(entityUrl) : "";
  const hasEntity =
    Boolean(entityUrl) &&
    entityEndpoint.length > 0 &&
    entityEndpoint !== "posts" &&
    entityEndpoint !== "pages" &&
    entityEndpoint !== "post" &&
    entityEndpoint !== "page";

  const options: SitemapOptimizerCollectionOption[] = [
    { key: "posts", label: "Posts", restCollection: "posts", enabled: true },
    { key: "pages", label: "Pages", restCollection: "pages", enabled: true },
    {
      key: "entity",
      label: hasEntity ? sitemapOptimizerEntityCollectionLabel(entityEndpoint) : "SAP",
      restCollection: hasEntity ? entityEndpoint : "",
      enabled: hasEntity,
    },
  ];

  for (const label of site?.customSitemapTagLabels ?? []) {
    const collections = site ? restCollectionsForCustomTag(site, label) : [];
    options.push({
      key: customScopeIdFromLabel(label) as SitemapOptimizerCollectionKey,
      label,
      restCollection: collections[0] ?? "",
      restCollections: collections,
      enabled: collections.length > 0,
    });
  }

  return options;
}

export function restCollectionsFromSelectedKeys(
  options: SitemapOptimizerCollectionOption[],
  selected: Set<SitemapOptimizerCollectionKey>,
): string[] {
  const out: string[] = [];
  for (const opt of options) {
    if (!selected.has(opt.key) || !opt.enabled) continue;
    const cols = opt.restCollections?.length
      ? opt.restCollections
      : opt.restCollection.trim()
        ? [opt.restCollection]
        : [];
    for (const coll of cols) {
      if (!out.includes(coll)) out.push(coll);
    }
  }
  return out;
}
