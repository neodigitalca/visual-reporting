import { ArrowDown, ArrowUp } from "lucide-react";
import type { OrganicGscMetricDelta } from "@/lib/organic-dashboard/organic-dashboard-view-model";
import { cn } from "@/lib/utils";

export function OrganicMetricDelta({ delta }: { delta: OrganicGscMetricDelta }) {
  if (delta.deltaPercent == null) {
    return <span className="inline-block min-h-[1.25rem] min-w-[3.5rem]" aria-hidden />;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-base tabular-nums",
        delta.deltaPositive ? "text-primary" : "text-destructive",
      )}
    >
      {delta.deltaPositive ? (
        <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {delta.deltaPercent.toFixed(1)}%
    </span>
  );
}
