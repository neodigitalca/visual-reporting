import type { LocalAnalysisHeaderProgress } from "@/lib/local-analysis/header-progress";

export type EntityClusterRunStage =
  | "start"
  | "prep"
  | "cluster"
  | "keywords"
  | "titles"
  | "meta"
  | "done";

const STAGE_FLOOR: Record<EntityClusterRunStage, number> = {
  start: 0,
  prep: 4,
  cluster: 14,
  keywords: 54,
  titles: 78,
  meta: 90,
  done: 100,
};

const STAGE_SPAN: Partial<Record<EntityClusterRunStage, number>> = {
  prep: 10,
  cluster: 40,
  keywords: 24,
  titles: 12,
  meta: 10,
};

export function entityClusterRunProgressPct(
  stage: EntityClusterRunStage,
  stepCompleted = 0,
  stepTotal = 1,
): number {
  if (stage === "done") return 100;
  if (stage === "start") return 1;
  const span = STAGE_SPAN[stage] ?? 0;
  const frac =
    stepTotal > 0 ? Math.min(1, Math.max(0, stepCompleted / stepTotal)) : 0;
  return Math.min(99, Math.round(STAGE_FLOOR[stage] + span * frac));
}

export function entityClusterStageFromPhase(phase: string): EntityClusterRunStage {
  const p = phase.trim().toLowerCase();
  if (p.startsWith("clusters ready")) return "done";
  if (p.startsWith("clustering")) return "cluster";
  if (p.includes("keyword")) return "keywords";
  if (p.startsWith("writing titles")) return "titles";
  if (p.includes("meta description")) return "meta";
  if (p.startsWith("starting clusters") || p.includes("preparing") || p.includes("profile location")) {
    return "prep";
  }
  return "prep";
}

export function entityClusterHeaderProgress(input: {
  phase: string;
  stage?: EntityClusterRunStage;
  stepCompleted?: number;
  stepTotal?: number;
  /** Never let the bar move backward mid-run. */
  minPct?: number;
}): Pick<LocalAnalysisHeaderProgress, "phase" | "completed" | "total" | "progressPct"> {
  const stage = input.stage ?? entityClusterStageFromPhase(input.phase);
  const raw = entityClusterRunProgressPct(
    stage,
    input.stepCompleted,
    input.stepTotal,
  );
  const progressPct = Math.min(
    100,
    Math.max(input.minPct ?? 0, raw),
  );
  return {
    phase: input.phase,
    completed: progressPct,
    total: 100,
    progressPct,
  };
}
