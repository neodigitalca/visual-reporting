import React from "react";
import type { WordPressSite } from "@/components/integrations/types";
import type { BlogGeneratorSectionId } from "@/components/blog-generator/blog-generator-sections";
import {
  LocalAnalysisPanel,
  type LocalAnalysisWorkspaceControls,
} from "@/components/sap-generator/LocalAnalysisPanel";
import { CompetitorAnalysisPanel } from "@/components/competitor-generator/CompetitorAnalysisPanel";
import type { EntityGeneratorSubmode } from "@/components/sap-generator/entity-generator-submode";
import { BLOG_GENERATOR_TAB_ROOT_CLASS } from "@/components/keyword-research/blog-generator-tab-classes";

export interface SapGeneratorContentProps {
  localAnalysisSite: WordPressSite;
  localAnalysisWorkspaceKey: string;
  localAnalysisWorkspace: LocalAnalysisWorkspaceControls;
  entitySubmode: EntityGeneratorSubmode;
  onEntitySubmodeChange: (mode: EntityGeneratorSubmode) => void;
  activeSection: BlogGeneratorSectionId;
  onSectionChange: (id: BlogGeneratorSectionId) => void;
  apiKey: string;
  dataForSEOApiKey: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  flowPurpose?: string;
}

export const SapGeneratorContent: React.FC<SapGeneratorContentProps> = ({
  localAnalysisSite,
  localAnalysisWorkspaceKey,
  localAnalysisWorkspace,
  entitySubmode,
  onEntitySubmodeChange,
  activeSection,
  onSectionChange,
  apiKey,
  dataForSEOApiKey,
  selectedModel,
  temperature,
  maxTokens,
  topP,
  flowPurpose,
}) => (
  <div className={BLOG_GENERATOR_TAB_ROOT_CLASS}>
    {entitySubmode === "locations" ? (
      <LocalAnalysisPanel
        key={`locations:${localAnalysisWorkspaceKey}`}
        site={localAnalysisSite}
        workspace={localAnalysisWorkspace}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        entitySubmode={entitySubmode}
        onEntitySubmodeChange={onEntitySubmodeChange}
        apiKey={apiKey}
        dataForSEOApiKey={dataForSEOApiKey}
        selectedModel={selectedModel}
        temperature={temperature}
        maxTokens={maxTokens}
        topP={topP}
        flowPurpose={flowPurpose}
      />
    ) : (
      <CompetitorAnalysisPanel
        key={`competitors:${localAnalysisWorkspaceKey}`}
        site={localAnalysisSite}
        workspace={localAnalysisWorkspace}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        entitySubmode={entitySubmode}
        onEntitySubmodeChange={onEntitySubmodeChange}
      />
    )}
  </div>
);
