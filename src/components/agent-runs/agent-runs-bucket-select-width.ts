import type { CSSProperties } from "react";
import {
  AGENT_RUN_SIDEBAR_BUCKET_KEYS,
  agentRunBucketLabel,
} from "@/lib/agent-runs/agent-run-bucket-icons";
import {
  workspacePrimarySelectSlotProps,
  workspacePrimarySelectWidthStyle,
} from "@/components/shared/workspace-primary-select-styles";

/** Menu rows show counts; reserve width for "(99)" so highlights stay inside the panel. */
const AGENT_RUN_BUCKET_SELECT_LABELS: readonly string[] = AGENT_RUN_SIDEBAR_BUCKET_KEYS.map(
  (key) => `${agentRunBucketLabel(key)} (99)`,
);

const WIDTH_OPTIONS = { itemLeadingIcon: true } as const;

/** Extra rem for icon + gap on the primary trigger (chevron already in width formula). */
const TRIGGER_LEADING_ICON_REM = 1.375;

function withTriggerIconPadding(style: CSSProperties): CSSProperties {
  const w = style.width;
  if (typeof w !== "string" || !w.endsWith("rem")) return style;
  const num = parseFloat(w);
  if (!Number.isFinite(num)) return style;
  const next = `${Math.ceil((num + TRIGGER_LEADING_ICON_REM) * 4) / 4}rem`;
  return { width: next, minWidth: next, maxWidth: next };
}

/** Shared fixed width for trigger slot and dropdown panel (must match). */
export function agentRunsBucketSelectWidthStyle(): CSSProperties {
  const base = workspacePrimarySelectWidthStyle(AGENT_RUN_BUCKET_SELECT_LABELS, WIDTH_OPTIONS);
  return withTriggerIconPadding(base);
}

export function agentRunsBucketSelectSlotProps(): { className: string; style: CSSProperties } {
  const style = agentRunsBucketSelectWidthStyle();
  return {
    className: workspacePrimarySelectSlotProps(AGENT_RUN_BUCKET_SELECT_LABELS, WIDTH_OPTIONS).className,
    style,
  };
}
