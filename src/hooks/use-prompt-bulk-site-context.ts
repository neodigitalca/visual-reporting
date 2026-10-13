import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WordPressSite } from "@/components/integrations/types";
import {
  createBulkGscKeywordsHostedLink,
  revokeBulkGscKeywordsHostedLink,
  type BulkGscKeywordsHostedLink,
} from "@/lib/bulk/bulk-gsc-keywords-hosted-link";
import { getGscSixMonthCompetitorDateRange } from "@/lib/competitor-research/competitor-gsc-queries";
import {
  buildPromptBulkIdeasContextForSite,
  buildPromptBulkIdeasContextFromWarm,
  fetchPromptIdeasGscQueries,
  type PromptBulkIdeasContext,
} from "@/lib/bulk/prompt-bulk-ideas-context";
import type { PromptBulkSitemapInventoryLink } from "@/lib/bulk/prompt-bulk-sitemap-inventory";
import { useOverviewSiteWarmDetails } from "@/hooks/overview/use-overview-site-warm-details";
import { getEntitySiteWarmCacheIfReady } from "@/lib/local-analysis/entity-site-warm-cache";

export type PromptBulkSiteContextState = {
  sitemapInventoryLinks: PromptBulkSitemapInventoryLink[];
  gscHostedLink: BulkGscKeywordsHostedLink | null;
  sitemapInventoryLoading: boolean;
  ideasContext: PromptBulkIdeasContext | null;
  promptSiteContextReady: boolean;
};

export function usePromptBulkSiteContext(
  site: WordPressSite | null | undefined,
): PromptBulkSiteContextState {
  const warm = useOverviewSiteWarmDetails(site ?? undefined);
  const [ideasContext, setIdeasContext] = useState<PromptBulkIdeasContext | null>(null);
  const [promptGscLoading, setPromptGscLoading] = useState(false);
  const [gscHostedLink, setGscHostedLink] = useState<BulkGscKeywordsHostedLink | null>(null);
  const gscLinkRef = useRef<BulkGscKeywordsHostedLink | null>(null);

  const commitGscHostedLink = useCallback((siteUrl: string, queries: Awaited<ReturnType<typeof fetchPromptIdeasGscQueries>>) => {
    revokeBulkGscKeywordsHostedLink(gscLinkRef.current);
    if (!siteUrl || queries.length === 0) {
      gscLinkRef.current = null;
      setGscHostedLink(null);
      return;
    }
    const link = createBulkGscKeywordsHostedLink(
      siteUrl,
      queries,
      getGscSixMonthCompetitorDateRange(),
    );
    gscLinkRef.current = link;
    setGscHostedLink(link);
  }, []);

  useEffect(() => {
    if (!site?.id) {
      setIdeasContext(null);
      setPromptGscLoading(false);
      revokeBulkGscKeywordsHostedLink(gscLinkRef.current);
      gscLinkRef.current = null;
      setGscHostedLink(null);
      return;
    }
    if (warm.sitemapInventoryLoading) return;

    const bundle = getEntitySiteWarmCacheIfReady(site.id);
    if (!bundle || bundle.error) {
      setIdeasContext(null);
      return;
    }

    let cancelled = false;
    setPromptGscLoading(true);
    void (async () => {
      try {
        const queries = await fetchPromptIdeasGscQueries(site);
        if (cancelled) return;
        commitGscHostedLink(site.siteUrl?.trim() ?? "", queries);
        setIdeasContext(buildPromptBulkIdeasContextFromWarm(site, bundle, queries));
      } catch {
        if (!cancelled) {
          setIdeasContext(null);
          commitGscHostedLink("", []);
        }
      } finally {
        if (!cancelled) setPromptGscLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    site,
    warm.sitemapInventoryLoading,
    warm.sitemapInventoryLinks.length,
    commitGscHostedLink,
  ]);

  useEffect(() => {
    return () => {
      revokeBulkGscKeywordsHostedLink(gscLinkRef.current);
    };
  }, []);

  const sitemapInventoryLoading = warm.sitemapInventoryLoading || promptGscLoading;

  const promptSiteContextReady = useMemo(() => {
    if (!site?.id) return true;
    if (sitemapInventoryLoading) return false;
    return Boolean(ideasContext?.isReady);
  }, [site?.id, sitemapInventoryLoading, ideasContext?.isReady]);

  return {
    sitemapInventoryLinks: warm.sitemapInventoryLinks,
    gscHostedLink,
    sitemapInventoryLoading,
    ideasContext,
    promptSiteContextReady,
  };
}
