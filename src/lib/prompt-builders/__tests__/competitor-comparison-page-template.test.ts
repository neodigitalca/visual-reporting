import { describe, expect, it } from "vitest";
import {
  formatCompetitorComparisonChecklistBlock,
  formatCompetitorComparisonWriterBlock,
} from "@/lib/prompt-builders/competitor-comparison-page-template";

describe("competitor-comparison-page-template", () => {
  it("checklist block names competitor and connected site", () => {
    const block = formatCompetitorComparisonChecklistBlock("Highend Blinds Inc", "Blind Magic");
    expect(block).toContain("Highend Blinds Inc");
    expect(block).toContain("Blind Magic");
    expect(block).toContain("9 numbered checklist items");
    expect(block).toContain('Forbidden: "near {competitor}"');
  });

  it("writer block forbids geo-slugging the competitor", () => {
    const block = formatCompetitorComparisonWriterBlock("Highend Blinds Inc", "Blind Magic");
    expect(block).toContain("Highend Blinds Inc");
    expect(block).toContain("Blind Magic");
    expect(block).toContain("neighborhood or service area");
  });
});
