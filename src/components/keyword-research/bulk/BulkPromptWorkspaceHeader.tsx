import { type ReactNode } from "react";
import { CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlogGeneratorWorkspaceChrome } from "@/components/blog-generator/BlogGeneratorWorkspaceChrome";
import { GeneratorToolbarFrame } from "@/components/blog-generator/GeneratorToolbarFrame";
import {
  GENERATOR_FIELD_COUNT,
  GENERATOR_FIELD_FLEX,
  GENERATOR_FIELD_KEYWORD,
  GENERATOR_SELECT,
} from "@/components/blog-generator/generator-toolbar-theme";
import type { BlogGeneratorSectionId } from "@/components/blog-generator/blog-generator-sections";
import { BulkGeneratorRunActions } from "@/components/keyword-research/bulk/BulkGeneratorRunActions";
import { BulkGeneratorDetailsDrawer } from "@/components/keyword-research/bulk/BulkGeneratorDetailsDrawer";
import type { BulkGeneratorDetailsPanelProps } from "@/components/keyword-research/bulk/BulkGeneratorDetailsPanel";
import { BULK_HEADER_RUN_BTN } from "@/components/keyword-research/bulk/bulk-workspace-header-styles";
import type { MetaBulkMicroSnapshot } from "@/components/overview/OverviewBulkMicroProgress";
import type { WordPressPostDestination } from "@/lib/bulk-auto-generate";
import { WORDPRESS_POST_DESTINATION_SHORT } from "@/lib/bulk-auto-generate";


type FeaturedImageMode = "off" | "ai-generated" | "google-maps";

export type BulkPromptWorkspaceHeaderProps = {
  activeSection: BlogGeneratorSectionId;
  onSectionChange: (id: BlogGeneratorSectionId) => void;
  workspaceBusy: boolean;
  progressSnapshot: MetaBulkMicroSnapshot | null;
  canOpenDetails: boolean;
  isProcessing: boolean;
  generalIntent: string;
  onGeneralIntentChange: (v: string) => void;
  numberOfBlogs: number;
  onNumberOfBlogsChange: (v: number) => void;
  optionalPrompt: string;
  onOptionalPromptChange: (v: string) => void;
  featuredImagePerBlog: boolean;
  onFeaturedImagePerBlogChange: (v: boolean) => void;
  featuredImageType: "ai-generated" | "google-maps";
  onFeaturedImageTypeChange: (v: "ai-generated" | "google-maps") => void;
  isGeneratingChecklist: boolean;
  hasGeneratedChecklist: boolean;
  onGenerateChecklist: () => void;
  onApprove: () => void;
  postDestination: WordPressPostDestination;
  onPostDestinationChange: (v: WordPressPostDestination) => void;
  postDestinationChoices: WordPressPostDestination[];
  onCancel: () => void;
  onClear: () => void;
  scheduleMenu?: ReactNode;
  sitemapScopeSlot?: ReactNode;
  /** Connected site selected but warm inventory/GSC not ready yet. */
  promptSiteContextBlocked?: boolean;
  detailsProps: BulkGeneratorDetailsPanelProps;
  onDetailsOpenChange?: (open: boolean) => void;
};

