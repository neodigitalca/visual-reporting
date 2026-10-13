import type { SitemapOptimizerCollectionOption } from "@/lib/sitemap-optimizer/collection-options";
import {
  SITEMAP_OPTIMIZER_PAGES_LABEL,
  SITEMAP_OPTIMIZER_POSTS_LABEL,
  SITEMAP_OPTIMIZER_SAP_LABEL,
} from "@/lib/sitemap-optimizer/sitemap-optimizer-toolbar-copy";
import type { SitemapOptimizerCollectionKey } from "@/lib/sitemap-optimizer/types";
import { isCustomSitemapOptimizerCollectionKey } from "@/lib/sitemap-optimizer/types";
import { SitemapScopeDropdown } from "@/components/shared/SitemapScopeDropdown";

const INVENTORY_PILL_LABELS: Partial<Record<SitemapOptimizerCollectionKey, string>> = {
  posts: SITEMAP_OPTIMIZER_POSTS_LABEL,
  pages: SITEMAP_OPTIMIZER_PAGES_LABEL,
  entity: SITEMAP_OPTIMIZER_SAP_LABEL,
};

export type SitemapPlanCollectionPillsProps = {
  collectionOptions: SitemapOptimizerCollectionOption[];
  selected: Set<SitemapOptimizerCollectionKey>;
  selectCollection: (key: SitemapOptimizerCollectionKey) => void;
  disabled?: boolean;
};

export function SitemapPlanCollectionPills({
  collectionOptions,
  selected,
  selectCollection,
  disabled = false,
}: SitemapPlanCollectionPillsProps) {
  const activeKey = [...selected][0] ?? "posts";
  const dropdownOptions = collectionOptions.map((opt) => ({
    id: opt.key,
    label: isCustomSitemapOptimizerCollectionKey(opt.key)
      ? opt.label
      : (INVENTORY_PILL_LABELS[opt.key] ?? opt.label),
    disabled: !opt.enabled,
  }));

  return (
    <SitemapScopeDropdown
      options={dropdownOptions}
      value={activeKey}
      onChange={(id) => selectCollection(id as SitemapOptimizerCollectionKey)}
      ariaLabel="Sitemap inventory"
      disabled={disabled}
    />
  );
}
