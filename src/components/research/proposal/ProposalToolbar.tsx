import { type ChangeEvent, type ReactNode, type RefObject } from "react";
import { Copy, Download, Loader2, Package, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneratorToolbarFrame } from "@/components/blog-generator/GeneratorToolbarFrame";
import {
  BULK_HEADER_ICON_TOOL_BTN,
  BULK_HEADER_RUN_BTN,
  BULK_HEADER_TOOL_BTN,
} from "@/components/keyword-research/bulk/bulk-workspace-header-styles";

export type ProposalToolbarProps = {
  busy: boolean;
  phase: "idle" | "semrush" | "report";
  gridCsvBusy: boolean;
  hasSemrushRows: boolean;
  proposalPackageDisabled: boolean;
  hasCombinedMd: boolean;
  gridCsvFileRef: RefObject<HTMLInputElement | null>;
  onGridCsvFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDownloadGridCsv: () => void;
  onAnalyze: () => void;
  onGenerateProposal: () => void;
  onCopyProposal: () => void;
  onDownloadProposalPackage: () => void;
  /** Research mode switch (Proposal / Citation / Backlinking), first in the row. */
  modeMenu?: ReactNode;
};

export function ProposalToolbar({
  busy,
  phase,
  gridCsvBusy,
  hasSemrushRows,
  proposalPackageDisabled,
  hasCombinedMd,
  gridCsvFileRef,
  onGridCsvFileChange,
  onDownloadGridCsv,
  onAnalyze,
  onGenerateProposal,
  onCopyProposal,
  onDownloadProposalPackage,
  modeMenu,
}: ProposalToolbarProps) {
  return (
    <GeneratorToolbarFrame
      primary={
        <>
          {modeMenu}
          <input
            ref={gridCsvFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onGridCsvFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_TOOL_BTN}
            disabled={busy}
            aria-label="Upload grid CSV"
            title="Upload grid CSV"
            onClick={() => gridCsvFileRef.current?.click()}
          >
            {gridCsvBusy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Grid
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_TOOL_BTN}
            disabled={busy}
            title="Analyze with Semrush"
            onClick={onAnalyze}
          >
            {phase === "semrush" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
            Analyze
          </Button>
        </>
      }
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_ICON_TOOL_BTN}
            disabled={busy || !hasSemrushRows}
            aria-label="Download grid CSV"
            title="Download grid CSV"
            onClick={onDownloadGridCsv}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_ICON_TOOL_BTN}
            disabled={proposalPackageDisabled || !hasCombinedMd}
            aria-label="Copy proposal"
            title="Copy proposal"
            onClick={onCopyProposal}
          >
            <Copy className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={BULK_HEADER_ICON_TOOL_BTN}
            disabled={proposalPackageDisabled}
            aria-label="Download proposal package"
            title="Download proposal package"
            onClick={onDownloadProposalPackage}
          >
            <Package className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            className={BULK_HEADER_RUN_BTN}
            disabled={busy}
            aria-label="Generate proposal"
            title="Includes DataForSEO speed + FAQ audit on up to 10 GSC top pages when connected"
            onClick={onGenerateProposal}
          >
            {phase === "semrush" || phase === "report" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Proposal
          </Button>
        </>
      }
    />
  );
}