export function BulkPromptWorkspaceHeader({
  activeSection,
  onSectionChange,
  workspaceBusy,
  progressSnapshot,
  canOpenDetails,
  isProcessing,
  generalIntent,
  onGeneralIntentChange,
  numberOfBlogs,
  onNumberOfBlogsChange,
  optionalPrompt,
  onOptionalPromptChange,
  featuredImagePerBlog,
  onFeaturedImagePerBlogChange,
  featuredImageType,
  onFeaturedImageTypeChange,
  isGeneratingChecklist,
  hasGeneratedChecklist,
  onGenerateChecklist,
  onApprove,
  postDestination,
  onPostDestinationChange,
  postDestinationChoices,
  onCancel,
  onClear,
  scheduleMenu,
  sitemapScopeSlot,
  promptSiteContextBlocked = false,
  detailsProps,
  onDetailsOpenChange,
}: BulkPromptWorkspaceHeaderProps) {
  const featuredImageMode: FeaturedImageMode = featuredImagePerBlog ? featuredImageType : "off";

  const handleFeaturedImageMode = (value: FeaturedImageMode) => {
    if (value === "off") {
      onFeaturedImagePerBlogChange(false);
      return;
    }
    onFeaturedImagePerBlogChange(true);
    onFeaturedImageTypeChange(value);
  };

  return (
    <BlogGeneratorWorkspaceChrome
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      sectionSwitchDisabled={isProcessing}
      titleRowMenu={sitemapScopeSlot}
      workspaceBusy={workspaceBusy}
      progressSnapshot={progressSnapshot}
      canOpenDetails={canOpenDetails}
      isProcessing={isProcessing}
      detailsPanelId="bulk-prompt-details-panel"
      onDetailsOpenChange={onDetailsOpenChange}
      toolbar={
        <GeneratorToolbarFrame
          primary={
            <>
              <Input
                type="text"
                placeholder="General intent / topic"
                value={generalIntent}
                onChange={(e) => onGeneralIntentChange(e.target.value)}
                className={GENERATOR_FIELD_FLEX}
                disabled={workspaceBusy}
                autoComplete="off"
                aria-label="General intent or content topic"
              />
              <Input
                type="number"
                min={1}
                step={1}
                value={numberOfBlogs}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n) && n >= 1) onNumberOfBlogsChange(n);
                }}
                className={GENERATOR_FIELD_COUNT}
                disabled={workspaceBusy}
                aria-label="Number of blogs"
                title="Number of blogs"
              />
              <Input
                type="text"
                placeholder="Tone, audience"
                value={optionalPrompt}
                onChange={(e) => onOptionalPromptChange(e.target.value)}
                className={GENERATOR_FIELD_KEYWORD}
                disabled={workspaceBusy}
                autoComplete="off"
                aria-label="Optional prompt modifier"
              />
            </>
          }
          options={
            <>
              <Select
                value={featuredImageMode}
                onValueChange={(v) => handleFeaturedImageMode(v as FeaturedImageMode)}
                disabled={workspaceBusy}
              >
                <SelectTrigger className={GENERATOR_SELECT} aria-label="Image">
                  <SelectValue placeholder="Image" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem className="text-base" value="ai-generated">
                    AI image
                  </SelectItem>
                  <SelectItem className="text-base" value="google-maps">
                    Google Maps
                  </SelectItem>
                  <SelectItem className="text-base" value="off">
                    None
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={postDestination}
                onValueChange={(v) => onPostDestinationChange(v as WordPressPostDestination)}
                disabled={workspaceBusy}
              >
                <SelectTrigger className={GENERATOR_SELECT} aria-label="Destination">
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {postDestinationChoices.map((choice) => (
                    <SelectItem key={choice} className="text-base" value={choice}>
                      {WORDPRESS_POST_DESTINATION_SHORT[choice]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scheduleMenu}
            </>
          }
          actions={
            <BulkGeneratorRunActions
              isProcessing={isProcessing}
              canRun={false}
              workspaceBusy={workspaceBusy}
              onRun={() => {}}
              onCancel={onCancel}
              onClear={onClear}
              hideRunButton
              trailing={
                <Button
                  type="button"
                  size="sm"
                  className={BULK_HEADER_RUN_BTN}
                  disabled={
                    workspaceBusy ||
                    promptSiteContextBlocked ||
                    isGeneratingChecklist ||
                    (hasGeneratedChecklist && isProcessing)
                  }
                  aria-label={hasGeneratedChecklist ? "Approve" : "Ideas"}
                  title={hasGeneratedChecklist ? "Approve" : "Ideas"}
                  onClick={hasGeneratedChecklist ? onApprove : onGenerateChecklist}
                >
                  {hasGeneratedChecklist ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {hasGeneratedChecklist ? "Approve" : "Ideas"}
                </Button>
              }
            />
          }
        />
      }
      detailsPanel={<BulkGeneratorDetailsDrawer {...detailsProps} />}
    />
  );
}
