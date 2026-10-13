import { describe, expect, it } from "vitest";
import { parseHostingOpsResponse } from "./hosting-ops-schema.mjs";

describe("hosting ops schema", () => {
  it("parses a valid agent report", () => {
    const report = parseHostingOpsResponse({
      summary: "All checks passed.",
      severity: "info",
      recommended_actions: [],
      tools_used: ["get_site_health"],
    });
    expect(report.summary).toBe("All checks passed.");
  });
});
