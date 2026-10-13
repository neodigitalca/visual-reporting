import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { OrganicClientReportDocument } from "@/components/organic-dashboard/OrganicClientReportDocument";
import { Button } from "@/components/ui/button";
import "@/components/organic-dashboard/organic-reporting-client-deck.css";
import {
  deckHighlightsNeedsAgentNarratives,
  readOrganicClientReportDeckSession,
  writeOrganicClientReportDeckSession,
  type OrganicClientReportDeckPayload,
} from "@/lib/organic-dashboard/organic-client-report-deck-session";
import { buildOrganicClientReportContent } from "@/lib/organic-dashboard/organic-client-report-content";
import { downloadOrganicClientReportMarkdown } from "@/lib/organic-dashboard/organic-client-report-markdown";
import { downloadOrganicClientReportPdf } from "@/lib/organic-dashboard/organic-client-report-print";
import {
  buildOrganicReportingHighlightsSnapshot,
  fetchOrganicReportingHighlights,
} from "@/lib/organic-dashboard/organic-reporting-highlights";
import {
  REPORTING_TOOLBAR_DOWNLOAD_MARKDOWN_BTN_CLASS,
  REPORTING_TOOLBAR_DOWNLOAD_PDF_BTN_CLASS,
  REPORTING_TOOLBAR_LABEL_RESERVE_CLASS,
  REPORTING_TOOLBAR_LABEL_SLOT_CLASS,
  REPORTING_TOOLBAR_LABEL_VISIBLE_CLASS,
} from "@/components/organic-dashboard/organic-reporting-toolbar-buttons";

function readDeckPayload(deckId: string, siteId: string): OrganicClientReportDeckPayload | null {
  if (!deckId || !siteId) return null;
  return readOrganicClientReportDeckSession(deckId, siteId);
}

export default function OrganicClientReportPreviewPage() {
  const { siteId = "" } = useParams<{ siteId: string }>();
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deck")?.trim() ?? "";

  const [payload, setPayload] = useState<OrganicClientReportDeckPayload | null>(() =>
    readDeckPayload(deckId, siteId),
  );
  const [hydratingNarratives, setHydratingNarratives] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const reportContent = useMemo(
    () => (payload ? buildOrganicClientReportContent(payload) : null),
    [payload],
  );

  useEffect(() => {
    const data = readDeckPayload(deckId, siteId);
    setPayload(data);
    if (data) {
      document.title = `${data.siteName} Organic Performance`;
    }
  }, [deckId, siteId]);

  useEffect(() => {
    if (!siteId || !deckId) return;

    const data = readDeckPayload(deckId, siteId);
    if (!data || !deckHighlightsNeedsAgentNarratives(data.highlights)) {
      setHydratingNarratives(false);
      return;
    }

    let cancelled = false;
    setHydratingNarratives(true);

    void (async () => {
      try {
        const snapshot = buildOrganicReportingHighlightsSnapshot(
          data.viewModel,
          data.siteName,
          data.siteUrl,
          data.showCompare,
        );
        const highlights = await fetchOrganicReportingHighlights(snapshot, siteId);
        const next: OrganicClientReportDeckPayload = { ...data, highlights };
        writeOrganicClientReportDeckSession(deckId, next);
        if (!cancelled) setPayload(next);
      } catch {
        /* Keep deck visible with stored highlights. */
      } finally {
        if (!cancelled) setHydratingNarratives(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deckId, siteId]);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportContent || !payload) return;
    setPdfError(null);
    setPdfBusy(true);
    try {
      await downloadOrganicClientReportPdf({
        content: reportContent,
        preparedOn: payload.preparedOn,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF export failed.";
      setPdfError(message);
    } finally {
      setPdfBusy(false);
    }
  }, [payload, reportContent]);

  const handleDownloadMarkdown = useCallback(() => {
    if (!reportContent) return;
    setPdfError(null);
    downloadOrganicClientReportMarkdown(reportContent);
  }, [reportContent]);

  if (!deckId || !payload) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 font-sans text-base text-white">
        <p>This client report link is missing or expired. Generate it again from Reporting.</p>
        {siteId ? (
          <Link className="text-base text-primary hover:underline" to={`/sites/${siteId}/organic?section=performance`}>
            Back to Reporting
          </Link>
        ) : (
          <Link className="text-base text-primary hover:underline" to="/">
            Back to Neo Pulse
          </Link>
        )}
      </div>
    );
  }

  const pdfDisabled = hydratingNarratives || pdfBusy;

  return (
    <div className="organic-client-report-preview-shell min-h-dvh overflow-auto">
      <div className="organic-client-report-preview-toolbar organic-client-report-preview-toolbar-actions">
        <Button
          type="button"
          variant="ghost"
          disabled={pdfDisabled}
          className={REPORTING_TOOLBAR_DOWNLOAD_PDF_BTN_CLASS}
          aria-busy={pdfBusy}
          onClick={() => void handleDownloadPdf()}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          <span className={REPORTING_TOOLBAR_LABEL_SLOT_CLASS}>
            <span className={REPORTING_TOOLBAR_LABEL_RESERVE_CLASS} aria-hidden>
              Download PDF
            </span>
            <span className={REPORTING_TOOLBAR_LABEL_VISIBLE_CLASS}>
              {pdfBusy ? "Preparing…" : "Download PDF"}
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={hydratingNarratives}
          className={REPORTING_TOOLBAR_DOWNLOAD_MARKDOWN_BTN_CLASS}
          onClick={handleDownloadMarkdown}
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          <span className={REPORTING_TOOLBAR_LABEL_SLOT_CLASS}>
            <span className={REPORTING_TOOLBAR_LABEL_RESERVE_CLASS} aria-hidden>
              Download Markdown
            </span>
            <span className={REPORTING_TOOLBAR_LABEL_VISIBLE_CLASS}>Download Markdown</span>
          </span>
        </Button>
      </div>
      {pdfError ? (
        <p className="px-4 py-2 font-sans text-base text-destructive md:px-8 lg:px-10" role="alert">
          {pdfError}
        </p>
      ) : null}
      {hydratingNarratives ? (
        <p className="px-4 py-3 font-sans text-base text-muted-foreground md:px-8 lg:px-10">
          Generating performance and keyword breakdown…
        </p>
      ) : null}
      <OrganicClientReportDocument
        viewModel={payload.viewModel}
        highlights={payload.highlights}
        siteName={payload.siteName}
        siteUrl={payload.siteUrl}
        showCompare={payload.showCompare}
        preparedOn={payload.preparedOn}
      />
    </div>
  );
}
