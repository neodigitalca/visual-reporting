import type { ReactNode } from "react";

export type OrganicReportingPrintFrameProps = {
  children: ReactNode;
};

/** Screen dashboard only; client PDF deck prints via body portal. */
export function OrganicReportingPrintFrame({ children }: OrganicReportingPrintFrameProps) {
  return (
    <div
      className="organic-reporting-print-root flex min-h-0 w-full min-w-0 flex-1 flex-col"
      data-reporting-print-root
    >
      <div data-reporting-screen className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
