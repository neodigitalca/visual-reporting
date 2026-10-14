import { useRef } from "react";
import { Loader2, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneratorToolbarFrame } from "@/components/blog-generator/GeneratorToolbarFrame";
import {
  GENERATOR_EXPORT_BTN,
  GENERATOR_FIELD_COUNT,
  GENERATOR_FIELD_KEYWORD,
  GENERATOR_FIELD_URL,
} from "@/components/blog-generator/generator-toolbar-theme";
import {
  BULK_HEADER_DANGER_ICON_BTN,
  BULK_HEADER_RUN_BTN,
  BULK_HEADER_TOOL_BTN,
  BULK_HEADER_UPLOAD_READY_BTN,
} from "@/components/keyword-research/bulk/bulk-workspace-header-styles";
import {
  normalizeCompetitorBudgetInputChange,
  stepCompetitorBudgetInput,
} from "@/components/competitor-generator/competitor-budget-input";
import { cn } from "@/lib/utils";

export type CompetitorGeneratorToolbarProps = {
  workspaceBusy: boolean;
  csvParsing: boolean;
  uploadLabel: string;
  sapPageBudgetInput: string;
  onSapPageBudgetInputChange: (v: string) => void;
  suggestFocusKeyword: string;
  onSuggestFocusKeywordChange: (v: string) => void;
  runLoading: boolean;
  onPickFile: (file: File | null) => void;
  onRunClusters: () => void;
  onClear: () => void;
  hasSapRowsForCsv: boolean;
  onDownloadTargetsCsv: () => void;
  showTempUrl?: boolean;
  tempSeedUrl?: string;
  onTempSeedUrlChange?: (v: string) => void;
};

export function CompetitorGeneratorToolbar({
  workspaceBusy,
  csvParsing,
  uploadLabel,
  sapPageBudgetInput,
  onSapPageBudgetInputChange,
  suggestFocusKeyword,
  onSuggestFocusKeywordChange,
  runLoading,
  onPickFile,
  onRunClusters,
  onClear,
  hasSapRowsForCsv,
  onDownloadTargetsCsv,
  showTempUrl = false,
  tempSeedUrl = "",
  onTempSeedUrlChange,
}: CompetitorGeneratorToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fieldsDisabled = workspaceBusy || runLoading;
  return (
    <GeneratorToolbarFrame
      primary={
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {showTempUrl && onTempSeedUrlChange ? (
            <Input
              type="url"
              className={GENERATOR_FIELD_URL}
              placeholder="https://example.com"
              value={tempSeedUrl}
              onChange={(e) => onTempSeedUrlChange(e.target.value)}
              disabled={workspaceBusy}
              aria-label="Website URL"
            />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              uploadLabel.trim() ? BULK_HEADER_UPLOAD_READY_BTN : BULK_HEADER_TOOL_BTN,
            )}
            disabled={workspaceBusy || csvParsing}
            onClick={() => fileRef.current?.click()}
            aria-label={uploadLabel.trim() ? `Grid CSV: ${uploadLabel}` : "Upload grid CSV"}
            title={uploadLabel.trim() || "Upload grid CSV"}
          >
            {csvParsing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Grid
          </Button>
          <Input
            type="text"
            placeholder="Keyword"
            value={suggestFocusKeyword}
            onChange={(e) => onSuggestFocusKeywordChange(e.target.value)}
            className={GENERATOR_FIELD_KEYWORD}
            disabled={fieldsDisabled}
            autoComplete="off"
            aria-label="Keyword"
          />
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={sapPageBudgetInput}
            onChange={(e) => {
              onSapPageBudgetInputChange(normalizeCompetitorBudgetInputChange(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              const direction = e.key === "ArrowUp" ? "up" : "down";
              const next = stepCompetitorBudgetInput(sapPageBudgetInput, direction);
              if (next === null) return;
              e.preventDefault();
              onSapPageBudgetInputChange(next);
            }}
            className={GENERATOR_FIELD_COUNT}
            disabled={fieldsDisabled}
            aria-label="Competitor count"
            title="Competitor count"
          />
        </>
      }
      actions={
        <>
          <Button
            type="button"
            size="sm"
            className={BULK_HEADER_RUN_BTN}
            disabled={fieldsDisabled}
            aria-busy={runLoading}
            aria-label="Run clusters"
            title="Run clusters"
            onClick={() => void onRunClusters()}
          >
            <Wand2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Clusters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={GENERATOR_EXPORT_BTN}
            disabled={!hasSapRowsForCsv || workspaceBusy}
            aria-label="Download bulk CSV"
            title="Download bulk CSV (bulk-auto-generate-template columns)"
            onClick={onDownloadTargetsCsv}
          >
            Bulk CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={BULK_HEADER_DANGER_ICON_BTN}
            disabled={workspaceBusy}
            aria-label="Clear"
            title="Clear"
            onClick={onClear}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </>
      }
    />
  );
}
