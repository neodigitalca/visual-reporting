import { describe, expect, it } from "vitest";
import { formatPrefilledBulkRowContractFromCsvRow } from "@/lib/bulk/prefilled-bulk-row-contract";

describe("formatPrefilledBulkRowContractFromCsvRow", () => {
  it("omits competitor route keyword from verbatim copy and adds prose rules", () => {
    const block = formatPrefilledBulkRowContractFromCsvRow({
      keyword: "competitor - Highend Blinds Inc",
      keyword_focus: "Highend Blinds Inc",
      entity: "Highend Blinds Inc",
      title: "Choosing blinds with Blind Magic",
      modifier: "Compare locally.",
    });
    expect(block).not.toContain("keyword: competitor");
    expect(block).toContain("focus_keyword (SEO phrase for body copy): Highend Blinds Inc");
    expect(block).toContain("NEVER write \"competitor -\"");
  });
});
