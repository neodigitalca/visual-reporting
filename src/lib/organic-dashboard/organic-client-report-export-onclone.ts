const EXPORT_BG = "#ffffff";

/** Minimal clone prep for white export capture (export DOM is already letter-themed). */
export function applyOrganicClientReportExportOnclone(clonedDoc: Document): void {
  const html = clonedDoc.documentElement;
  const body = clonedDoc.body;
  html.style.background = EXPORT_BG;
  body.style.background = EXPORT_BG;
  body.style.margin = "0";
}
