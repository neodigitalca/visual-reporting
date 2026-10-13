import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AGENT_RUN_SIDEBAR_BUCKET_KEYS,
  AGENT_RUN_SIDEBAR_DEFAULT_BUCKET,
  agentRunBucketIcon,
  agentRunBucketLabel,
} from "@/lib/agent-runs/agent-run-bucket-icons";
import type { AgentRunBucketGroup, AgentRunBucketKey } from "@/lib/agent-runs/agent-run-grouping";
import {
  WORKSPACE_PRIMARY_SELECT_ITEM_CLASS,
  WORKSPACE_PRIMARY_SELECT_MENU_CLASS,
  WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS,
} from "@/components/shared/workspace-primary-select-styles";
import { agentRunsBucketSelectSlotProps } from "@/components/agent-runs/agent-runs-bucket-select-width";
import { cn } from "@/lib/utils";

export type AgentRunsBucketSelectProps = {
  value: AgentRunBucketKey;
  onChange: (key: AgentRunBucketKey) => void;
  buckets?: AgentRunBucketGroup[];
  className?: string;
  disabled?: boolean;
};

export function AgentRunsBucketSelect({
  value,
  onChange,
  buckets = [],
  className,
  disabled = false,
}: AgentRunsBucketSelectProps) {
  const countByKey = useMemo(() => {
    const map = new Map<AgentRunBucketKey, number>();
    for (const bucket of buckets) {
      map.set(bucket.key, bucket.runs.length);
    }
    return map;
  }, [buckets]);

  const resolvedValue = AGENT_RUN_SIDEBAR_BUCKET_KEYS.includes(value)
    ? value
    : AGENT_RUN_SIDEBAR_DEFAULT_BUCKET;

  const ActiveIcon = agentRunBucketIcon(resolvedValue);
  const activeLabel = agentRunBucketLabel(resolvedValue);

  const slot = agentRunsBucketSelectSlotProps();

  return (
    <div
      className={cn("agent-runs-bucket-select-slot flex-none self-center", slot.className, className)}
      style={slot.style}
    >
      <Select
        value={resolvedValue}
        onValueChange={(key) => {
          const next = key as AgentRunBucketKey;
          if (next !== value) onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS,
            "gap-2 py-0 [&>span]:line-clamp-none",
          )}
          aria-label="Run categories"
        >
          <ActiveIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">{activeLabel}</span>
        </SelectTrigger>
        <SelectContent
          position="popper"
          className={cn(
            WORKSPACE_PRIMARY_SELECT_MENU_CLASS,
            "!max-h-none overflow-hidden [&>div]:overflow-hidden",
          )}
          style={slot.style}
        >
          {AGENT_RUN_SIDEBAR_BUCKET_KEYS.map((key) => {
            const Icon = agentRunBucketIcon(key);
            const label = agentRunBucketLabel(key);
            const count = countByKey.get(key) ?? 0;
            return (
              <SelectItem
                key={key}
                value={key}
                className={WORKSPACE_PRIMARY_SELECT_ITEM_CLASS}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label} ({count})
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
