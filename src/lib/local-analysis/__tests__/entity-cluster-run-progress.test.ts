import { describe, expect, it } from "vitest";
import {
  entityClusterHeaderProgress,
  entityClusterRunProgressPct,
} from "@/lib/local-analysis/entity-cluster-run-progress";

describe("entityClusterRunProgressPct", () => {
  it("maps cluster step fraction into the cluster band", () => {
    expect(entityClusterRunProgressPct("cluster", 0, 10)).toBe(14);
    expect(entityClusterRunProgressPct("cluster", 5, 10)).toBeGreaterThan(30);
    expect(entityClusterRunProgressPct("cluster", 10, 10)).toBe(54);
  });

  it("never decreases when minPct is applied", () => {
    const block = entityClusterHeaderProgress({
      phase: "Assigning unique keywords from GSC",
      stage: "keywords",
      stepCompleted: 1,
      stepTotal: 5,
      minPct: 40,
    });
    expect(block.progressPct).toBeGreaterThanOrEqual(40);
    expect(block.completed).toBe(block.progressPct);
    expect(block.total).toBe(100);
  });
});
