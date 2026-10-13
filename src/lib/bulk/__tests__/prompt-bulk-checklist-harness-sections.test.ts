import { describe, expect, it } from "vitest";
import {
  PROMPT_CHECKLIST_PIPELINE_TITLES,
  buildPromptChecklistHarnessSections,
} from "@/lib/bulk/prompt-bulk-checklist-harness-sections";

describe("buildPromptChecklistHarnessSections", () => {
  it("returns empty when not generating", () => {
    expect(buildPromptChecklistHarnessSections("Generating blog ideas…", false)).toEqual([]);
  });

  it("marks blog ideas active during ideas phase", () => {
    const sections = buildPromptChecklistHarnessSections("Generating blog ideas…", true);
    expect(sections).toHaveLength(PROMPT_CHECKLIST_PIPELINE_TITLES.length);
    expect(sections[1]?.title).toBe("Blog ideas");
    expect(sections[1]?.status).toBe("generating");
    expect(sections[0]?.status).toBe("done");
  });

  it("marks all done when phase is Done", () => {
    const sections = buildPromptChecklistHarnessSections("Done", true);
    expect(sections.every((s) => s.status === "done")).toBe(true);
  });
});
