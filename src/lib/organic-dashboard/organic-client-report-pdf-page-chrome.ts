import type { jsPDF } from "jspdf";
import { AGENCY_NAME } from "@/lib/report-planner";
import type { OrganicClientReportPdfTheme } from "@/lib/organic-dashboard/organic-client-report-pdf-types";

export type ReportPdfPageChromeOptions = {
  preparedOn: string;
  theme: OrganicClientReportPdfTheme;
  marginIn: number;
};

/** Draws running footer on every page (vector text, not rasterized). */
export function drawReportPdfPageFooters(pdf: jsPDF, options: ReportPdfPageChromeOptions): void {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeightFull = pdf.internal.pageSize.getHeight();
  const { marginIn, preparedOn } = options;
  const footerInsetIn = marginIn > 0 ? marginIn * 0.55 : 0.35;
  const y = pageHeightFull - footerInsetIn;
  const edgePadIn = marginIn > 0 ? marginIn : 0.5;
  const fontSize = 9;

  pdf.setFontSize(fontSize);
  pdf.setTextColor(82, 82, 91);

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    pdf.text(AGENCY_NAME, edgePadIn, y, { align: "left" });
    pdf.text(`Prepared ${preparedOn}`, pageWidth / 2, y, { align: "center" });
    pdf.text(`${page} of ${totalPages}`, pageWidth - edgePadIn, y, { align: "right" });
  }
}
