import { describe, expect, it } from "vitest";
import type { CSVRow } from "@/lib/bulk/bulk-csv-parser";
import { resolveBulkPrimaryKeyword } from "@/lib/bulk/bulk-primary-keyword";
import type { KeywordData } from "@/lib/keyword-types";

const emptyKwData = { keyword: "" } as KeywordData;

describe("resolveBulkPrimaryKeyword", () => {
  it("uses keyword_focus when CSV keyword is competitor-prefixed", () => {
    const row: CSVRow = {
      keyword: "competitor - Solar Blinds",
      keyword_focus: "Solar Blinds",
      title: "Choosing blinds locally",
    };
    expect(resolveBulkPrimaryKeyword(row, row, emptyKwData)).toBe("Solar Blinds");
  });

  it("keeps normal CSV keyword when not competitor-prefixed", () => {
    const row: CSVRow = {
      keyword: "blinds near me",
      title: "Guide",
    };
    expect(resolveBulkPrimaryKeyword(row, row, emptyKwData)).toBe("blinds near me");
  });
});
