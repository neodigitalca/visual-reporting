import React, { useMemo } from "react";
import { SEO_WORKSPACE_BODY_SCROLL_CLASS } from "@/components/seo/seo-workspace-layout";
import { PROFILE_BODY, PROFILE_CARD, PROFILE_CARD_HEAD, PROFILE_CARD_TITLE } from "@/components/hosting/site-profile/site-profile-theme";
import { cn } from "@/lib/utils";
import type { WordPressSite } from "../types";
import { buildWordPressPropertySections } from "./buildWordPressPropertySections";
import { PropertyProfileHeader } from "./PropertyProfileHeader";
import { PropertyProfileNav } from "./PropertyProfileNav";
import { SavePropertyButton } from "./SavePropertyButton";
import type { PropertySettingsSubSectionId } from "./property-settings-types";
import type { WordPressSiteAdminSectionId } from "./WordPressSiteAdminLayout";

export type PropertyProfilePageProps = {
  site: WordPressSite;
  onBack: () => void;
  activeSectionId: WordPressSiteAdminSectionId;
  onActiveSectionChange: (id: WordPressSiteAdminSectionId) => void;
  settingsSubSectionId: PropertySettingsSubSectionId;
  onSettingsSubSectionChange: (id: PropertySettingsSubSectionId) => void;
  siteSettingsPanel: React.ReactNode;
  isTesting: boolean;
  isDetecting: boolean;
  isFetchingScheduled: boolean;
  isScrapingSitemap: Record<string, boolean>;
  isGeneratingEntities?: Record<string, boolean>;
  isIndexingSitemap?: Record<string, boolean>;
  isLoadingCalendar?: Record<string, boolean>;
  isExtractingNAPAndGraph?: boolean;
  onTest: () => void;
  onDetect: () => void;
  onScrapeChildSitemap: (childSitemapUrl: string) => void;
  onEntityGeneration?: (sitemapUrl: string) => void;
  onSetEntitySitemap?: (sitemapUrl: string) => void;
  onSetCompetitorEntitySitemap?: (sitemapUrl: string) => void;
  onToggleChildSitemapDisabled?: (childSitemapUrl: string) => void;
  onAppendManualChildSitemap?: (url: string) => void;
  onAddCustomSitemapTagLabel?: (label: string) => void;
  onToggleChildSystemRole?: (
    childSitemapUrl: string,
    role: import("@/lib/sitemap-child-tags").SitemapSystemRole,
  ) => void;
  onToggleChildCustomTag?: (childSitemapUrl: string, label: string) => void;
  onIndexSitemap?: (sitemapUrl: string) => void;
  onLoadCalendarPosts?: (sitemapUrl: string) => void;
  onExtractNAPAndGraph?: () => void;
  getScrapingKey: (siteId: string, sitemapUrl: string) => string;
  onPatchSite?: (siteId: string, patch: Partial<WordPressSite>) => void;
  onSaveProperty?: () => void;
};

export function PropertyProfilePage({
  site,
  onBack,
  activeSectionId,
  onActiveSectionChange,
  settingsSubSectionId,
  onSettingsSubSectionChange,
  siteSettingsPanel,
  isTesting,
  isDetecting,
  isFetchingScheduled,
  isScrapingSitemap,
  isGeneratingEntities = {},
  isIndexingSitemap = {},
  isLoadingCalendar = {},
  isExtractingNAPAndGraph = false,
  onTest,
  onDetect,
  onScrapeChildSitemap,
  onEntityGeneration,
  onSetEntitySitemap,
  onSetCompetitorEntitySitemap,
  onToggleChildSitemapDisabled,
  onAppendManualChildSitemap,
  onAddCustomSitemapTagLabel,
  onToggleChildSystemRole,
  onToggleChildCustomTag,
  onIndexSitemap,
  onLoadCalendarPosts,
  onExtractNAPAndGraph,
  getScrapingKey,
  onPatchSite,
  onSaveProperty,
}: PropertyProfilePageProps): React.ReactElement {
  const sections = useMemo(
    () =>
      buildWordPressPropertySections({
        site,
        isTesting,
        isDetecting,
        isFetchingScheduled,
        isScrapingSitemap,
        isGeneratingEntities,
        isIndexingSitemap,
        isLoadingCalendar,
        isExtractingNAPAndGraph,
        onTest,
        onDetect,
        onScrapeChildSitemap,
        onEntityGeneration,
        onSetEntitySitemap,
        onSetCompetitorEntitySitemap,
        onToggleChildSitemapDisabled,
        onAppendManualChildSitemap,
        onAddCustomSitemapTagLabel,
        onToggleChildSystemRole,
        onToggleChildCustomTag,
        onIndexSitemap,
        onLoadCalendarPosts,
        onExtractNAPAndGraph,
        getScrapingKey,
        onPatchSite,
        shell: "modal",
        siteSettingsPanel,
      }),
    [
      site,
      isTesting,
      isDetecting,
      isFetchingScheduled,
      isScrapingSitemap,
      isGeneratingEntities,
      isIndexingSitemap,
      isLoadingCalendar,
      isExtractingNAPAndGraph,
      onTest,
      onDetect,
      onScrapeChildSitemap,
      onEntityGeneration,
      onSetEntitySitemap,
      onSetCompetitorEntitySitemap,
      onToggleChildSitemapDisabled,
      onAppendManualChildSitemap,
      onAddCustomSitemapTagLabel,
      onToggleChildSystemRole,
      onToggleChildCustomTag,
      onIndexSitemap,
      onLoadCalendarPosts,
      onExtractNAPAndGraph,
      getScrapingKey,
      onPatchSite,
      siteSettingsPanel,
    ],
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];
  const isSettings = activeSection.id === "site-settings";

  function openTags() {
    onActiveSectionChange("site-settings");
    onSettingsSubSectionChange("profile");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-3 font-sans text-base md:px-5 md:pt-4">
      <PropertyProfileHeader site={site} onBack={onBack} onOpenTags={openTags} />
      <div className={cn(SEO_WORKSPACE_BODY_SCROLL_CLASS, PROFILE_BODY, "pb-4")}>
        <PropertyProfileNav
          sections={sections.map((s) => ({ id: s.id, label: s.label }))}
          activeSectionId={activeSection.id}
          settingsSubSectionId={settingsSubSectionId}
          onSectionChange={onActiveSectionChange}
          onSettingsSubSectionChange={onSettingsSubSectionChange}
        />
        <div className="min-w-0">
          {activeSection.id === "overview" ? (
            activeSection.content
          ) : (
            <section className={PROFILE_CARD} aria-label={activeSection.label}>
              <div className={PROFILE_CARD_HEAD}>
                <h2 className={PROFILE_CARD_TITLE}>{activeSection.label}</h2>
                {isSettings && onSaveProperty ? <SavePropertyButton className="h-8" onClick={onSaveProperty} /> : null}
              </div>
              <div className="flex min-w-0 flex-col px-5 py-4">{activeSection.content}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
