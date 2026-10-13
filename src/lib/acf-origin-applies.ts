import { acfCompetitorAppliesForRow } from '@/lib/acf-competitor-applies';

/** ACF Origin is for entity/SAP service-area pages only, not standard blog posts. */
export function acfOriginAppliesForSitemapType(sitemapType: string | undefined): boolean {
  return sitemapType === "entity";
}

/** Origin ACF for SAP entity rows only (not competitor-comparison entity rows). */
export function acfOriginAppliesForRow(
  keyword: string | undefined,
  sitemapType: string | undefined,
): boolean {
  return acfOriginAppliesForSitemapType(sitemapType) && !acfCompetitorAppliesForRow(keyword);
}
