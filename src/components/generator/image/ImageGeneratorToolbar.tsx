import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneratorToolbarFrame } from "@/components/blog-generator/GeneratorToolbarFrame";
import { GENERATOR_SELECT, GENERATOR_TOOLBAR_SLOT_RESERVE } from "@/components/blog-generator/generator-toolbar-theme";
import { BULK_HEADER_ICON_TOOL_BTN } from "@/components/keyword-research/bulk/bulk-workspace-header-styles";
import { IMAGE_MODEL_PRESETS } from "@/lib/image-model-defaults";
import { ImageGeneratorRunButton } from "@/components/generator/image/ImageGeneratorRunButton";
import type { UseImageGeneratorResult } from "@/components/generator/image/image-generator-types";
import { cn } from "@/lib/utils";

type ImageGeneratorToolbarProps = Pick<
  UseImageGeneratorResult,
  | "imageSourceMode"
  | "setImageSourceMode"
  | "selectedSection"
  | "setSelectedSection"
  | "availableSections"
  | "imageModel"
  | "setImageModel"
  | "isCustomModel"
  | "setIsCustomModel"
  | "hasApiKey"
  | "hasGeneratedChecklist"
  | "isGeneratingChecklist"
  | "isGenerating"
  | "imageDisplayUrl"
  | "handleGenerateChecklist"
  | "handleGenerateImage"
  | "handleDownload"
  | "handleCopy"
> & {
  workspaceBusy?: boolean;
};

export function ImageGeneratorToolbar({
  imageSourceMode,
  setImageSourceMode,
  selectedSection,
  setSelectedSection,
  availableSections,
  imageModel,
  setImageModel,
  isCustomModel,
  setIsCustomModel,
  hasApiKey,
  hasGeneratedChecklist,
  isGeneratingChecklist,
  isGenerating,
  imageDisplayUrl,
  handleGenerateChecklist,
  handleGenerateImage,
  handleDownload,
  handleCopy,
  workspaceBusy = false,
}: ImageGeneratorToolbarProps) {
  const controlsDisabled = workspaceBusy || isGenerating || isGeneratingChecklist;
  const isSolo = imageSourceMode === "solo";
  const showSectionSelect = imageSourceMode === "section";

  return (
    <GeneratorToolbarFrame
      primary={
        <>
          <Select
            value={imageSourceMode}
            onValueChange={(v) => setImageSourceMode(v as UseImageGeneratorResult["imageSourceMode"])}
            disabled={controlsDisabled}
          >
            <SelectTrigger className={GENERATOR_SELECT} aria-label="Source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem className="text-base" value="featured">
                Featured
              </SelectItem>
              <SelectItem className="text-base" value="section">
                Section
              </SelectItem>
              <SelectItem className="text-base" value="solo">
                Solo
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={showSectionSelect ? (selectedSection ?? "") : ""}
            onValueChange={(v) => setSelectedSection(v || null)}
            disabled={!showSectionSelect || controlsDisabled || availableSections.length === 0}
          >
            <SelectTrigger
              className={cn(GENERATOR_SELECT, !showSectionSelect && GENERATOR_TOOLBAR_SLOT_RESERVE)}
              aria-label="Section"
              aria-hidden={!showSectionSelect}
              tabIndex={showSectionSelect ? 0 : -1}
            >
              <SelectValue placeholder={showSectionSelect && availableSections.length === 0 ? "No sections" : "Section"} />
            </SelectTrigger>
            <SelectContent position="popper">
              {availableSections.map((section, index) => (
                <SelectItem key={index} className="text-base" value={section.header}>
                  {section.header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={isCustomModel ? "custom" : imageModel}
            onValueChange={(value) => {
              if (value === "custom") {
                setIsCustomModel(true);
              } else {
                setIsCustomModel(false);
                setImageModel(value);
              }
            }}
            disabled={controlsDisabled}
          >
            <SelectTrigger className={cn(GENERATOR_SELECT, "w-auto min-w-[9rem]")} aria-label="Image model">
              <SelectValue placeholder="Image model" />
            </SelectTrigger>
            <SelectContent position="popper">
              {IMAGE_MODEL_PRESETS.map((preset) => (
                <SelectItem key={preset.value} className="text-base" value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem className="text-base" value="custom">
                Custom model
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_ICON_TOOL_BTN}
            disabled={!imageDisplayUrl || workspaceBusy || isGenerating}
            aria-label="Download image"
            title="Download image"
            onClick={() => void handleDownload()}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_ICON_TOOL_BTN}
            disabled={!imageDisplayUrl || workspaceBusy || isGenerating}
            aria-label="Copy image"
            title="Copy image"
            onClick={() => void handleCopy()}
          >
            <Copy className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
          <ImageGeneratorRunButton
            hasApiKey={hasApiKey}
            hasGeneratedChecklist={hasGeneratedChecklist}
            isGeneratingChecklist={isGeneratingChecklist}
            isGenerating={isGenerating}
            workspaceBusy={workspaceBusy}
            skipChecklist={isSolo}
            onGenerateChecklist={() => void handleGenerateChecklist()}
            onGenerateImage={() => void handleGenerateImage()}
          />
        </>
      }
    />
  );
}
