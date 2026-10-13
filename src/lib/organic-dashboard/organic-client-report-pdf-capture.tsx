import { createRoot, type Root } from "react-dom/client";
import { OrganicClientReportExportDocument } from "@/components/organic-dashboard/OrganicClientReportExportDocument";
import type { OrganicClientReportContent } from "@/lib/organic-dashboard/organic-client-report-content";
import { ORGANIC_CLIENT_REPORT_PDF_CAPTURE_CLASS } from "@/lib/organic-dashboard/organic-client-report-pdf-types";

const CAPTURE_HOST_CLASS = "organic-client-report-pdf-capture-host";

export type OrganicClientReportPdfCaptureHandle = {
  rootElement: HTMLElement;
  cleanup: () => void;
};

/** Mounts white export markup off-screen for html2canvas capture. */
export async function mountOrganicClientReportPdfCapture(
  content: OrganicClientReportContent,
): Promise<OrganicClientReportPdfCaptureHandle> {
  const host = document.createElement("div");
  host.className = CAPTURE_HOST_CLASS;
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:720px;overflow:visible;pointer-events:none;opacity:1;";
  document.body.appendChild(host);

  let reactRoot: Root | null = createRoot(host);

  await new Promise<void>((resolve) => {
    reactRoot!.render(<OrganicClientReportExportDocument content={content} />);
    requestAnimationFrame(() => resolve());
  });

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const article = host.querySelector("article.organic-client-report-export");
  if (!(article instanceof HTMLElement)) {
    reactRoot.unmount();
    host.remove();
    throw new Error("Export report markup is missing.");
  }

  article.classList.add(ORGANIC_CLIENT_REPORT_PDF_CAPTURE_CLASS);

  return {
    rootElement: article,
    cleanup: () => {
      reactRoot?.unmount();
      reactRoot = null;
      host.remove();
    },
  };
}
