import { WorkspacePill } from "@/components/shared/WorkspacePill";
import type { AgentRunBucketGroup, AgentRunBucketKey } from "@/lib/agent-runs/agent-run-grouping";
import { cn } from "@/lib/utils";

export type AgentRunsBucketTabsProps = {
  buckets: AgentRunBucketGroup[];
  value: AgentRunBucketKey;
  onChange: (key: AgentRunBucketKey) => void;
  className?: string;
};

export function AgentRunsBucketTabs({
  buckets,
  value,
  onChange,
  className,
}: AgentRunsBucketTabsProps) {
  if (buckets.length === 0) return null;

  return (
    <div
      className={cn("agent-runs-client-group__tabs", className)}
      role="tablist"
      aria-label="Run categories"
    >
      {buckets.map((bucket) => {
        const selected = bucket.key === value;
        return (
          <WorkspacePill
            key={bucket.key}
            label={`${bucket.label} (${bucket.runs.length})`}
            active={selected}
            square
            tone="monochrome"
            onClick={() => onChange(bucket.key)}
            className={cn(
              "agent-runs-client-group__tab",
              bucket.activeCount > 0 && "agent-runs-bucket-tab--has-active",
            )}
          />
        );
      })}
    </div>
  );
}
