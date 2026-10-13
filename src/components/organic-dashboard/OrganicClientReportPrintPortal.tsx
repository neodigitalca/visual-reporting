import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export type OrganicClientReportPrintPortalProps = {
  open: boolean;
  children: ReactNode;
};

/** Mounts the client deck on document.body so print CSS can hide all other DOM. */
export function OrganicClientReportPrintPortal({ open, children }: OrganicClientReportPrintPortalProps) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="organic-client-report-print-host">{children}</div>,
    document.body,
  );
}
